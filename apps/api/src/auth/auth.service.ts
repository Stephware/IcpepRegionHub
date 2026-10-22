import {
  BadRequestException,
  ConflictException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { UsersService } from "../users/users.service.js";
import { LoginDto } from "./dto/login.dto.js";
import { RegisterDto } from "./dto/register.dto.js";
import { FACULTY_DESIGNATIONS } from "./dto/register.dto.js";
import { UserRole } from "../common/constants/roles.js";
import { UpdateProfileDto } from "../users/dto/update-profile.dto.js";
import { SessionTokenService } from "./session-token.service.js";

const scrypt = promisify(scryptCallback);
const HASH_KEY_LENGTH = 64;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: SessionTokenService,
  ) {}

  async register(input: RegisterDto) {
    if (
      ![UserRole.ChapterOfficer, UserRole.FacultyRepresentative].includes(
        input.role,
      )
    ) {
      throw new BadRequestException(
        "Choose Chapter Officer or Faculty Representative.",
      );
    }
    if (
      typeof input.chapterId !== "string" ||
      !/^[1-9]\d{0,18}$/.test(input.chapterId) ||
      BigInt(input.chapterId) > 9223372036854775807n
    ) {
      throw new BadRequestException(
        "Affiliated institution must be a valid positive ID.",
      );
    }
    if (
      input.role === UserRole.FacultyRepresentative &&
      !FACULTY_DESIGNATIONS.some(
        (designation) => designation === input.facultyDesignation,
      )
    ) {
      throw new BadRequestException("Choose a valid faculty designation.");
    }
    try {
      const email = input.email.trim().toLowerCase();
      const existingUser = await this.usersService.findByEmail(email);

      if (existingUser) {
        throw new ConflictException(
          "An account with this email already exists.",
        );
      }

      const passwordHash = await this.hashPassword(input.password);

      const user = await this.usersService.createRegistrant({
        chapterId: BigInt(input.chapterId),
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        email,
        passwordHash,
        role: input.role,
        facultyDesignation:
          input.role === UserRole.FacultyRepresentative
            ? input.facultyDesignation
            : undefined,
      });

      return {
        message:
          "Registration submitted. Your account must be approved before you can sign in.",
        user: this.toPublicUser(user),
      };
    } catch (error) {
      const failure = error as { code?: string; name?: string };
      if (failure?.code === "P2002" || failure?.code === "23505") {
        throw new ConflictException(
          "An account with this email already exists.",
        );
      }
      if (
        failure?.name === "PrismaClientInitializationError" ||
        [
          "P1000",
          "P1001",
          "P1002",
          "P1003",
          "P1008",
          "P1010",
          "P1011",
          "P1017",
          "P2024",
          "P2037",
          "ECONNREFUSED",
          "ECONNRESET",
          "ETIMEDOUT",
          "ENOTFOUND",
          "57P01",
          "57P02",
          "57P03",
          "53300",
        ].includes(failure?.code ?? "")
      ) {
        throw new ServiceUnavailableException(
          "Registration is temporarily unavailable. Please try again later.",
        );
      }
      throw error;
    }
  }

  updateProfile(userId: bigint, input: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, input);
  }

  async login(input: LoginDto) {
    const user = await this.validateCredentials(input);

    if (!user.isApproved) {
      throw new UnauthorizedException(
        "Your account is still waiting for regional approval.",
      );
    }

    const accessToken = this.tokenService.sign({
      sub: user.userId.toString(),
      role: user.role,
      chapterId: user.chapterId?.toString() ?? null,
    });

    return {
      accessToken,
      tokenType: "Bearer",
      user: this.toPublicUser(user),
    };
  }

  async validateCredentials(input: LoginDto) {
    const user = await this.usersService.findByEmail(
      input.email.trim().toLowerCase(),
    );

    if (
      !user ||
      !(await this.verifyPassword(input.password, user.passwordHash))
    ) {
      throw new UnauthorizedException("Invalid email or password.");
    }

    if (!user.isActive) {
      throw new UnauthorizedException("This account is inactive.");
    }

    return user;
  }

  private async hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = (await scrypt(
      password,
      salt,
      HASH_KEY_LENGTH,
    )) as Buffer;

    return `scrypt:${salt}:${derivedKey.toString("hex")}`;
  }

  private async verifyPassword(password: string, storedHash: string) {
    const [algorithm, salt, hash] = storedHash.split(":");

    if (
      algorithm !== "scrypt" ||
      !salt ||
      !/^[a-f0-9]{128}$/i.test(hash ?? "")
    ) {
      return false;
    }

    const storedKey = Buffer.from(hash, "hex");
    const derivedKey = (await scrypt(
      password,
      salt,
      storedKey.length,
    )) as Buffer;

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
    facultyDesignation?: string | null;
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
      facultyDesignation: user.facultyDesignation ?? null,
      isApproved: user.isApproved,
      isActive: user.isActive,
    };
  }
}
