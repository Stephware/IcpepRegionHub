import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { CreateChapterDto } from "./dto/create-chapter.dto.js";
import { CreateChapterOfficerDto } from "./dto/create-chapter-officer.dto.js";
import { UpdateChapterDto } from "./dto/update-chapter.dto.js";
import { UpdateChapterOfficerDto } from "./dto/update-chapter-officer.dto.js";

type ChapterRecord = {
  chapterId: bigint;
  schoolName: string;
  chapterName: string;
  acronym: string | null;
  officialEmail: string | null;
  contactNumber: string | null;
  address: string | null;
  logoUrl: string | null;
  facebookUrl: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date | null;
};

type OfficerRecord = {
  chapterOfficerId: bigint;
  chapterId: bigint;
  userId: bigint | null;
  fullName: string;
  position: string;
  email: string | null;
  contactNumber: string | null;
  academicYear: string;
  isCurrent: boolean;
  createdAt: Date;
  updatedAt: Date | null;
};

@Injectable()
export class ChaptersService {
  constructor(private readonly prisma: PrismaService) {}

  async listActiveChapters() {
    const chapters = await this.prisma.chapter.findMany({
      where: { status: "Active" },
      orderBy: [{ schoolName: "asc" }, { chapterName: "asc" }],
    });

    return chapters.map((chapter) => this.toPublicChapter(chapter));
  }

  async listAllChapters() {
    const chapters = await this.prisma.chapter.findMany({
      orderBy: [{ status: "asc" }, { schoolName: "asc" }],
    });

    return chapters.map((chapter) => this.toAdminChapter(chapter));
  }

  async getPublicChapter(chapterId: bigint) {
    const chapter = await this.prisma.chapter.findFirst({
      where: {
        chapterId,
        status: "Active",
      },
    });

    if (!chapter) {
      throw new NotFoundException("Chapter was not found.");
    }

    return this.toPublicChapter(chapter);
  }

  async getChapter(chapterId: bigint) {
    const chapter = await this.prisma.chapter.findUnique({
      where: { chapterId },
    });

    if (!chapter) {
      throw new NotFoundException("Chapter was not found.");
    }

    return this.toAdminChapter(chapter);
  }

  async createChapter(input: CreateChapterDto) {
    const schoolName = this.requiredText(input.schoolName, "School name");
    const chapterName = this.requiredText(input.chapterName, "Chapter name");

    const duplicate = await this.prisma.chapter.findFirst({
      where: {
        OR: [
          {
            schoolName: {
              equals: schoolName,
              mode: "insensitive",
            },
          },
          {
            chapterName: {
              equals: chapterName,
              mode: "insensitive",
            },
          },
        ],
      },
      select: { chapterId: true },
    });

    if (duplicate) {
      throw new ConflictException(
        "A chapter with the same school or chapter name already exists.",
      );
    }

    const chapter = await this.prisma.chapter.create({
      data: {
        schoolName,
        chapterName,
        acronym: this.optionalText(input.acronym),
        officialEmail: this.optionalText(input.officialEmail),
        contactNumber: this.optionalText(input.contactNumber),
        address: this.optionalText(input.address),
        logoUrl: this.optionalText(input.logoUrl),
        facebookUrl: this.optionalText(input.facebookUrl),
        status: "Active",
      },
    });

    return {
      message: "Chapter created successfully.",
      chapter: this.toAdminChapter(chapter),
    };
  }

  async updateChapter(chapterId: bigint, input: UpdateChapterDto) {
    await this.ensureChapterExists(chapterId);

    if (input.schoolName !== undefined || input.chapterName !== undefined) {
      const duplicate = await this.prisma.chapter.findFirst({
        where: {
          chapterId: { not: chapterId },
          OR: [
            ...(input.schoolName !== undefined
              ? [
                  {
                    schoolName: {
                      equals: this.requiredText(input.schoolName, "School name"),
                      mode: "insensitive" as const,
                    },
                  },
                ]
              : []),
            ...(input.chapterName !== undefined
              ? [
                  {
                    chapterName: {
                      equals: this.requiredText(
                        input.chapterName,
                        "Chapter name",
                      ),
                      mode: "insensitive" as const,
                    },
                  },
                ]
              : []),
          ],
        },
        select: { chapterId: true },
      });

      if (duplicate) {
        throw new ConflictException(
          "A chapter with the same school or chapter name already exists.",
        );
      }
    }

    const chapter = await this.prisma.chapter.update({
      where: { chapterId },
      data: {
        schoolName:
          input.schoolName === undefined
            ? undefined
            : this.requiredText(input.schoolName, "School name"),
        chapterName:
          input.chapterName === undefined
            ? undefined
            : this.requiredText(input.chapterName, "Chapter name"),
        acronym: this.optionalText(input.acronym),
        officialEmail: this.optionalText(input.officialEmail),
        contactNumber: this.optionalText(input.contactNumber),
        address: this.optionalText(input.address),
        logoUrl: this.optionalText(input.logoUrl),
        facebookUrl: this.optionalText(input.facebookUrl),
        updatedAt: new Date(),
      },
    });

    return {
      message: "Chapter updated successfully.",
      chapter: this.toAdminChapter(chapter),
    };
  }

  async updateChapterStatus(
    chapterId: bigint,
    status: "Active" | "Inactive",
  ) {
    await this.ensureChapterExists(chapterId);

    const chapter = await this.prisma.chapter.update({
      where: { chapterId },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    return {
      message:
        status === "Active"
          ? "Chapter activated successfully."
          : "Chapter deactivated successfully.",
      chapter: this.toAdminChapter(chapter),
    };
  }

  async listCurrentOfficers(chapterId: bigint) {
    await this.getPublicChapter(chapterId);

    const officers = await this.prisma.chapterOfficer.findMany({
      where: {
        chapterId,
        isCurrent: true,
      },
      orderBy: [{ position: "asc" }, { fullName: "asc" }],
    });

    return officers.map((officer) => this.toPublicOfficer(officer));
  }

  async listAllOfficers(chapterId: bigint) {
    await this.ensureChapterExists(chapterId);

    const officers = await this.prisma.chapterOfficer.findMany({
      where: { chapterId },
      orderBy: [
        { isCurrent: "desc" },
        { academicYear: "desc" },
        { position: "asc" },
      ],
    });

    return officers.map((officer) => this.toAdminOfficer(officer));
  }

  async createOfficer(
    chapterId: bigint,
    input: CreateChapterOfficerDto,
  ) {
    await this.ensureChapterExists(chapterId);

    const userId = this.parseOptionalId(input.userId, "User");

    if (userId !== null) {
      await this.ensureUserBelongsToChapter(userId, chapterId);
    }

    const officer = await this.prisma.chapterOfficer.create({
      data: {
        chapterId,
        userId,
        fullName: this.requiredText(input.fullName, "Full name"),
        position: this.requiredText(input.position, "Position"),
        email: this.optionalText(input.email),
        contactNumber: this.optionalText(input.contactNumber),
        academicYear: this.requiredText(input.academicYear, "Academic year"),
        isCurrent: true,
      },
    });

    return {
      message: "Chapter officer added successfully.",
      officer: this.toAdminOfficer(officer),
    };
  }

  async updateOfficer(
    chapterId: bigint,
    officerId: bigint,
    input: UpdateChapterOfficerDto,
  ) {
    await this.ensureOfficerBelongsToChapter(officerId, chapterId);

    const userId =
      input.userId === undefined
        ? undefined
        : this.parseOptionalId(input.userId, "User");

    if (userId !== undefined && userId !== null) {
      await this.ensureUserBelongsToChapter(userId, chapterId);
    }

    const officer = await this.prisma.chapterOfficer.update({
      where: { chapterOfficerId: officerId },
      data: {
        userId,
        fullName:
          input.fullName === undefined
            ? undefined
            : this.requiredText(input.fullName, "Full name"),
        position:
          input.position === undefined
            ? undefined
            : this.requiredText(input.position, "Position"),
        email: this.optionalText(input.email),
        contactNumber: this.optionalText(input.contactNumber),
        academicYear:
          input.academicYear === undefined
            ? undefined
            : this.requiredText(input.academicYear, "Academic year"),
        updatedAt: new Date(),
      },
    });

    return {
      message: "Chapter officer updated successfully.",
      officer: this.toAdminOfficer(officer),
    };
  }

  async setOfficerCurrent(
    chapterId: bigint,
    officerId: bigint,
    isCurrent: boolean,
  ) {
    await this.ensureOfficerBelongsToChapter(officerId, chapterId);

    const officer = await this.prisma.chapterOfficer.update({
      where: { chapterOfficerId: officerId },
      data: {
        isCurrent,
        updatedAt: new Date(),
      },
    });

    return {
      message: isCurrent
        ? "Officer marked as current."
        : "Officer marked as former.",
      officer: this.toAdminOfficer(officer),
    };
  }

  private async ensureChapterExists(chapterId: bigint) {
    const chapter = await this.prisma.chapter.findUnique({
      where: { chapterId },
      select: { chapterId: true },
    });

    if (!chapter) {
      throw new NotFoundException("Chapter was not found.");
    }
  }

  private async ensureOfficerBelongsToChapter(
    officerId: bigint,
    chapterId: bigint,
  ) {
    const officer = await this.prisma.chapterOfficer.findFirst({
      where: {
        chapterOfficerId: officerId,
        chapterId,
      },
      select: { chapterOfficerId: true },
    });

    if (!officer) {
      throw new NotFoundException(
        "Chapter officer was not found for this chapter.",
      );
    }
  }

  private async ensureUserBelongsToChapter(
    userId: bigint,
    chapterId: bigint,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        chapterId: true,
      },
    });

    if (!user) {
      throw new BadRequestException("Linked user account was not found.");
    }

    if (user.chapterId !== chapterId) {
      throw new BadRequestException(
        "Linked user account must belong to the same chapter.",
      );
    }
  }

  private parseOptionalId(value: string | undefined, label: string) {
    if (value === undefined || value.trim() === "") {
      return null;
    }

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

  private optionalText(value: string | undefined) {
    if (value === undefined) {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed || null;
  }

  private toPublicChapter(chapter: ChapterRecord) {
    return {
      chapterId: chapter.chapterId.toString(),
      schoolName: chapter.schoolName,
      chapterName: chapter.chapterName,
      acronym: chapter.acronym,
      officialEmail: chapter.officialEmail,
      contactNumber: chapter.contactNumber,
      address: chapter.address,
      logoUrl: chapter.logoUrl,
      facebookUrl: chapter.facebookUrl,
    };
  }

  private toAdminChapter(chapter: ChapterRecord) {
    return {
      ...this.toPublicChapter(chapter),
      status: chapter.status,
      createdAt: chapter.createdAt,
      updatedAt: chapter.updatedAt,
    };
  }

  private toPublicOfficer(officer: OfficerRecord) {
    return {
      chapterOfficerId: officer.chapterOfficerId.toString(),
      fullName: officer.fullName,
      position: officer.position,
      email: officer.email,
      contactNumber: officer.contactNumber,
      academicYear: officer.academicYear,
    };
  }

  private toAdminOfficer(officer: OfficerRecord) {
    return {
      ...this.toPublicOfficer(officer),
      chapterId: officer.chapterId.toString(),
      userId: officer.userId?.toString() ?? null,
      isCurrent: officer.isCurrent,
      createdAt: officer.createdAt,
      updatedAt: officer.updatedAt,
    };
  }
}
