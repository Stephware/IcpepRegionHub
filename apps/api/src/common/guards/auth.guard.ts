import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { UsersService } from "../../users/users.service.js";
import { SessionTokenService } from "../../auth/session-token.service.js";

export type AuthenticatedUser = {
  userId: string;
  chapterId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

type AuthenticatedRequest = {
  headers: {
    authorization?: string;
  };
  user?: AuthenticatedUser;
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: SessionTokenService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Authentication is required.");
    }

    const token = authorization.slice("Bearer ".length).trim();
    const payload = this.tokenService.verify(token);

    let userId: bigint;

    try {
      userId = BigInt(payload.sub);
    } catch {
      throw new UnauthorizedException("Invalid authentication token.");
    }

    const user = await this.usersService.findById(userId);

    if (!user || !user.isActive || !user.isApproved) {
      throw new UnauthorizedException("This account is not allowed to sign in.");
    }

    request.user = {
      userId: user.userId.toString(),
      chapterId: user.chapterId?.toString() ?? null,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    };

    return true;
  }
}
