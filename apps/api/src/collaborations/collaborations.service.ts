import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { CreateCollaborationPostDto } from "./dto/create-collaboration-post.dto.js";
import { ListCollaborationsQueryDto } from "./dto/list-collaborations-query.dto.js";
import { UpdateCollaborationPostDto } from "./dto/update-collaboration-post.dto.js";

type CollaborationRecord = {
  collaborationPostId: bigint;
  chapterId: bigint;
  createdByUserId: bigint;
  collaborationType: string;
  title: string;
  description: string;
  eventName: string | null;
  eventDate: Date | null;
  location: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactNumber: string | null;
  status: string;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date | null;
  chapter: {
    chapterId: bigint;
    schoolName: string;
    chapterName: string;
    acronym: string | null;
  };
  createdBy: {
    userId: bigint;
    firstName: string;
    lastName: string;
  };
};

const postInclude = {
  chapter: {
    select: {
      chapterId: true,
      schoolName: true,
      chapterName: true,
      acronym: true,
    },
  },
  createdBy: {
    select: {
      userId: true,
      firstName: true,
      lastName: true,
    },
  },
} as const;

@Injectable()
export class CollaborationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listOpenPosts(query: ListCollaborationsQueryDto) {
    const now = new Date();
    const type = query.type?.trim();

    const posts = await this.prisma.collaborationPost.findMany({
      where: {
        status: "Open",
        collaborationType: type
          ? {
              equals: type,
              mode: "insensitive",
            }
          : undefined,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      include: postInclude,
      orderBy: [{ createdAt: "desc" }],
    });

    return posts.map((post) => this.toPost(post));
  }

  async getOpenPost(collaborationPostId: bigint) {
    const now = new Date();
    const post = await this.prisma.collaborationPost.findFirst({
      where: {
        collaborationPostId,
        status: "Open",
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      include: postInclude,
    });

    if (!post) {
      throw new NotFoundException("Collaboration post was not found.");
    }

    return this.toPost(post);
  }

  async listMyPosts(chapterId: bigint, userId: bigint) {
    const posts = await this.prisma.collaborationPost.findMany({
      where: {
        chapterId,
        createdByUserId: userId,
      },
      include: postInclude,
      orderBy: [{ createdAt: "desc" }],
    });

    return posts.map((post) => this.toPost(post));
  }

  async getMyPost(
    collaborationPostId: bigint,
    chapterId: bigint,
    userId: bigint,
  ) {
    const post = await this.prisma.collaborationPost.findFirst({
      where: {
        collaborationPostId,
        chapterId,
        createdByUserId: userId,
      },
      include: postInclude,
    });

    if (!post) {
      throw new NotFoundException("Collaboration post was not found.");
    }

    return this.toPost(post);
  }

  async createPost(
    input: CreateCollaborationPostDto,
    chapterId: bigint,
    createdByUserId: bigint,
  ) {
    await this.ensureActiveChapter(chapterId);

    const eventDate = this.parseOptionalDate(input.eventDate, "Event date");
    const expiresAt = this.parseOptionalDate(input.expiresAt, "Expiration date");

    if (expiresAt && expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException(
        "Expiration date must be in the future.",
      );
    }

    const post = await this.prisma.collaborationPost.create({
      data: {
        chapterId,
        createdByUserId,
        collaborationType: this.requiredText(
          input.collaborationType,
          "Collaboration type",
        ),
        title: this.requiredText(input.title, "Title"),
        description: this.requiredText(input.description, "Description"),
        eventName: this.optionalText(input.eventName),
        eventDate,
        location: this.optionalText(input.location),
        contactName: this.optionalText(input.contactName),
        contactEmail: this.optionalText(input.contactEmail),
        contactNumber: this.optionalText(input.contactNumber),
        expiresAt,
        status: "Open",
      },
      include: postInclude,
    });

    return {
      message: "Collaboration post created successfully.",
      post: this.toPost(post),
    };
  }

  async updatePost(
    collaborationPostId: bigint,
    input: UpdateCollaborationPostDto,
    chapterId: bigint,
    userId: bigint,
  ) {
    const existing = await this.findOwnedPost(
      collaborationPostId,
      chapterId,
      userId,
    );

    if (existing.status !== "Open") {
      throw new BadRequestException(
        "Closed collaboration posts cannot be edited.",
      );
    }

    const eventDate =
      input.eventDate === undefined
        ? undefined
        : this.parseOptionalDate(input.eventDate, "Event date");
    const expiresAt =
      input.expiresAt === undefined
        ? undefined
        : this.parseOptionalDate(input.expiresAt, "Expiration date");

    if (expiresAt && expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException(
        "Expiration date must be in the future.",
      );
    }

    const post = await this.prisma.collaborationPost.update({
      where: { collaborationPostId },
      data: {
        collaborationType:
          input.collaborationType === undefined
            ? undefined
            : this.requiredText(
                input.collaborationType,
                "Collaboration type",
              ),
        title:
          input.title === undefined
            ? undefined
            : this.requiredText(input.title, "Title"),
        description:
          input.description === undefined
            ? undefined
            : this.requiredText(input.description, "Description"),
        eventName: this.optionalText(input.eventName),
        eventDate,
        location: this.optionalText(input.location),
        contactName: this.optionalText(input.contactName),
        contactEmail: this.optionalText(input.contactEmail),
        contactNumber: this.optionalText(input.contactNumber),
        expiresAt,
        updatedAt: new Date(),
      },
      include: postInclude,
    });

    return {
      message: "Collaboration post updated successfully.",
      post: this.toPost(post),
    };
  }

  async closePost(
    collaborationPostId: bigint,
    chapterId: bigint,
    userId: bigint,
  ) {
    const existing = await this.findOwnedPost(
      collaborationPostId,
      chapterId,
      userId,
    );

    if (existing.status === "Closed") {
      throw new BadRequestException(
        "Collaboration post is already closed.",
      );
    }

    const post = await this.prisma.collaborationPost.update({
      where: { collaborationPostId },
      data: {
        status: "Closed",
        updatedAt: new Date(),
      },
      include: postInclude,
    });

    return {
      message: "Collaboration post closed successfully.",
      post: this.toPost(post),
    };
  }

  async deletePost(
    collaborationPostId: bigint,
    chapterId: bigint,
    userId: bigint,
  ) {
    await this.findOwnedPost(collaborationPostId, chapterId, userId);

    await this.prisma.collaborationPost.delete({
      where: { collaborationPostId },
    });

    return {
      message: "Collaboration post deleted successfully.",
    };
  }

  private async findOwnedPost(
    collaborationPostId: bigint,
    chapterId: bigint,
    userId: bigint,
  ) {
    const post = await this.prisma.collaborationPost.findUnique({
      where: { collaborationPostId },
      select: {
        collaborationPostId: true,
        chapterId: true,
        createdByUserId: true,
        status: true,
      },
    });

    if (!post) {
      throw new NotFoundException("Collaboration post was not found.");
    }

    if (
      post.chapterId !== chapterId ||
      post.createdByUserId !== userId
    ) {
      throw new ForbiddenException(
        "You can only manage collaboration posts that you created.",
      );
    }

    return post;
  }

  private async ensureActiveChapter(chapterId: bigint) {
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
        "Only active chapters can create collaboration posts.",
      );
    }
  }

  private parseOptionalDate(
    value: string | null | undefined,
    label: string,
  ) {
    if (value === undefined || value === null || value.trim() === "") {
      return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${label} is invalid.`);
    }

    return date;
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

  private derivedStatus(post: CollaborationRecord) {
    if (post.status === "Closed") {
      return "Closed";
    }

    if (post.expiresAt && post.expiresAt.getTime() <= Date.now()) {
      return "Expired";
    }

    return "Open";
  }

  private toPost(post: CollaborationRecord) {
    return {
      collaborationPostId: post.collaborationPostId.toString(),
      collaborationType: post.collaborationType,
      title: post.title,
      description: post.description,
      eventName: post.eventName,
      eventDate: post.eventDate,
      location: post.location,
      contactName: post.contactName,
      contactEmail: post.contactEmail,
      contactNumber: post.contactNumber,
      status: this.derivedStatus(post),
      expiresAt: post.expiresAt,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      chapter: {
        chapterId: post.chapter.chapterId.toString(),
        schoolName: post.chapter.schoolName,
        chapterName: post.chapter.chapterName,
        acronym: post.chapter.acronym,
      },
      createdBy: {
        userId: post.createdBy.userId.toString(),
        firstName: post.createdBy.firstName,
        lastName: post.createdBy.lastName,
      },
    };
  }
}
