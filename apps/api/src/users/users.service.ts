import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Prisma } from "../generated/prisma/client.js";
import { UserRole } from "../common/constants/roles.js";
import { PrismaService } from "../prisma/prisma.service.js";

type CreateRegistrantInput = {
  role: UserRole.ChapterOfficer | UserRole.FacultyRepresentative;
  facultyDesignation?: string;
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
  facultyDesignation?: string | null;
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
  facultyDesignation: true,
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

  async createRegistrant(input: CreateRegistrantInput) {
    this.validateRegistrationRole(input.role, input.facultyDesignation);
    const chapter = await this.prisma.chapter.findUnique({
      where: { chapterId: input.chapterId },
      select: {
        chapterId: true,
        status: true,
      },
    });

    if (!chapter || chapter.status !== "Active") {
      throw new BadRequestException(
        "Registration requires an active ICpEP Region 3 chapter.",
      );
    }

    try {
      return await this.prisma.user.create({
        data: {
          chapterId: input.chapterId,
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          email: input.email.trim().toLowerCase(),
          passwordHash: input.passwordHash,
          role: input.role,
          facultyDesignation:
            input.role === UserRole.FacultyRepresentative
              ? input.facultyDesignation
              : null,
          isApproved: false,
          isActive: true,
        },
      });
    } catch (error) {
      this.rethrowEmailConflict(error);
    }
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
    const user = await this.prisma.$transaction(async (tx) => {
      await this.protectLastAdmin(tx, userId, {});
      return tx.user.update({
        where: { userId },
        data: { isApproved: true, isActive: true },
        select: publicUserSelect,
      });
    });

    return {
      message: "Account approved successfully.",
      user: this.toPublicUser(user),
    };
  }

  async rejectUser(userId: bigint) {
    const user = await this.prisma.$transaction(async (tx) => {
      const existingUser = await this.protectLastAdmin(tx, userId, {});
      if (existingUser.isApproved) {
        throw new BadRequestException(
          "Only pending accounts can be rejected. Deactivate an approved account instead.",
        );
      }
      return tx.user.update({
        where: { userId },
        data: { isApproved: false, isActive: false },
        select: publicUserSelect,
      });
    });

    return {
      message: "Account rejected successfully.",
      user: this.toPublicUser(user),
    };
  }

  async setActive(userId: bigint, isActive: boolean) {
    const user = await this.prisma.$transaction(async (tx) => {
      await this.protectLastAdmin(tx, userId, { isActive });
      return tx.user.update({
        where: { userId },
        data: { isActive },
        select: publicUserSelect,
      });
    });

    return {
      message: isActive
        ? "Account activated successfully."
        : "Account deactivated successfully.",
      user: this.toPublicUser(user),
    };
  }

  async changeRole(
    userId: bigint,
    role: UserRole,
    chapterId?: string,
    facultyDesignation?: string,
  ) {
    if (!Object.values(UserRole).includes(role)) {
      throw new BadRequestException("Select a valid account role.");
    }
    let linkedChapterId: bigint | null = null;
    const affiliated =
      role === UserRole.ChapterOfficer ||
      role === UserRole.FacultyRepresentative;
    if (affiliated) {
      this.validateRegistrationRole(role, facultyDesignation);
      if (
        !chapterId ||
        !/^[1-9]\d*$/.test(chapterId) ||
        chapterId.length > 19 ||
        BigInt(chapterId) > 9223372036854775807n
      ) {
        throw new BadRequestException(
          "This role requires a valid active institution.",
        );
      }
      linkedChapterId = BigInt(chapterId);
    }
    const user = await this.prisma.$transaction(async (tx) => {
      await this.protectLastAdmin(tx, userId, { role });
      if (linkedChapterId !== null) {
        const chapter = await tx.chapter.findUnique({
          where: { chapterId: linkedChapterId },
          select: { status: true },
        });
        if (!chapter || chapter.status !== "Active") {
          throw new BadRequestException(
            "This role requires a valid active institution.",
          );
        }
      }
      return tx.user.update({
        where: { userId },
        data: {
          role,
          chapterId: linkedChapterId,
          facultyDesignation:
            role === UserRole.FacultyRepresentative ? facultyDesignation : null,
        },
        select: publicUserSelect,
      });
    });
    return {
      message: "Account role updated successfully.",
      user: this.toPublicUser(user),
    };
  }

  async updateProfile(
    userId: bigint,
    input: { firstName?: string; lastName?: string; email?: string },
  ) {
    const data = {
      ...(input.firstName !== undefined
        ? { firstName: input.firstName.trim() }
        : {}),
      ...(input.lastName !== undefined
        ? { lastName: input.lastName.trim() }
        : {}),
      ...(input.email !== undefined
        ? { email: input.email.trim().toLowerCase() }
        : {}),
    };
    await this.ensureUserExists(userId);
    try {
      const user = await this.prisma.user.update({
        where: { userId },
        data,
        select: publicUserSelect,
      });
      return {
        message: "Account details updated successfully.",
        user: this.toPublicUser(user),
      };
    } catch (error) {
      this.rethrowEmailConflict(error);
    }
  }

  private validateRegistrationRole(role: UserRole, designation?: string) {
    if (
      role !== UserRole.ChapterOfficer &&
      role !== UserRole.FacultyRepresentative
    ) {
      throw new BadRequestException(
        "Select ChapterOfficer or FacultyRepresentative.",
      );
    }
    if (
      role === UserRole.FacultyRepresentative &&
      ![
        "Professor",
        "Faculty Adviser",
        "Program Coordinator",
        "Other",
      ].includes(designation ?? "")
    ) {
      throw new BadRequestException(
        "Faculty representatives require a valid faculty designation.",
      );
    }
  }

  private rethrowEmailConflict(error: unknown): never {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      throw new ConflictException("An account with this email already exists.");
    }
    throw error;
  }

  private async protectLastAdmin(
    tx: Prisma.TransactionClient,
    userId: bigint,
    change: { role?: UserRole; isActive?: boolean },
  ) {
    // Serialize both removal paths so concurrent requests cannot remove every admin.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(76423202)`;
    const user = await tx.user.findUnique({ where: { userId } });
    if (!user) throw new NotFoundException("User account was not found.");
    if (
      user.role === UserRole.RegionalAdmin &&
      user.isApproved &&
      user.isActive &&
      (change.isActive === false ||
        (change.role !== undefined && change.role !== UserRole.RegionalAdmin))
    ) {
      const count = await tx.user.count({
        where: {
          role: UserRole.RegionalAdmin,
          isApproved: true,
          isActive: true,
        },
      });
      if (count <= 1)
        throw new BadRequestException(
          "At least one approved active RegionalAdmin must remain.",
        );
    }
    return user;
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
      facultyDesignation: user.facultyDesignation ?? null,
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
