import { describe, expect, it, jest } from "@jest/globals";
import { ForbiddenException } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import type { Reflector } from "@nestjs/core";
import { UserRole } from "../constants/roles.js";
import { RolesGuard } from "./roles.guard.js";

function createContext(role?: UserRole): ExecutionContext {
  return {
    getHandler: () => function handler() {},
    getClass: () => class TestController {},
    switchToHttp: () => ({
      getRequest: () => ({
        user: {
          userId: "1",
          chapterId: null,
          firstName: "Regional",
          lastName: "User",
          email: "regional@example.com",
          role,
        },
      }),
      getResponse: () => ({}),
      getNext: () => undefined,
    }),
  } as unknown as ExecutionContext;
}

describe("RolesGuard", () => {
  it("allows a RegionalAdmin to access RegionalAdmin routes", () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([UserRole.RegionalAdmin]),
    };
    const guard = new RolesGuard(reflector as unknown as Reflector);

    expect(guard.canActivate(createContext(UserRole.RegionalAdmin))).toBe(true);
  });

  it("blocks a ChapterOfficer from RegionalAdmin routes", () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([UserRole.RegionalAdmin]),
    };
    const guard = new RolesGuard(reflector as unknown as Reflector);

    expect(() =>
      guard.canActivate(createContext(UserRole.ChapterOfficer)),
    ).toThrow(ForbiddenException);
  });

  it("allows routes that do not declare role restrictions", () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    };
    const guard = new RolesGuard(reflector as unknown as Reflector);

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it("blocks guarded routes when no authenticated user is present", () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([UserRole.RegionalAdmin]),
    };
    const guard = new RolesGuard(reflector as unknown as Reflector);

    expect(() => guard.canActivate(createContext())).toThrow(
      ForbiddenException,
    );
  });
});
