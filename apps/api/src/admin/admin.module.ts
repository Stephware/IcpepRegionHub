import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { UsersModule } from "../users/users.module.js";
import { AdminOverviewController } from "./admin-overview.controller.js";
import { AdminOverviewService } from "./admin-overview.service.js";

@Module({
  imports: [PrismaModule, AuthModule, UsersModule],
  controllers: [AdminOverviewController],
  providers: [AdminOverviewService],
  exports: [AdminOverviewService],
})
export class AdminModule {}
