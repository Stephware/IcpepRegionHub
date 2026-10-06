import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { UsersService } from "../users/users.service.js";
import { LoginDto } from "./dto/login.dto.js";
import { RegisterDto } from "./dto/register.dto.js";

const scrypt = promisify(scryptCallback);
const HASH_KEY_LENGTH = 64;

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async register(input: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(input.email);

    if (existingUser) {
      throw new ConflictException("An account with this email already exists.");
    }

    const passwordHash = await this.hashPassword(input.password);

    const user = await this.usersService.createChapterOfficer({
      chapterId: BigInt(input.chapterId),
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      passwordHash,
    });

    return {
      message: "Registration submitted. Your account must be approved before you can sign in.",
      user: this.toPublicUser(user),
    };
  }

  async validateCredentials(input: LoginDto) {
    const user = await this.usersService.findByEmail(input.email);

    if (!user || !(await this.verifyPassword(input.password, user.passwordHash))) {
      throw new UnauthorizedException("Invalid email or password.");
    }

    if (!user.isActive) {
      throw new UnauthorizedException("This account is inactive.");
    }

    return user;
  }

  private async hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = (await scrypt(password, salt, HASH_KEY_LENGTH)) as Buffer;

    return `scrypt:${salt}:${derivedKey.toString("hex")}`;
  }

  private async verifyPassword(password: string, storedHash: string) {
    const [algorithm, salt, hash] = storedHash.split(":");

    if (algorithm !== "scrypt" || !salt || !hash) {
      return false;
    }

    const storedKey = Buffer.from(hash, "hex");
    const derivedKey = (await scrypt(password, salt, storedKey.length)) as Buffer;

    return (
      storedKey.length === derivedKey.length &&
      timingSafeEqual(storedKey, derivedKey)
    );
  }

  private toPublicUser(user: {
    userId: bigint;
    chapterId: bigint | null;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    isApproved: boolean;
    isActive: boolean;
  }) {
    return {
      userId: user.userId.toString(),
      chapterId: user.chapterId?.toString() ?? null,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
      isActive: user.isActive,
    };
  }
}
