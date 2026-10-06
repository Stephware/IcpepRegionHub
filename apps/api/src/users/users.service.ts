import { Injectable } from "@nestjs/common";
import { UserRole } from "../common/constants/roles.js";
import { PrismaService } from "../prisma/prisma.service.js";

type CreateChapterOfficerInput = {
  chapterId: bigint;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

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
}
