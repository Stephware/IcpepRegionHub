import { Controller, Get } from "@nestjs/common";
import { AssistanceRequestsService } from "./assistance-requests.service.js";

@Controller("assistance-requests")
export class AssistanceRequestsController {
  constructor(
    private readonly assistanceRequestsService: AssistanceRequestsService,
  ) {}

  @Get()
  getStatus() {
    return this.assistanceRequestsService.getStatus();
  }
}
