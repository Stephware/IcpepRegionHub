import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { UserRole } from "../common/constants/roles.js";
import { PrismaService } from "../prisma/prisma.service.js";

type CreateChapterOfficerInput = {
  chapterId: bigint;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
};

type PublicUserRecord = {
  userId: bigint;
  chapterId: bigint | null;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isApproved: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date | null;
  chapter: {
    chapterId: bigint;
    schoolName: string;
    chapterName: string;
    acronym: string | null;
  } | null;
};

const publicUserSelect = {
  userId: true,
  chapterId: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  isApproved: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  chapter: {
    select: {
      chapterId: true,
      schoolName: true,
      chapterName: true,
      acronym: true,
    },
  },
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  getStatus() {
    return {
      module: "users",
      status: "ready" as const,
    };
  }

  findById(userId: bigint) {
    return this.prisma.user.findUnique({
      where: { userId },
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: {
        email: {
          equals: email.trim(),
          mode: "insensitive",
        },
      },
    });
  }

  createChapterOfficer(input: CreateChapterOfficerInput) {
    return this.prisma.user.create({
      data: {
        chapterId: input.chapterId,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        email: input.email.trim().toLowerCase(),
        passwordHash: input.passwordHash,
        role: UserRole.ChapterOfficer,
        isApproved: false,
        isActive: true,
      },
    });
  }

  async listUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: publicUserSelect,
    });

    return users.map((user) => this.toPublicUser(user));
  }

  async listPendingUsers() {
    const users = await this.prisma.user.findMany({
      where: {
        isApproved: false,
        isActive: true,
      },
      orderBy: {
        createdAt: "asc",
      },
      select: publicUserSelect,
    });

    return users.map((user) => this.toPublicUser(user));
  }

  async getUser(userId: bigint) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      select: publicUserSelect,
    });

    if (!user) {
      throw new NotFoundException("User account was not found.");
    }

    return this.toPublicUser(user);
  }

  async approveUser(userId: bigint) {
    await this.ensureUserExists(userId);

    const user = await this.prisma.user.update({
      where: { userId },
      data: {
        isApproved: true,
        isActive: true,
      },
      select: publicUserSelect,
    });

    return {
      message: "Account approved successfully.",
      user: this.toPublicUser(user),
    };
  }

  async rejectUser(userId: bigint) {
    const existingUser = await this.prisma.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        isApproved: true,
      },
    });

    if (!existingUser) {
      throw new NotFoundException("User account was not found.");
    }

    if (existingUser.isApproved) {
      throw new BadRequestException(
        "Only pending accounts can be rejected. Deactivate an approved account instead.",
      );
    }

    const user = await this.prisma.user.update({
      where: { userId },
      data: {
        isApproved: false,
        isActive: false,
      },
      select: publicUserSelect,
    });

    return {
      message: "Account rejected successfully.",
      user: this.toPublicUser(user),
    };
  }

  async setActive(userId: bigint, isActive: boolean) {
    await this.ensureUserExists(userId);

    const user = await this.prisma.user.update({
      where: { userId },
      data: { isActive },
      select: publicUserSelect,
    });

    return {
      message: isActive
        ? "Account activated successfully."
        : "Account deactivated successfully.",
      user: this.toPublicUser(user),
    };
  }

  async changeRole(userId: bigint, role: UserRole) {
    await this.ensureUserExists(userId);

    const user = await this.prisma.user.update({
      where: { userId },
      data: { role },
      select: publicUserSelect,
    });

    return {
      message: "Account role updated successfully.",
      user: this.toPublicUser(user),
    };
  }

  private async ensureUserExists(userId: bigint) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      select: { userId: true },
    });

    if (!user) {
      throw new NotFoundException("User account was not found.");
    }
  }

  private toPublicUser(user: PublicUserRecord) {
    return {
      userId: user.userId.toString(),
      chapterId: user.chapterId?.toString() ?? null,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      chapter: user.chapter
        ? {
            chapterId: user.chapter.chapterId.toString(),
            schoolName: user.chapter.schoolName,
            chapterName: user.chapter.chapterName,
            acronym: user.chapter.acronym,
          }
        : null,
    };
  }
}
