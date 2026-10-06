import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { UserRole } from "../common/constants/roles.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { AssignAssistanceRequestDto } from "./dto/assign-assistance-request.dto.js";
import { CreateAssistanceRequestDto } from "./dto/create-assistance-request.dto.js";
import { CreateAssistanceUpdateDto } from "./dto/create-assistance-update.dto.js";
import {
  ASSISTANCE_STATUSES,
  ListAssistanceRequestsQueryDto,
} from "./dto/list-assistance-requests-query.dto.js";
import { UpdateAssistancePriorityDto } from "./dto/update-assistance-priority.dto.js";
import { UpdateAssistanceStatusDto } from "./dto/update-assistance-status.dto.js";

type AssistanceRequestRecord = {
  assistanceRequestId: bigint;
  ticketCode: string;
  chapterId: bigint;
  submittedByUserId: bigint;
  category: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  assignedToUserId: bigint | null;
  submittedAt: Date;
  resolvedAt: Date | null;
  updatedAt: Date | null;
  chapter: {
    chapterId: bigint;
    schoolName: string;
    chapterName: string;
    acronym: string | null;
  };
  submittedBy: {
    userId: bigint;
    firstName: string;
    lastName: string;
    email: string;
  };
  assignedTo: {
    userId: bigint;
    firstName: string;
    lastName: string;
  } | null;
};

type AssistanceUpdateRecord = {
  updateId: bigint;
  message: string;
  newStatus: string | null;
  isInternalNote: boolean;
  createdAt: Date;
  user: {
    userId: bigint;
    firstName: string;
    lastName: string;
  };
};

const requestInclude = {
  chapter: {
    select: {
      chapterId: true,
      schoolName: true,
      chapterName: true,
      acronym: true,
    },
  },
  submittedBy: {
    select: {
      userId: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
  assignedTo: {
    select: {
      userId: true,
      firstName: true,
      lastName: true,
    },
  },
} as const;

const allowedStatusTransitions: Record<string, string[]> = {
  Submitted: ["Under Review", "In Progress", "Resolved"],
  "Under Review": ["In Progress", "Resolved"],
  "In Progress": ["Under Review", "Resolved"],
  Resolved: ["In Progress", "Closed"],
  Closed: [],
};

@Injectable()
export class AssistanceRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async listChapterRequests(chapterId: bigint) {
    const requests = await this.prisma.assistanceRequest.findMany({
      where: { chapterId },
      include: requestInclude,
      orderBy: { submittedAt: "desc" },
    });

    return requests.map((request) => this.toRequestSummary(request));
  }

  async getChapterRequest(
    assistanceRequestId: bigint,
    chapterId: bigint,
  ) {
    const request = await this.prisma.assistanceRequest.findFirst({
      where: {
        assistanceRequestId,
        chapterId,
      },
      include: {
        ...requestInclude,
        updates: {
          where: {
            isInternalNote: false,
          },
          include: {
            user: {
              select: {
                userId: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException("Assistance request was not found.");
    }

    return {
      ...this.toRequestSummary(request),
      description: request.description,
      updates: request.updates.map((update) =>
        this.toPublicUpdate(update),
      ),
    };
  }

  async createRequest(
    input: CreateAssistanceRequestDto,
    chapterId: bigint,
    submittedByUserId: bigint,
  ) {
    await this.ensureChapterExists(chapterId);

    const ticketCode = await this.generateUniqueTicketCode();

    const request = await this.prisma.assistanceRequest.create({
      data: {
        ticketCode,
        chapterId,
        submittedByUserId,
        category: this.requiredText(input.category, "Category"),
        subject: this.requiredText(input.subject, "Subject"),
        description: this.requiredText(input.description, "Description"),
        priority: input.priority,
        status: "Submitted",
      },
      include: requestInclude,
    });

    return {
      message: "Assistance request submitted successfully.",
      request: {
        ...this.toRequestSummary(request),
        description: request.description,
        updates: [],
      },
    };
  }

  async listRegionalRequests(filters: ListAssistanceRequestsQueryDto) {
    const chapterId = filters.chapterId
      ? this.parsePositiveId(filters.chapterId, "Chapter")
      : undefined;

    const requests = await this.prisma.assistanceRequest.findMany({
      where: {
        status: filters.status,
        priority: filters.priority,
        chapterId,
      },
      include: requestInclude,
      orderBy: [
        { priority: "desc" },
        { submittedAt: "desc" },
      ],
    });

    return requests.map((request) => this.toRequestSummary(request));
  }

  async getRegionalRequest(assistanceRequestId: bigint) {
    const request = await this.prisma.assistanceRequest.findUnique({
      where: { assistanceRequestId },
      include: {
        ...requestInclude,
        updates: {
          include: {
            user: {
              select: {
                userId: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException("Assistance request was not found.");
    }

    return {
      ...this.toRequestSummary(request),
      description: request.description,
      updates: request.updates.map((update) =>
        this.toRegionalUpdate(update),
      ),
    };
  }

  async listAssignableRegionalUsers() {
    const users = await this.prisma.user.findMany({
      where: {
        role: {
          in: [UserRole.RegionalAdmin, UserRole.RegionalOfficer],
        },
        isApproved: true,
        isActive: true,
      },
      select: {
        userId: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
      orderBy: [
        { role: "asc" },
        { lastName: "asc" },
        { firstName: "asc" },
      ],
    });

    return users.map((user) => ({
      userId: user.userId.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    }));
  }

  async assignRequest(
    assistanceRequestId: bigint,
    input: AssignAssistanceRequestDto,
  ) {
    await this.ensureRequestExists(assistanceRequestId);

    const assignedToUserId =
      input.userId === undefined || input.userId === null
        ? null
        : this.parsePositiveId(input.userId, "User");

    if (assignedToUserId !== null) {
      await this.ensureAssignableRegionalUser(assignedToUserId);
    }

    const request = await this.prisma.assistanceRequest.update({
      where: { assistanceRequestId },
      data: {
        assignedToUserId,
        updatedAt: new Date(),
      },
      include: requestInclude,
    });

    return {
      message:
        assignedToUserId === null
          ? "Assistance request unassigned successfully."
          : "Assistance request assigned successfully.",
      request: this.toRequestSummary(request),
    };
  }

  async updatePriority(
    assistanceRequestId: bigint,
    input: UpdateAssistancePriorityDto,
  ) {
    await this.ensureRequestExists(assistanceRequestId);

    const request = await this.prisma.assistanceRequest.update({
      where: { assistanceRequestId },
      data: {
        priority: input.priority,
        updatedAt: new Date(),
      },
      include: requestInclude,
    });

    return {
      message: "Assistance request priority updated successfully.",
      request: this.toRequestSummary(request),
    };
  }

  async addUpdate(
    assistanceRequestId: bigint,
    input: CreateAssistanceUpdateDto,
    userId: bigint,
  ) {
    await this.ensureRequestExists(assistanceRequestId);

    const update = await this.prisma.assistanceRequestUpdate.create({
      data: {
        assistanceRequestId,
        userId,
        message: this.requiredText(input.message, "Message"),
        isInternalNote: input.isInternalNote ?? false,
      },
      include: {
        user: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    await this.prisma.assistanceRequest.update({
      where: { assistanceRequestId },
      data: { updatedAt: new Date() },
    });

    return {
      message: input.isInternalNote
        ? "Internal note added successfully."
        : "Request update posted successfully.",
      update: this.toRegionalUpdate(update),
    };
  }

  async updateStatus(
    assistanceRequestId: bigint,
    input: UpdateAssistanceStatusDto,
    userId: bigint,
  ) {
    const existing = await this.prisma.assistanceRequest.findUnique({
      where: { assistanceRequestId },
      select: {
        assistanceRequestId: true,
        status: true,
        resolvedAt: true,
      },
    });

    if (!existing) {
      throw new NotFoundException("Assistance request was not found.");
    }

    if (!ASSISTANCE_STATUSES.includes(input.status)) {
      throw new BadRequestException("Invalid assistance request status.");
    }

    if (existing.status === input.status) {
      throw new BadRequestException(
        `Assistance request is already ${input.status}.`,
      );
    }

    const allowed = allowedStatusTransitions[existing.status] ?? [];

    if (!allowed.includes(input.status)) {
      throw new BadRequestException(
        `Status cannot change from ${existing.status} to ${input.status}.`,
      );
    }

    const now = new Date();
    const resolvedAt =
      input.status === "Resolved"
        ? now
        : input.status === "In Progress"
          ? null
          : existing.resolvedAt;

    await this.prisma.$transaction(async (transaction) => {
      await transaction.assistanceRequest.update({
        where: { assistanceRequestId },
        data: {
          status: input.status,
          resolvedAt,
          updatedAt: now,
        },
      });

      await transaction.assistanceRequestUpdate.create({
        data: {
          assistanceRequestId,
          userId,
          message:
            input.message?.trim() ||
            `Status changed from ${existing.status} to ${input.status}.`,
          newStatus: input.status,
          isInternalNote: false,
        },
      });
    });

    return {
      message: `Assistance request moved to ${input.status}.`,
      request: await this.getRegionalRequest(assistanceRequestId),
    };
  }

  private async ensureChapterExists(chapterId: bigint) {
    const chapter = await this.prisma.chapter.findUnique({
      where: { chapterId },
      select: {
        chapterId: true,
        status: true,
      },
    });

    if (!chapter) {
      throw new BadRequestException("Your linked chapter was not found.");
    }

    if (chapter.status !== "Active") {
      throw new BadRequestException(
        "Assistance requests can only be submitted for an active chapter.",
      );
    }
  }

  private async ensureRequestExists(assistanceRequestId: bigint) {
    const request = await this.prisma.assistanceRequest.findUnique({
      where: { assistanceRequestId },
      select: { assistanceRequestId: true },
    });

    if (!request) {
      throw new NotFoundException("Assistance request was not found.");
    }
  }

  private async ensureAssignableRegionalUser(userId: bigint) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        role: true,
        isApproved: true,
        isActive: true,
      },
    });

    if (
      !user ||
      !user.isApproved ||
      !user.isActive ||
      ![UserRole.RegionalAdmin, UserRole.RegionalOfficer].includes(
        user.role as UserRole,
      )
    ) {
      throw new BadRequestException(
        "The selected user cannot be assigned to regional assistance requests.",
      );
    }
  }

  private async generateUniqueTicketCode() {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const ticketCode = this.generateTicketCode();
      const existing = await this.prisma.assistanceRequest.findUnique({
        where: { ticketCode },
        select: { assistanceRequestId: true },
      });

      if (!existing) {
        return ticketCode;
      }
    }

    throw new InternalServerErrorException(
      "Unable to generate a unique assistance ticket. Please try again.",
    );
  }

  private generateTicketCode() {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const day = String(now.getUTCDate()).padStart(2, "0");
    const suffix = randomBytes(4).toString("hex").toUpperCase();

    return `R3-${year}${month}${day}-${suffix}`;
  }

  private parsePositiveId(value: string, label: string) {
    if (!/^\d+$/.test(value)) {
      throw new BadRequestException(
        `${label} ID must be a positive integer.`,
      );
    }

    const parsed = BigInt(value);

    if (parsed <= 0n) {
      throw new BadRequestException(
        `${label} ID must be a positive integer.`,
      );
    }

    return parsed;
  }

  private requiredText(value: string, label: string) {
    const trimmed = value.trim();

    if (!trimmed) {
      throw new BadRequestException(`${label} is required.`);
    }

    return trimmed;
  }

  private toRequestSummary(request: AssistanceRequestRecord) {
    return {
      assistanceRequestId: request.assistanceRequestId.toString(),
      ticketCode: request.ticketCode,
      category: request.category,
      subject: request.subject,
      priority: request.priority,
      status: request.status,
      submittedAt: request.submittedAt,
      resolvedAt: request.resolvedAt,
      updatedAt: request.updatedAt,
      chapter: {
        chapterId: request.chapter.chapterId.toString(),
        schoolName: request.chapter.schoolName,
        chapterName: request.chapter.chapterName,
        acronym: request.chapter.acronym,
      },
      submittedBy: {
        userId: request.submittedBy.userId.toString(),
        firstName: request.submittedBy.firstName,
        lastName: request.submittedBy.lastName,
        email: request.submittedBy.email,
      },
      assignedTo: request.assignedTo
        ? {
            userId: request.assignedTo.userId.toString(),
            firstName: request.assignedTo.firstName,
            lastName: request.assignedTo.lastName,
          }
        : null,
    };
  }

  private toPublicUpdate(update: AssistanceUpdateRecord) {
    return {
      updateId: update.updateId.toString(),
      message: update.message,
      newStatus: update.newStatus,
      createdAt: update.createdAt,
      user: {
        userId: update.user.userId.toString(),
        firstName: update.user.firstName,
        lastName: update.user.lastName,
      },
    };
  }

  private toRegionalUpdate(update: AssistanceUpdateRecord) {
    return {
      ...this.toPublicUpdate(update),
      isInternalNote: update.isInternalNote,
    };
  }
}
