import { Injectable } from "@nestjs/common";

@Injectable()
export class AssistanceRequestsService {
  getStatus() {
    return {
      module: "assistance-requests",
      status: "ready" as const,
    };
  }
}
