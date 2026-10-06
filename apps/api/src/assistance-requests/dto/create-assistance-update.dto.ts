import { IsBoolean, IsOptional, IsString } from "class-validator";

export class CreateAssistanceUpdateDto {
  @IsString()
  message!: string;

  @IsOptional()
  @IsBoolean()
  isInternalNote?: boolean;
}
