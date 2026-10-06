import { describe, expect, it, jest } from "@jest/globals";
import {
  ConflictException,
  UnauthorizedException,
} from "@nestjs/common";
import { UserRole } from "../common/constants/roles.js";
import type { UsersService } from "../users/users.service.js";
import { AuthService } from "./auth.service.js";
import type { SessionTokenService } from "./session-token.service.js";

const activeUser = {
  userId: 10n,
  chapterId: 1n,
  firstName: "Juan",
  lastName: "Dela Cruz",
  email: "juan@example.com",
  passwordHash:
    "scrypt:22f448350305132056c0760192152391:ad7ced138f0069933ae6626316c2e57acc5d9c95282408028b1f7358d5a8af6f762675398a70e4dc143843b368e1d662ce86b5667e44fccf9e89b197d95f28a",
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
        password: "password123",
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
        password: "password123",
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
        password: "password123",
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
});
