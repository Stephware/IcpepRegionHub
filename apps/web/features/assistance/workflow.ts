import type { AssistanceStatus } from "./types";

const transitions: Record<AssistanceStatus, AssistanceStatus[]> = {
  Submitted: ["Under Review", "In Progress", "Resolved"],
  "Under Review": ["In Progress", "Resolved"],
  "In Progress": ["Under Review", "Resolved"],
  Resolved: ["In Progress", "Closed"],
  Closed: [],
};

export function nextAssistanceStatuses(status: AssistanceStatus) {
  return transitions[status];
}

export function countAssistanceStatuses(
  statuses: AssistanceStatus[],
) {
  return {
    open: statuses.filter(
      (status) => status !== "Resolved" && status !== "Closed",
    ).length,
    submitted: statuses.filter((status) => status === "Submitted").length,
    inProgress: statuses.filter(
      (status) => status === "Under Review" || status === "In Progress",
    ).length,
    resolved: statuses.filter(
      (status) => status === "Resolved" || status === "Closed",
    ).length,
  };
}
