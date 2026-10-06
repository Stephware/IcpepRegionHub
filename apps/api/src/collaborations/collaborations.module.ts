import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { UsersModule } from "../users/users.module.js";
import { ChapterCollaborationsController } from "./chapter-collaborations.controller.js";
import { CollaborationAdminController } from "./collaboration-admin.controller.js";
import { CollaborationsController } from "./collaborations.controller.js";
import { CollaborationsService } from "./collaborations.service.js";

@Module({
  imports: [PrismaModule, AuthModule, UsersModule],
  controllers: [
    CollaborationsController,
    ChapterCollaborationsController,
    CollaborationAdminController,
  ],
  providers: [CollaborationsService],
  exports: [CollaborationsService],
})
export class CollaborationsModule {}
