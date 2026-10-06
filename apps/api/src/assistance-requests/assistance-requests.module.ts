import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { UsersModule } from "../users/users.module.js";
import { AssistanceRequestsController } from "./assistance-requests.controller.js";
import { AssistanceRequestsService } from "./assistance-requests.service.js";

@Module({
  imports: [PrismaModule, AuthModule, UsersModule],
  controllers: [AssistanceRequestsController],
  providers: [AssistanceRequestsService],
  exports: [AssistanceRequestsService],
})
export class AssistanceRequestsModule {}
