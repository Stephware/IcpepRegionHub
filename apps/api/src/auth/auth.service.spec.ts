import { describe, expect, it, jest } from "@jest/globals";
import {
  BadRequestException,
  ConflictException,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { scryptSync } from "node:crypto";
import { UserRole } from "../common/constants/roles.js";
import type { UsersService } from "../users/users.service.js";
import { AuthService } from "./auth.service.js";
import type { SessionTokenService } from "./session-token.service.js";

const password = "password123";
const salt = "0123456789abcdef0123456789abcdef";
const passwordHash = `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;

const activeUser = {
  userId: 10n,
  chapterId: 1n,
  firstName: "Juan",
  lastName: "Dela Cruz",
  email: "juan@example.com",
  passwordHash,
  role: UserRole.ChapterOfficer,
  isApproved: true,
  isActive: true,
};

function createService() {
  const usersService = {
    findByEmail: jest.fn(),
    createRegistrant: jest.fn().mockImplementation(async (input: object) => ({
      ...activeUser,
      ...input,
      isApproved: false,
    })),
    updateProfile: jest.fn(),
  };
  const tokenService = {
    sign: jest.fn().mockReturnValue("signed-token"),
  };

  return {
    usersService,
    tokenService,
    service: new AuthService(
      usersService as unknown as UsersService,
      tokenService as unknown as SessionTokenService,
    ),
  };
}

describe("AuthService", () => {
  const registration = {
    firstName: " Juan ",
    lastName: " Dela Cruz ",
    email: " JUAN@EXAMPLE.COM ",
    password,
    chapterId: "1",
    role: UserRole.ChapterOfficer,
  };

  it.each([UserRole.ChapterOfficer, UserRole.FacultyRepresentative])(
    "registers %s pending approval without issuing credentials",
    async (role) => {
      const { usersService, tokenService, service } = createService();
      usersService.findByEmail.mockResolvedValue(null);
      const result = await service.register({
        ...registration,
        role,
        ...(role === UserRole.FacultyRepresentative
          ? { facultyDesignation: "Professor" }
          : {}),
      });
      expect(usersService.createRegistrant).toHaveBeenCalledWith(
        expect.objectContaining({
          chapterId: 1n,
          firstName: "Juan",
          lastName: "Dela Cruz",
          email: "juan@example.com",
          role,
          passwordHash: expect.stringMatching(
            /^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/,
          ),
          ...(role === UserRole.FacultyRepresentative
            ? { facultyDesignation: "Professor" }
            : {}),
        }),
      );
      expect(result.user).toMatchObject({
        role,
        isApproved: false,
        isActive: true,
      });
      expect(result.user).not.toHaveProperty("passwordHash");
      expect(result).not.toHaveProperty("accessToken");
      expect(tokenService.sign).not.toHaveBeenCalled();
    },
  );

  it.each([
    "0",
    "-1",
    "1.5",
    "9223372036854775808",
    "99999999999999999999999999999999999",
  ])(
    "rejects invalid or out-of-range affiliation %s before database access",
    async (chapterId) => {
      const { usersService, service } = createService();
      await expect(
        service.register({ ...registration, chapterId }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(usersService.findByEmail).not.toHaveBeenCalled();
    },
  );

  it.each([UserRole.RegionalAdmin, UserRole.RegionalOfficer, "Unknown"])(
    "rejects privileged or unknown direct registration role %s",
    async (role) => {
      const { usersService, service } = createService();
      await expect(
        service.register({ ...registration, role } as never),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(usersService.createRegistrant).not.toHaveBeenCalled();
    },
  );

  it("rejects faculty registration without a designation", async () => {
    const { service } = createService();
    await expect(
      service.register({
        ...registration,
        role: UserRole.FacultyRepresentative,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it.each(["P1001", "P2024", "P2037", "ECONNREFUSED"])(
    "returns a sanitized unavailable response for %s",
    async (code) => {
      const { usersService, service } = createService();
      usersService.findByEmail.mockRejectedValue({
        code,
        message: "private connection details",
      });
      await expect(service.register(registration)).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
      await expect(service.register(registration)).rejects.toThrow(
        "Registration is temporarily unavailable. Please try again later.",
      );
    },
  );

  it("never authenticates a malformed scrypt hash", async () => {
    const { usersService, service } = createService();
    usersService.findByEmail.mockResolvedValue({
      ...activeUser,
      passwordHash: "scrypt:salt:invalid",
    });
    await expect(
      service.login({ email: activeUser.email, password }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("maps a concurrent unique email conflict from account creation", async () => {
    const { usersService, service } = createService();
    usersService.findByEmail.mockResolvedValue(null);
    usersService.createRegistrant.mockRejectedValue({ code: "P2002" });
    await expect(service.register(registration)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it("preserves invalid-affiliation errors from account creation", async () => {
    const { usersService, service } = createService();
    usersService.findByEmail.mockResolvedValue(null);
    usersService.createRegistrant.mockRejectedValue(
      new BadRequestException("Registration requires an active chapter."),
    );
    await expect(service.register(registration)).rejects.toThrow(
      "Registration requires an active chapter.",
    );
  });

  it("updates the authenticated user's basic profile through UsersService", async () => {
    const { usersService, service } = createService();
    const result = {
      message: "Profile updated.",
      user: { firstName: "New name" },
    };
    usersService.updateProfile.mockResolvedValue(result);
    await expect(
      service.updateProfile(10n, { firstName: "New name" }),
    ).resolves.toEqual(result);
    expect(usersService.updateProfile).toHaveBeenCalledWith(10n, {
      firstName: "New name",
    });
  });

  it("blocks duplicate email registration", async () => {
    const { usersService, service } = createService();
    usersService.findByEmail.mockResolvedValue(activeUser);

    await expect(
      service.register({
        firstName: "Juan",
        lastName: "Dela Cruz",
        email: "juan@example.com",
        password,
        chapterId: "1",
        role: UserRole.ChapterOfficer,
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(usersService.createRegistrant).not.toHaveBeenCalled();
  });

  it("does not issue a token to a pending account", async () => {
    const { usersService, tokenService, service } = createService();
    usersService.findByEmail.mockResolvedValue({
      ...activeUser,
      isApproved: false,
    });

    await expect(
      service.login({
        email: "juan@example.com",
        password,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(tokenService.sign).not.toHaveBeenCalled();
  });

  it("does not issue a token to an inactive account", async () => {
    const { usersService, tokenService, service } = createService();
    usersService.findByEmail.mockResolvedValue({
      ...activeUser,
      isActive: false,
    });

    await expect(
      service.login({
        email: "juan@example.com",
        password,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(tokenService.sign).not.toHaveBeenCalled();
  });

  it("rejects a wrong password without issuing a token", async () => {
    const { usersService, tokenService, service } = createService();
    usersService.findByEmail.mockResolvedValue(activeUser);

    await expect(
      service.login({
        email: "juan@example.com",
        password: "wrong-password",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(tokenService.sign).not.toHaveBeenCalled();
  });

  it("issues a token to an approved active user", async () => {
    const { usersService, tokenService, service } = createService();
    usersService.findByEmail.mockResolvedValue(activeUser);

    const result = await service.login({
      email: "juan@example.com",
      password,
    });

    expect(tokenService.sign).toHaveBeenCalledWith({
      sub: "10",
      role: UserRole.ChapterOfficer,
      chapterId: "1",
    });
    expect(result).toEqual(
      expect.objectContaining({
        accessToken: "signed-token",
        tokenType: "Bearer",
        user: expect.objectContaining({
          userId: "10",
          email: "juan@example.com",
        }),
      }),
    );
    expect(result.user).not.toHaveProperty("passwordHash");
  });
});
