import { Injectable } from "@nestjs/common";

@Injectable()
export class CollaborationsService {
  getStatus() {
    return {
      module: "collaborations",
      status: "ready" as const,
    };
  }
}
