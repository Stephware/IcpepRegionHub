import { Module } from "@nestjs/common";
import { AdminModule } from "../admin/admin.module.js";
import { AnnouncementsModule } from "../announcements/announcements.module.js";
import { AssistanceRequestsModule } from "../assistance-requests/assistance-requests.module.js";
import { AuthModule } from "../auth/auth.module.js";
import { ChaptersModule } from "../chapters/chapters.module.js";
import { CollaborationsModule } from "../collaborations/collaborations.module.js";
import { EventsModule } from "../events/events.module.js";
import { UsersModule } from "../users/users.module.js";
import { DashboardController } from "./dashboard.controller.js";
import { DashboardService } from "./dashboard.service.js";

@Module({
  imports: [
    AuthModule,
    AdminModule,
    AnnouncementsModule,
    AssistanceRequestsModule,
    ChaptersModule,
    CollaborationsModule,
    EventsModule,
    UsersModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
