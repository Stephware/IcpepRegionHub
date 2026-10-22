import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { UsersModule } from "../users/users.module.js";
import { ChapterProfileController } from "./chapter-profile.controller.js";
import { ChapterAdminController } from "./chapter-admin.controller.js";
import { ChaptersController } from "./chapters.controller.js";
import { ChaptersService } from "./chapters.service.js";

@Module({
  imports: [PrismaModule, AuthModule, UsersModule],
  controllers: [
    ChaptersController,
    ChapterAdminController,
    ChapterProfileController,
  ],
  providers: [ChaptersService],
  exports: [ChaptersService],
})
export class ChaptersModule {}
