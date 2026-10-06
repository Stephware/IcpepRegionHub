import { Injectable } from "@nestjs/common";

@Injectable()
export class AnnouncementsService {
  getStatus() {
    return {
      module: "announcements",
      status: "ready" as const,
    };
  }
}
