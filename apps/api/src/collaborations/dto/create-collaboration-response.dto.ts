import { IsOptional, IsString } from "class-validator";

export class CreateCollaborationResponseDto {
  @IsOptional()
  @IsString()
  message?: string;
}
