import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service.js";
import { CreateAssistanceRequestDto } from "./dto/create-assistance-request.dto.js";

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
}
