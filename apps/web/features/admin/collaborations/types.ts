import type {
  CollaborationPost,
  CollaborationResponse,
} from "@/features/collaborations/types";

export type AdminCollaborationPost = CollaborationPost & {
  responseCount: number;
};

export type AdminCollaborationPostDetails = AdminCollaborationPost & {
  responses: CollaborationResponse[];
};
