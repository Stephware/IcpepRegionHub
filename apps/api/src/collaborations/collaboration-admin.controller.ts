import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
} from "@nestjs/common";
import { UserRole } from "../common/constants/roles.js";
import { Roles } from "../common/decorators/roles.decorator.js";
import { AuthGuard } from "../common/guards/auth.guard.js";
import { RolesGuard } from "../common/guards/roles.guard.js";
import { CollaborationsService } from "./collaborations.service.js";
import { UpdateCollaborationAdminStatusDto } from "./dto/update-collaboration-admin-status.dto.js";

@Controller("admin/collaborations")
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.RegionalAdmin)
export class CollaborationAdminController {
  constructor(private readonly collaborationsService: CollaborationsService) {}

  @Get()
  listPosts() {
    return this.collaborationsService.listAdminPosts();
  }

  @Get(":id")
  getPost(@Param("id") id: string) {
    return this.collaborationsService.getAdminPost(this.parseId(id));
  }

  @Patch(":id/status")
  setStatus(
    @Param("id") id: string,
    @Body() input: UpdateCollaborationAdminStatusDto,
  ) {
    return this.collaborationsService.setAdminPostStatus(
      this.parseId(id),
      input.status,
    );
  }

  @Delete(":id")
  deletePost(@Param("id") id: string) {
    return this.collaborationsService.deleteAdminPost(this.parseId(id));
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
