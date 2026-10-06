import { describe, expect, it, jest } from "@jest/globals";
import {
  UnauthorizedException,
  type ExecutionContext,
} from "@nestjs/common";
import type { SessionTokenService } from "../../auth/session-token.service.js";
import { UserRole } from "../constants/roles.js";
import type { UsersService } from "../../users/users.service.js";
import { AuthGuard } from "./auth.guard.js";

function context(headers: {
  authorization?: string;
  cookie?: string;
}) {
  const request = { headers };

  return {
    request,
    context: {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext,
  };
}

function createGuard() {
  const tokenService = {
    verify: jest.fn().mockReturnValue({
      sub: "10",
      role: UserRole.ChapterOfficer,
      chapterId: "1",
      exp: 9999999999,
    }),
  };
  const usersService = {
    findById: jest.fn().mockResolvedValue({
      userId: 10n,
      chapterId: 1n,
      firstName: "Juan",
      lastName: "Dela Cruz",
      email: "juan@example.com",
      role: UserRole.ChapterOfficer,
      isApproved: true,
      isActive: true,
    }),
  };

  return {
    tokenService,
    usersService,
    guard: new AuthGuard(
      tokenService as unknown as SessionTokenService,
      usersService as unknown as UsersService,
    ),
  };
}

describe("AuthGuard", () => {
  it("accepts a bearer token and attaches the current user", async () => {
    const { guard, tokenService } = createGuard();
    const { context: executionContext, request } = context({
      authorization: "Bearer signed-token",
    });

    await expect(guard.canActivate(executionContext)).resolves.toBe(true);
    expect(tokenService.verify).toHaveBeenCalledWith("signed-token");
    expect(request).toHaveProperty(
      "user",
      expect.objectContaining({
        userId: "10",
        role: UserRole.ChapterOfficer,
      }),
    );
  });

  it("accepts the HttpOnly session cookie", async () => {
    const { guard, tokenService } = createGuard();
    const { context: executionContext } = context({
      cookie: "other=value; icpep_session=signed-token",
    });

    await expect(guard.canActivate(executionContext)).resolves.toBe(true);
    expect(tokenService.verify).toHaveBeenCalledWith("signed-token");
  });

  it("rejects requests without authentication", async () => {
    const { guard } = createGuard();
    const { context: executionContext } = context({});

    await expect(guard.canActivate(executionContext)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("rejects inactive users even with a valid token", async () => {
    const { guard, usersService } = createGuard();
    usersService.findById.mockResolvedValue({
      userId: 10n,
      chapterId: 1n,
      firstName: "Juan",
      lastName: "Dela Cruz",
      email: "juan@example.com",
      role: UserRole.ChapterOfficer,
      isApproved: true,
      isActive: false,
    });
    const { context: executionContext } = context({
      authorization: "Bearer signed-token",
    });

    await expect(guard.canActivate(executionContext)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
