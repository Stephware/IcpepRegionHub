import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { UsersModule } from "../users/users.module.js";
import { AnnouncementAdminController } from "./announcement-admin.controller.js";
import { AnnouncementsController } from "./announcements.controller.js";
import { AnnouncementsService } from "./announcements.service.js";
import { MemberAnnouncementsController } from "./member-announcements.controller.js";

@Module({
  imports: [PrismaModule, AuthModule, UsersModule],
  controllers: [
    AnnouncementsController,
    MemberAnnouncementsController,
    AnnouncementAdminController,
  ],
  providers: [AnnouncementsService],
  exports: [AnnouncementsService],
})
export class AnnouncementsModule {}
