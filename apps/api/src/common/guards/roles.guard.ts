import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "../constants/roles.js";
import { ROLES_KEY } from "../decorators/roles.decorator.js";
import type { AuthenticatedUser } from "./auth.guard.js";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const role = request.user?.role as UserRole | undefined;

    if (!role || !requiredRoles.includes(role)) {
      throw new ForbiddenException("You do not have permission to access this resource.");
    }

    return true;
  }
}
