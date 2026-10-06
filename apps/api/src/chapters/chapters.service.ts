import { Injectable } from "@nestjs/common";

@Injectable()
export class ChaptersService {
  getStatus() {
    return {
      module: "chapters",
      status: "ready" as const,
    };
  }
}
