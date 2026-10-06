import { Controller, Get } from "@nestjs/common";
import { CollaborationsService } from "./collaborations.service.js";

@Controller("collaborations")
export class CollaborationsController {
  constructor(private readonly collaborationsService: CollaborationsService) {}

  @Get()
  getStatus() {
    return this.collaborationsService.getStatus();
  }
}
