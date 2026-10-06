import { describe, expect, it, jest } from "@jest/globals";
import {
  ConflictException,
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
    createChapterOfficer: jest.fn(),
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
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(usersService.createChapterOfficer).not.toHaveBeenCalled();
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
