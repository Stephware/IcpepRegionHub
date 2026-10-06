import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { UserRole } from "../common/constants/roles.js";
import { CurrentUser } from "../common/decorators/current-user.decorator.js";
import { Roles } from "../common/decorators/roles.decorator.js";
import { AuthGuard } from "../common/guards/auth.guard.js";
import type { AuthenticatedUser } from "../common/guards/auth.guard.js";
import { RolesGuard } from "../common/guards/roles.guard.js";
import { AssistanceRequestsService } from "./assistance-requests.service.js";
import { CreateAssistanceRequestDto } from "./dto/create-assistance-request.dto.js";

@Controller("assistance-requests")
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ChapterOfficer)
export class AssistanceRequestsController {
  constructor(
    private readonly assistanceRequestsService: AssistanceRequestsService,
  ) {}

  @Get()
  listMyChapterRequests(@CurrentUser() user: AuthenticatedUser) {
    return this.assistanceRequestsService.listChapterRequests(
      this.requireChapterId(user),
    );
  }

  @Get(":id")
  getMyChapterRequest(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.assistanceRequestsService.getChapterRequest(
      this.parseRequestId(id),
      this.requireChapterId(user),
    );
  }

  @Post()
  createRequest(
    @Body() input: CreateAssistanceRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.assistanceRequestsService.createRequest(
      input,
      this.requireChapterId(user),
      BigInt(user.userId),
    );
  }

  private requireChapterId(user: AuthenticatedUser) {
    if (!user.chapterId || !/^\d+$/.test(user.chapterId)) {
      throw new BadRequestException(
        "Your account must be linked to a chapter before requesting assistance.",
      );
    }

    return BigInt(user.chapterId);
  }

  private parseRequestId(id: string) {
    if (!/^\d+$/.test(id)) {
      throw new BadRequestException(
        "Assistance request ID must be a positive integer.",
      );
    }

    const requestId = BigInt(id);

    if (requestId <= 0n) {
      throw new BadRequestException(
        "Assistance request ID must be a positive integer.",
      );
    }

    return requestId;
  }
}
