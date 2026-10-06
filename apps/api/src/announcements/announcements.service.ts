import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { CreateAnnouncementDto } from "./dto/create-announcement.dto.js";
import { UpdateAnnouncementDto } from "./dto/update-announcement.dto.js";

type AnnouncementRecord = {
  announcementId: bigint;
  title: string;
  content: string;
  category: string;
  visibility: string;
  coverImageUrl: string | null;
  externalLink: string | null;
  isPinned: boolean;
  isPublished: boolean;
  publishedAt: Date | null;
  expiresAt: Date | null;
  createdByUserId: bigint;
  createdAt: Date;
  updatedAt: Date | null;
  createdBy: {
    userId: bigint;
    firstName: string;
    lastName: string;
  };
};

const announcementInclude = {
  createdBy: {
    select: {
      userId: true,
      firstName: true,
      lastName: true,
    },
  },
} as const;

@Injectable()
export class AnnouncementsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublicAnnouncements() {
    const now = new Date();
    const announcements = await this.prisma.announcement.findMany({
      where: {
        isPublished: true,
        visibility: "Public",
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      include: announcementInclude,
      orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
    });

    return announcements.map((announcement) =>
      this.toPublicAnnouncement(announcement),
    );
  }

  async getPublicAnnouncement(announcementId: bigint) {
    const now = new Date();
    const announcement = await this.prisma.announcement.findFirst({
      where: {
        announcementId,
        isPublished: true,
        visibility: "Public",
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      include: announcementInclude,
    });

    if (!announcement) {
      throw new NotFoundException("Announcement was not found.");
    }

    return this.toPublicAnnouncement(announcement);
  }

  async listMemberAnnouncements() {
    const now = new Date();
    const announcements = await this.prisma.announcement.findMany({
      where: {
        isPublished: true,
        visibility: { in: ["Public", "MembersOnly"] },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      include: announcementInclude,
      orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
    });

    return announcements.map((announcement) =>
      this.toMemberAnnouncement(announcement),
    );
  }

  async getMemberAnnouncement(announcementId: bigint) {
    const now = new Date();
    const announcement = await this.prisma.announcement.findFirst({
      where: {
        announcementId,
        isPublished: true,
        visibility: { in: ["Public", "MembersOnly"] },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      include: announcementInclude,
    });

    if (!announcement) {
      throw new NotFoundException("Announcement was not found.");
    }

    return this.toMemberAnnouncement(announcement);
  }

  async listAdminAnnouncements() {
    const announcements = await this.prisma.announcement.findMany({
      include: announcementInclude,
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    });

    return announcements.map((announcement) =>
      this.toAdminAnnouncement(announcement),
    );
  }

  async getAdminAnnouncement(announcementId: bigint) {
    const announcement = await this.findAdminAnnouncement(announcementId);
    return this.toAdminAnnouncement(announcement);
  }

  async createAnnouncement(
    input: CreateAnnouncementDto,
    createdByUserId: bigint,
  ) {
    const announcement = await this.prisma.announcement.create({
      data: {
        title: this.requiredText(input.title, "Title"),
        content: this.requiredText(input.content, "Content"),
        category: this.requiredText(input.category, "Category"),
        visibility: input.visibility ?? "Public",
        coverImageUrl: this.optionalText(input.coverImageUrl),
        externalLink: this.optionalText(input.externalLink),
        expiresAt: this.parseExpiry(input.expiresAt),
        createdByUserId,
        isPinned: false,
        isPublished: false,
      },
      include: announcementInclude,
    });

    return {
      message: "Announcement created successfully.",
      announcement: this.toAdminAnnouncement(announcement),
    };
  }

  async updateAnnouncement(
    announcementId: bigint,
    input: UpdateAnnouncementDto,
  ) {
    await this.ensureAnnouncementExists(announcementId);

    const announcement = await this.prisma.announcement.update({
      where: { announcementId },
      data: {
        title:
          input.title === undefined
            ? undefined
            : this.requiredText(input.title, "Title"),
        content:
          input.content === undefined
            ? undefined
            : this.requiredText(input.content, "Content"),
        category:
          input.category === undefined
            ? undefined
            : this.requiredText(input.category, "Category"),
        visibility: input.visibility,
        coverImageUrl: this.optionalText(input.coverImageUrl),
        externalLink: this.optionalText(input.externalLink),
        expiresAt:
          input.expiresAt === undefined
            ? undefined
            : this.parseExpiry(input.expiresAt),
        updatedAt: new Date(),
      },
      include: announcementInclude,
    });

    return {
      message: "Announcement updated successfully.",
      announcement: this.toAdminAnnouncement(announcement),
    };
  }

  async setPublished(announcementId: bigint, isPublished: boolean) {
    const existing = await this.findAdminAnnouncement(announcementId);

    if (
      isPublished &&
      existing.expiresAt &&
      existing.expiresAt.getTime() <= Date.now()
    ) {
      throw new BadRequestException(
        "An expired announcement cannot be published.",
      );
    }

    const announcement = await this.prisma.announcement.update({
      where: { announcementId },
      data: {
        isPublished,
        publishedAt: isPublished
          ? existing.publishedAt ?? new Date()
          : null,
        updatedAt: new Date(),
      },
      include: announcementInclude,
    });

    return {
      message: isPublished
        ? "Announcement published successfully."
        : "Announcement unpublished successfully.",
      announcement: this.toAdminAnnouncement(announcement),
    };
  }

  async setPinned(announcementId: bigint, isPinned: boolean) {
    const existing = await this.findAdminAnnouncement(announcementId);

    if (isPinned && !existing.isPublished) {
      throw new BadRequestException(
        "Publish the announcement before pinning it.",
      );
    }

    const announcement = await this.prisma.announcement.update({
      where: { announcementId },
      data: {
        isPinned,
        updatedAt: new Date(),
      },
      include: announcementInclude,
    });

    return {
      message: isPinned
        ? "Announcement pinned successfully."
        : "Announcement unpinned successfully.",
      announcement: this.toAdminAnnouncement(announcement),
    };
  }

  async deleteAnnouncement(announcementId: bigint) {
    await this.ensureAnnouncementExists(announcementId);
    await this.prisma.announcement.delete({
      where: { announcementId },
    });

    return {
      message: "Announcement deleted successfully.",
    };
  }

  private async findAdminAnnouncement(announcementId: bigint) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { announcementId },
      include: announcementInclude,
    });

    if (!announcement) {
      throw new NotFoundException("Announcement was not found.");
    }

    return announcement;
  }

  private async ensureAnnouncementExists(announcementId: bigint) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { announcementId },
      select: { announcementId: true },
    });

    if (!announcement) {
      throw new NotFoundException("Announcement was not found.");
    }
  }

  private requiredText(value: string, label: string) {
    const trimmed = value.trim();

    if (!trimmed) {
      throw new BadRequestException(`${label} is required.`);
    }

    return trimmed;
  }

  private optionalText(value: string | undefined) {
    if (value === undefined) {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed || null;
  }

  private parseExpiry(value: string | null | undefined) {
    if (value === undefined) {
      return undefined;
    }

    if (value === null || value.trim() === "") {
      return null;
    }

    const expiresAt = new Date(value);

    if (Number.isNaN(expiresAt.getTime())) {
      throw new BadRequestException("Expiration date is invalid.");
    }

    return expiresAt;
  }

  private toPublicAnnouncement(announcement: AnnouncementRecord) {
    return {
      announcementId: announcement.announcementId.toString(),
      title: announcement.title,
      content: announcement.content,
      category: announcement.category,
      coverImageUrl: announcement.coverImageUrl,
      externalLink: announcement.externalLink,
      isPinned: announcement.isPinned,
      publishedAt: announcement.publishedAt,
      expiresAt: announcement.expiresAt,
      createdBy: {
        userId: announcement.createdBy.userId.toString(),
        firstName: announcement.createdBy.firstName,
        lastName: announcement.createdBy.lastName,
      },
    };
  }

  private toMemberAnnouncement(announcement: AnnouncementRecord) {
    return {
      ...this.toPublicAnnouncement(announcement),
      visibility: announcement.visibility,
    };
  }

  private toAdminAnnouncement(announcement: AnnouncementRecord) {
    return {
      ...this.toMemberAnnouncement(announcement),
      isPublished: announcement.isPublished,
      createdByUserId: announcement.createdByUserId.toString(),
      createdAt: announcement.createdAt,
      updatedAt: announcement.updatedAt,
    };
  }
}
