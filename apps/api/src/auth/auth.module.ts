import { Module } from "@nestjs/common";
import { AuthGuard } from "../common/guards/auth.guard.js";
import { RolesGuard } from "../common/guards/roles.guard.js";
import { UsersModule } from "../users/users.module.js";
import { AccountAdminController } from "./account-admin.controller.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { SessionTokenService } from "./session-token.service.js";

@Module({
  imports: [UsersModule],
  controllers: [AuthController, AccountAdminController],
  providers: [AuthService, SessionTokenService, AuthGuard, RolesGuard],
  exports: [AuthService, SessionTokenService, AuthGuard, RolesGuard],
})
export class AuthModule {}
