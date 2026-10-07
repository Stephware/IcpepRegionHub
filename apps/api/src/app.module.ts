import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AnnouncementsModule } from "./announcements/announcements.module.js";
import { AssistanceRequestsModule } from "./assistance-requests/assistance-requests.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { ChaptersModule } from "./chapters/chapters.module.js";
import { CollaborationsModule } from "./collaborations/collaborations.module.js";
import { EventsModule } from "./events/events.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { UsersModule } from "./users/users.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["apps/api/.env", ".env"],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ChaptersModule,
    AnnouncementsModule,
    EventsModule,
    AssistanceRequestsModule,
    CollaborationsModule,
  ],
})
export class AppModule {}
