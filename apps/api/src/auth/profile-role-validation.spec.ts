import "reflect-metadata";
import { describe, expect, it } from "@jest/globals";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { GUARDS_METADATA } from "@nestjs/common/constants.js";
import { AuthGuard } from "../common/guards/auth.guard.js";
import { UpdateProfileDto } from "../users/dto/update-profile.dto.js";
import { UpdateUserRoleDto } from "../users/dto/update-user-role.dto.js";
import { AuthController } from "./auth.controller.js";

const validation = { whitelist: true, forbidNonWhitelisted: true };

describe("basic profile validation", () => {
  it("normalizes optional personal fields", async () => {
    const dto = plainToInstance(UpdateProfileDto, {
      firstName: " New ",
      email: " USER@EXAMPLE.COM ",
    });
    expect(await validate(dto, validation)).toHaveLength(0);
    expect(dto).toMatchObject({ firstName: "New", email: "user@example.com" });
  });

  it.each([
    { firstName: " " },
    { firstName: null },
    { email: null },
    { email: "invalid" },
    { userId: "11" },
    { chapterId: "2" },
    { role: "RegionalAdmin" },
    { isApproved: true },
    { passwordHash: "forged" },
  ])("rejects invalid or privileged profile changes %j", async (input) => {
    expect(
      await validate(plainToInstance(UpdateProfileDto, input), validation),
    ).not.toHaveLength(0);
  });

  it("requires authentication for profile updates", () => {
    expect(
      Reflect.getMetadata(
        GUARDS_METADATA,
        AuthController.prototype.updateProfile,
      ),
    ).toContain(AuthGuard);
  });
});

describe("administrative role validation", () => {
  it("accepts an affiliated faculty account with designation", async () => {
    expect(
      await validate(
        plainToInstance(UpdateUserRoleDto, {
          role: "FacultyRepresentative",
          chapterId: "1",
          facultyDesignation: "Program Coordinator",
        }),
        validation,
      ),
    ).toHaveLength(0);
  });

  it.each([
    { role: "Unknown" },
    { role: "ChapterOfficer" },
    { role: "FacultyRepresentative", chapterId: "1" },
    {
      role: "FacultyRepresentative",
      chapterId: "1",
      facultyDesignation: "Invalid",
    },
    { role: "ChapterOfficer", chapterId: "1.5" },
    { role: "ChapterOfficer", chapterId: "9999999999999999999999" },
  ])("rejects invalid role updates %j", async (input) => {
    expect(
      await validate(plainToInstance(UpdateUserRoleDto, input), validation),
    ).not.toHaveLength(0);
  });
});
