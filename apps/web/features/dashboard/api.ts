import { apiFetch } from "@/lib/api/client";
import {
  listAdminAnnouncements,
  listMemberAnnouncements,
} from "@/features/announcements/api";
import {
  listChapterAssistanceRequests,
  listRegionalAssistanceRequests,
} from "@/features/assistance/api";
import { getPublicChapter, listAdminChapters } from "@/features/chapters/api";
import {
  listMyCollaborationPosts,
  listOpenCollaborationPosts,
} from "@/features/collaborations/api";
import { listAdminEvents, listPublicEvents } from "@/features/events/api";
import type { AuthUser } from "@/features/auth/types";
import type {
  ChapterOfficerDashboardData,
  DashboardData,
  PendingAccount,
  RegionalAdminDashboardData,
  RegionalOfficerDashboardData,
} from "./types";

async function loadCommonDashboardData() {
  const [announcements, events, collaborations] = await Promise.all([
    listMemberAnnouncements(),
    listPublicEvents(),
    listOpenCollaborationPosts(),
  ]);

  return {
    announcements,
    events,
    collaborations,
  };
}

export async function loadChapterOfficerDashboard(
  user: AuthUser,
): Promise<ChapterOfficerDashboardData> {
  const commonPromise = loadCommonDashboardData();
  const chapterPromise = user.chapterId
    ? getPublicChapter(user.chapterId)
    : Promise.resolve(null);

  const [common, chapter, assistanceRequests, ownCollaborations] =
    await Promise.all([
      commonPromise,
      chapterPromise,
      listChapterAssistanceRequests(),
      listMyCollaborationPosts(),
    ]);

  return {
    ...common,
    chapter,
    assistanceRequests,
    ownCollaborations,
  };
}

export async function loadRegionalOfficerDashboard(): Promise<RegionalOfficerDashboardData> {
  const [common, assistanceRequests] = await Promise.all([
    loadCommonDashboardData(),
    listRegionalAssistanceRequests(),
  ]);

  return {
    ...common,
    assistanceRequests,
  };
}

export async function loadRegionalAdminDashboard(): Promise<RegionalAdminDashboardData> {
  const [
    common,
    assistanceRequests,
    chapters,
    adminAnnouncements,
    adminEvents,
    pendingAccounts,
  ] = await Promise.all([
    loadCommonDashboardData(),
    listRegionalAssistanceRequests(),
    listAdminChapters(),
    listAdminAnnouncements(),
    listAdminEvents(),
    apiFetch<PendingAccount[]>("/admin/accounts/pending"),
  ]);

  return {
    ...common,
    assistanceRequests,
    chapters,
    adminAnnouncements,
    adminEvents,
    pendingAccounts,
  };
}

export async function loadDashboard(user: AuthUser): Promise<DashboardData> {
  if (user.role === "ChapterOfficer") {
    return {
      role: "ChapterOfficer",
      data: await loadChapterOfficerDashboard(user),
    };
  }

  if (user.role === "RegionalOfficer") {
    return {
      role: "RegionalOfficer",
      data: await loadRegionalOfficerDashboard(),
    };
  }

  return {
    role: "RegionalAdmin",
    data: await loadRegionalAdminDashboard(),
  };
}
