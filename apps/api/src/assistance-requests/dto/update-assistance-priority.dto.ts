import { IsIn } from "class-validator";
import { ASSISTANCE_PRIORITIES } from "./create-assistance-request.dto.js";

export class UpdateAssistancePriorityDto {
  @IsIn(ASSISTANCE_PRIORITIES)
  priority!: (typeof ASSISTANCE_PRIORITIES)[number];
}
