import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class AdminOverviewService {
  constructor(private readonly prisma: PrismaService) {}

  async getMetrics() {
    const now = new Date();

    const [
      pendingAccounts,
      activeUsers,
      activeChapters,
      draftAnnouncements,
      draftEvents,
      openAssistance,
      openCollaborations,
    ] = await Promise.all([
      this.prisma.user.count({
        where: {
          isApproved: false,
          isActive: true,
        },
      }),
      this.prisma.user.count({
        where: {
          isApproved: true,
          isActive: true,
        },
      }),
      this.prisma.chapter.count({
        where: { status: "Active" },
      }),
      this.prisma.announcement.count({
        where: { isPublished: false },
      }),
      this.prisma.event.count({
        where: { isPublished: false },
      }),
      this.prisma.assistanceRequest.count({
        where: {
          status: {
            notIn: ["Resolved", "Closed"],
          },
        },
      }),
      this.prisma.collaborationPost.count({
        where: {
          status: "Open",
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
      }),
    ]);

    return {
      pendingAccounts,
      activeUsers,
      activeChapters,
      draftAnnouncements,
      draftEvents,
      openAssistance,
      openCollaborations,
    };
  }
}
