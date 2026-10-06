import { IsIn, IsNumberString, IsOptional } from "class-validator";
import { ASSISTANCE_PRIORITIES } from "./create-assistance-request.dto.js";

export const ASSISTANCE_STATUSES = [
  "Submitted",
  "Under Review",
  "In Progress",
  "Resolved",
  "Closed",
] as const;

export class ListAssistanceRequestsQueryDto {
  @IsOptional()
  @IsIn(ASSISTANCE_STATUSES)
  status?: (typeof ASSISTANCE_STATUSES)[number];

  @IsOptional()
  @IsIn(ASSISTANCE_PRIORITIES)
  priority?: (typeof ASSISTANCE_PRIORITIES)[number];

  @IsOptional()
  @IsNumberString()
  chapterId?: string;
}
