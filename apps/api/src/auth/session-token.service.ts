import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, timingSafeEqual } from "node:crypto";
import { UserRole } from "../common/constants/roles.js";

export const SESSION_COOKIE_NAME = "icpep_session";

export type AuthTokenPayload = {
  sub: string;
  role: string;
  chapterId: string | null;
  exp: number;
};

const TOKEN_LIFETIME_SECONDS = 60 * 60 * 8;

@Injectable()
export class SessionTokenService {
  constructor(private readonly configService: ConfigService) {}

  sign(payload: Omit<AuthTokenPayload, "exp">) {
    const tokenPayload: AuthTokenPayload = {
      ...payload,
      exp: Math.floor(Date.now() / 1000) + TOKEN_LIFETIME_SECONDS,
    };

    const encodedPayload = Buffer.from(JSON.stringify(tokenPayload)).toString(
      "base64url",
    );
    const signature = this.createSignature(encodedPayload);

    return `${encodedPayload}.${signature}`;
  }

  verify(token: string): AuthTokenPayload {
    const parts = token.split(".");

    if (parts.length !== 2) {
      throw new UnauthorizedException("Invalid authentication token.");
    }

    const [encodedPayload, signature] = parts;

    if (!encodedPayload || !signature) {
      throw new UnauthorizedException("Invalid authentication token.");
    }

    const expectedSignature = this.createSignature(encodedPayload);
    const actualBuffer = Buffer.from(signature, "base64url");
    const expectedBuffer = Buffer.from(expectedSignature, "base64url");

    if (
      actualBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(actualBuffer, expectedBuffer)
    ) {
      throw new UnauthorizedException("Invalid authentication token.");
    }

    let payload: AuthTokenPayload;

    try {
      payload = JSON.parse(
        Buffer.from(encodedPayload, "base64url").toString("utf8"),
      ) as AuthTokenPayload;
    } catch {
      throw new UnauthorizedException("Invalid authentication token.");
    }

    if (
      !/^\d+$/.test(payload.sub) ||
      BigInt(payload.sub) <= 0n ||
      !Object.values(UserRole).includes(payload.role as UserRole) ||
      (payload.chapterId !== null &&
        (!/^\d+$/.test(payload.chapterId) ||
          BigInt(payload.chapterId) <= 0n)) ||
      !Number.isInteger(payload.exp)
    ) {
      throw new UnauthorizedException("Invalid authentication token.");
    }

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException("Authentication token has expired.");
    }

    return payload;
  }

  createSessionCookie(token: string) {
    return [
      `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
      "HttpOnly",
      "Path=/",
      "SameSite=Lax",
      `Max-Age=${TOKEN_LIFETIME_SECONDS}`,
      this.isProduction() ? "Secure" : "",
    ]
      .filter(Boolean)
      .join("; ");
  }

  createClearSessionCookie() {
    return [
      `${SESSION_COOKIE_NAME}=`,
      "HttpOnly",
      "Path=/",
      "SameSite=Lax",
      "Max-Age=0",
      this.isProduction() ? "Secure" : "",
    ]
      .filter(Boolean)
      .join("; ");
  }

  private createSignature(value: string) {
    return createHmac("sha256", this.getSecret())
      .update(value)
      .digest("base64url");
  }

  private getSecret() {
    const secret = this.configService.get<string>("JWT_SECRET");

    if (!secret || secret.startsWith("CHANGE_ME")) {
      throw new Error(
        "JWT_SECRET must be configured with a secure value before authentication can be used.",
      );
    }

    if (secret.length < 32) {
      throw new Error(
        "JWT_SECRET must be at least 32 characters long.",
      );
    }

    return secret;
  }

  private isProduction() {
    return this.configService.get<string>("NODE_ENV") === "production";
  }
}
