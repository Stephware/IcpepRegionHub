import {
  IsISO8601,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateAnnouncementDto {
  @IsString()
  @MaxLength(250)
  title!: string;

  @IsString()
  content!: string;

  @IsString()
  @MaxLength(100)
  category!: string;

  @IsOptional()
  @IsIn(["Public", "MembersOnly"])
  visibility?: "Public" | "MembersOnly";

  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverImageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  externalLink?: string;

  @IsOptional()
  @IsISO8601()
  expiresAt?: string | null;
}
