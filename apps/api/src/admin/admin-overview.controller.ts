import { Controller, Get, UseGuards } from "@nestjs/common";
import { UserRole } from "../common/constants/roles.js";
import { Roles } from "../common/decorators/roles.decorator.js";
import { AuthGuard } from "../common/guards/auth.guard.js";
import { RolesGuard } from "../common/guards/roles.guard.js";
import { AdminOverviewService } from "./admin-overview.service.js";

@Controller("admin/overview")
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.RegionalAdmin)
export class AdminOverviewController {
  constructor(private readonly overviewService: AdminOverviewService) {}

  @Get()
  getOverview() {
    return this.overviewService.getMetrics();
  }
}
