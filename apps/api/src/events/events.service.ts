import { Injectable } from "@nestjs/common";

@Injectable()
export class EventsService {
  getStatus() {
    return {
      module: "events",
      status: "ready" as const,
    };
  }
}
