import { IsNumberString, IsOptional } from "class-validator";

export class AssignAssistanceRequestDto {
  @IsOptional()
  @IsNumberString()
  userId?: string | null;
}
