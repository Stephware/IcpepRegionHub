import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { AdminOverviewService } from "../admin/admin-overview.service.js";
import { AnnouncementsService } from "../announcements/announcements.service.js";
import { AssistanceRequestsService } from "../assistance-requests/assistance-requests.service.js";
import { ChaptersService } from "../chapters/chapters.service.js";
import { CollaborationsService } from "../collaborations/collaborations.service.js";
import { UserRole } from "../common/constants/roles.js";
import type { AuthenticatedUser } from "../common/guards/auth.guard.js";
import { EventsService } from "../events/events.service.js";
import { UsersService } from "../users/users.service.js";

@Injectable()
export class DashboardService {
  constructor(
    private readonly announcementsService: AnnouncementsService,
    private readonly eventsService: EventsService,
    private readonly collaborationsService: CollaborationsService,
    private readonly assistanceService: AssistanceRequestsService,
    private readonly chaptersService: ChaptersService,
    private readonly usersService: UsersService,
    private readonly adminOverviewService: AdminOverviewService,
  ) {}

  async getDashboard(user: AuthenticatedUser) {
    if (user.role === UserRole.ChapterOfficer) {
      return this.getChapterOfficerDashboard(user);
    }

    if (user.role === UserRole.RegionalOfficer) {
      return this.getRegionalOfficerDashboard();
    }

    if (user.role === UserRole.RegionalAdmin) {
      return this.getRegionalAdminDashboard();
    }

    throw new ForbiddenException("Your account role does not have a dashboard.");
  }

  private async loadCommonData() {
    const [announcements, events, collaborations] = await Promise.all([
      this.announcementsService.listMemberAnnouncements(),
      this.eventsService.listPublishedEvents(),
      this.collaborationsService.listOpenPosts({}),
    ]);

    return {
      announcements,
      events,
      collaborations,
    };
  }

  private async getChapterOfficerDashboard(user: AuthenticatedUser) {
    const chapterId = this.requireChapterId(user);

    const [common, chapter, assistanceRequests, ownCollaborations] =
      await Promise.all([
        this.loadCommonData(),
        this.chaptersService.getPublicChapter(chapterId),
        this.assistanceService.listChapterRequests(chapterId),
        this.collaborationsService.listMyPosts(chapterId, BigInt(user.userId)),
      ]);

    return {
      role: UserRole.ChapterOfficer,
      data: {
        ...common,
        chapter,
        assistanceRequests,
        ownCollaborations,
      },
    };
  }

  private async getRegionalOfficerDashboard() {
    const [common, assistanceRequests] = await Promise.all([
      this.loadCommonData(),
      this.assistanceService.listRegionalRequests({}),
    ]);

    return {
      role: UserRole.RegionalOfficer,
      data: {
        ...common,
        assistanceRequests,
      },
    };
  }

  private async getRegionalAdminDashboard() {
    const [common, assistanceRequests, pendingAccounts, metrics] =
      await Promise.all([
        this.loadCommonData(),
        this.assistanceService.listRegionalRequests({}),
        this.usersService.listPendingUsers(),
        this.adminOverviewService.getMetrics(),
      ]);

    return {
      role: UserRole.RegionalAdmin,
      data: {
        ...common,
        assistanceRequests,
        pendingAccounts,
        activeChapters: metrics.activeChapters,
        draftAnnouncements: metrics.draftAnnouncements,
        draftEvents: metrics.draftEvents,
      },
    };
  }

  private requireChapterId(user: AuthenticatedUser) {
    if (!user.chapterId || !/^\d+$/.test(user.chapterId)) {
      throw new BadRequestException(
        "Your account must be linked to an active chapter before opening the dashboard.",
      );
    }

    return BigInt(user.chapterId);
  }
}
