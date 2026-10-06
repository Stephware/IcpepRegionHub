import { describe, expect, it } from "@jest/globals";
import { UnauthorizedException } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import { UserRole } from "../common/constants/roles.js";
import { SessionTokenService } from "./session-token.service.js";

function createService(
  secret = "0123456789abcdef0123456789abcdef",
  nodeEnv = "test",
) {
  const configService = {
    get: (key: string) => {
      if (key === "JWT_SECRET") {
        return secret;
      }

      if (key === "NODE_ENV") {
        return nodeEnv;
      }

      return undefined;
    },
  };

  return new SessionTokenService(configService as unknown as ConfigService);
}

describe("SessionTokenService", () => {
  it("signs and verifies a valid token", () => {
    const service = createService();
    const token = service.sign({
      sub: "10",
      role: UserRole.ChapterOfficer,
      chapterId: "1",
    });

    expect(service.verify(token)).toEqual(
      expect.objectContaining({
        sub: "10",
        role: UserRole.ChapterOfficer,
        chapterId: "1",
      }),
    );
  });

  it("rejects a tampered token", () => {
    const service = createService();
    const token = service.sign({
      sub: "10",
      role: UserRole.ChapterOfficer,
      chapterId: "1",
    });
    const [payload] = token.split(".");

    expect(() => service.verify(`${payload}.invalid-signature`)).toThrow(
      UnauthorizedException,
    );
  });

  it("rejects tokens with extra segments", () => {
    const service = createService();
    const token = service.sign({
      sub: "10",
      role: UserRole.ChapterOfficer,
      chapterId: "1",
    });

    expect(() => service.verify(`${token}.extra`)).toThrow(
      UnauthorizedException,
    );
  });

  it("uses secure cookies in production", () => {
    const service = createService(
      "0123456789abcdef0123456789abcdef",
      "production",
    );

    expect(service.createSessionCookie("token")).toContain("HttpOnly");
    expect(service.createSessionCookie("token")).toContain("SameSite=Lax");
    expect(service.createSessionCookie("token")).toContain("Secure");
  });

  it("rejects weak authentication secrets", () => {
    const service = createService("short-secret");

    expect(() =>
      service.sign({
        sub: "10",
        role: UserRole.ChapterOfficer,
        chapterId: "1",
      }),
    ).toThrow("JWT_SECRET must be at least 32 characters");
  });
});
