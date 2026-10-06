import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../common/guards/auth.guard.js";
import { CollaborationsService } from "./collaborations.service.js";
import { ListCollaborationsQueryDto } from "./dto/list-collaborations-query.dto.js";

@Controller("collaborations")
@UseGuards(AuthGuard)
export class CollaborationsController {
  constructor(private readonly collaborationsService: CollaborationsService) {}

  @Get()
  listOpenPosts(@Query() query: ListCollaborationsQueryDto) {
    return this.collaborationsService.listOpenPosts(query);
  }

  @Get(":id")
  getOpenPost(@Param("id") id: string) {
    return this.collaborationsService.getOpenPost(this.parseId(id));
  }

  private parseId(id: string) {
    if (!/^\d+$/.test(id)) {
      throw new BadRequestException(
        "Collaboration post ID must be a positive integer.",
      );
    }

    const postId = BigInt(id);

    if (postId <= 0n) {
      throw new BadRequestException(
        "Collaboration post ID must be a positive integer.",
      );
    }

    return postId;
  }
}
