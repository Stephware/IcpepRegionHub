import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
} from "@nestjs/common";
import { Roles } from "../common/decorators/roles.decorator.js";
import { AuthGuard } from "../common/guards/auth.guard.js";
import { RolesGuard } from "../common/guards/roles.guard.js";
import { UserRole } from "../common/constants/roles.js";
import { UpdateUserActiveDto } from "../users/dto/update-user-active.dto.js";
import { UpdateUserRoleDto } from "../users/dto/update-user-role.dto.js";
import { UsersService } from "../users/users.service.js";

@Controller("admin/accounts")
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.RegionalAdmin)
export class AccountAdminController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  listUsers() {
    return this.usersService.listUsers();
  }

  @Get("pending")
  listPendingUsers() {
    return this.usersService.listPendingUsers();
  }

  @Get(":id")
  getUser(@Param("id") id: string) {
    return this.usersService.getUser(this.parseUserId(id));
  }

  @Patch(":id/approve")
  approveUser(@Param("id") id: string) {
    return this.usersService.approveUser(this.parseUserId(id));
  }

  @Patch(":id/reject")
  rejectUser(@Param("id") id: string) {
    return this.usersService.rejectUser(this.parseUserId(id));
  }

  @Patch(":id/active")
  setActive(
    @Param("id") id: string,
    @Body() input: UpdateUserActiveDto,
  ) {
    return this.usersService.setActive(this.parseUserId(id), input.isActive);
  }

  @Patch(":id/role")
  changeRole(
    @Param("id") id: string,
    @Body() input: UpdateUserRoleDto,
  ) {
    return this.usersService.changeRole(this.parseUserId(id), input.role);
  }

  private parseUserId(id: string) {
    if (!/^\d+$/.test(id)) {
      throw new BadRequestException("User ID must be a positive integer.");
    }

    const userId = BigInt(id);

    if (userId <= 0n) {
      throw new BadRequestException("User ID must be a positive integer.");
    }

    return userId;
  }
}
