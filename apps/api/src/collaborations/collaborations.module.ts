import { Module } from "@nestjs/common";
import { CollaborationsController } from "./collaborations.controller.js";
import { CollaborationsService } from "./collaborations.service.js";

@Module({
  controllers: [CollaborationsController],
  providers: [CollaborationsService],
})
export class CollaborationsModule {}
