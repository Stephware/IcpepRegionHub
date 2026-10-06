import { IsIn, IsOptional, IsString } from "class-validator";
import { ASSISTANCE_STATUSES } from "./list-assistance-requests-query.dto.js";

export class UpdateAssistanceStatusDto {
  @IsIn(ASSISTANCE_STATUSES)
  status!: (typeof ASSISTANCE_STATUSES)[number];

  @IsOptional()
  @IsString()
  message?: string;
}
