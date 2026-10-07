import { Controller, Get, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../common/decorators/current-user.decorator.js";
import { AuthGuard } from "../common/guards/auth.guard.js";
import type { AuthenticatedUser } from "../common/guards/auth.guard.js";
import { DashboardService } from "./dashboard.service.js";

@Controller("dashboard")
@UseGuards(AuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  getDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getDashboard(user);
  }
}
