import { IsOptional, IsString, MaxLength } from "class-validator";

export class ListCollaborationsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  type?: string;
}
