import { Module } from "@nestjs/common";
import { AssistanceRequestsController } from "./assistance-requests.controller.js";
import { AssistanceRequestsService } from "./assistance-requests.service.js";

@Module({
  controllers: [AssistanceRequestsController],
  providers: [AssistanceRequestsService],
})
export class AssistanceRequestsModule {}
