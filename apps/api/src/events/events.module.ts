import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { UsersModule } from "../users/users.module.js";
import { EventAdminController } from "./event-admin.controller.js";
import { EventsController } from "./events.controller.js";
import { EventsService } from "./events.service.js";

@Module({
  imports: [PrismaModule, AuthModule, UsersModule],
  controllers: [EventsController, EventAdminController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
