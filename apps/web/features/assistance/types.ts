export type AssistancePriority = "Low" | "Normal" | "High" | "Urgent";

export type AssistanceChapter = {
  chapterId: string;
  schoolName: string;
  chapterName: string;
  acronym: string | null;
};

export type AssistancePerson = {
  userId: string;
  firstName: string;
  lastName: string;
};

export type AssistanceRequestSummary = {
  assistanceRequestId: string;
  ticketCode: string;
  category: string;
  subject: string;
  priority: AssistancePriority;
  status: string;
  submittedAt: string;
  resolvedAt: string | null;
  updatedAt: string | null;
  chapter: AssistanceChapter;
  submittedBy: AssistancePerson & {
    email: string;
  };
  assignedTo: AssistancePerson | null;
};

export type AssistanceUpdate = {
  updateId: string;
  message: string;
  newStatus: string | null;
  createdAt: string;
  user: AssistancePerson;
};

export type AssistanceRequestDetails = AssistanceRequestSummary & {
  description: string;
  updates: AssistanceUpdate[];
};

export type AssistanceRequestInput = {
  category: string;
  subject: string;
  description: string;
  priority: AssistancePriority;
};
