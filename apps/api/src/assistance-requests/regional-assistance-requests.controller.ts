import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { UserRole } from "../common/constants/roles.js";
import { CurrentUser } from "../common/decorators/current-user.decorator.js";
import { Roles } from "../common/decorators/roles.decorator.js";
import { AuthGuard } from "../common/guards/auth.guard.js";
import type { AuthenticatedUser } from "../common/guards/auth.guard.js";
import { RolesGuard } from "../common/guards/roles.guard.js";
import { AssistanceRequestsService } from "./assistance-requests.service.js";
import { AssignAssistanceRequestDto } from "./dto/assign-assistance-request.dto.js";
import { CreateAssistanceUpdateDto } from "./dto/create-assistance-update.dto.js";
import { ListAssistanceRequestsQueryDto } from "./dto/list-assistance-requests-query.dto.js";
import { UpdateAssistancePriorityDto } from "./dto/update-assistance-priority.dto.js";
import { UpdateAssistanceStatusDto } from "./dto/update-assistance-status.dto.js";

@Controller("regional/assistance-requests")
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.RegionalAdmin, UserRole.RegionalOfficer)
export class RegionalAssistanceRequestsController {
  constructor(
    private readonly assistanceRequestsService: AssistanceRequestsService,
  ) {}

  @Get()
  listRequests(@Query() query: ListAssistanceRequestsQueryDto) {
    return this.assistanceRequestsService.listRegionalRequests(query);
  }

  @Get("assignees")
  listAssignees() {
    return this.assistanceRequestsService.listAssignableRegionalUsers();
  }

  @Get(":id")
  getRequest(@Param("id") id: string) {
    return this.assistanceRequestsService.getRegionalRequest(
      this.parseRequestId(id),
    );
  }

  @Patch(":id/assign")
  assignRequest(
    @Param("id") id: string,
    @Body() input: AssignAssistanceRequestDto,
  ) {
    return this.assistanceRequestsService.assignRequest(
      this.parseRequestId(id),
      input,
    );
  }

  @Patch(":id/priority")
  updatePriority(
    @Param("id") id: string,
    @Body() input: UpdateAssistancePriorityDto,
  ) {
    return this.assistanceRequestsService.updatePriority(
      this.parseRequestId(id),
      input,
    );
  }

  @Post(":id/updates")
  addUpdate(
    @Param("id") id: string,
    @Body() input: CreateAssistanceUpdateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.assistanceRequestsService.addUpdate(
      this.parseRequestId(id),
      input,
      BigInt(user.userId),
    );
  }

  @Patch(":id/status")
  updateStatus(
    @Param("id") id: string,
    @Body() input: UpdateAssistanceStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.assistanceRequestsService.updateStatus(
      this.parseRequestId(id),
      input,
      BigInt(user.userId),
    );
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
