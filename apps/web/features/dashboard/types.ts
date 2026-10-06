import type { MemberAnnouncement } from "@/features/announcements/types";
import type { AssistanceRequestSummary } from "@/features/assistance/types";
import type { Chapter, AdminChapter } from "@/features/chapters/types";
import type { CollaborationPost } from "@/features/collaborations/types";
import type { AdminEvent, EventItem } from "@/features/events/types";

export type PendingAccount = {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isApproved: boolean;
  isActive: boolean;
};

export type DashboardCommonData = {
  announcements: MemberAnnouncement[];
  events: EventItem[];
  collaborations: CollaborationPost[];
};

export type ChapterOfficerDashboardData = DashboardCommonData & {
  chapter: Chapter | null;
  assistanceRequests: AssistanceRequestSummary[];
  ownCollaborations: CollaborationPost[];
};

export type RegionalOfficerDashboardData = DashboardCommonData & {
  assistanceRequests: AssistanceRequestSummary[];
};

export type RegionalAdminDashboardData = DashboardCommonData & {
  assistanceRequests: AssistanceRequestSummary[];
  chapters: AdminChapter[];
  adminAnnouncements: MemberAnnouncement[];
  adminEvents: AdminEvent[];
  pendingAccounts: PendingAccount[];
};

export type DashboardData =
  | {
      role: "ChapterOfficer";
      data: ChapterOfficerDashboardData;
    }
  | {
      role: "RegionalOfficer";
      data: RegionalOfficerDashboardData;
    }
  | {
      role: "RegionalAdmin";
      data: RegionalAdminDashboardData;
    };
