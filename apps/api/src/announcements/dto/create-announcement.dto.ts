import {
  IsISO8601,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
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

  @ValidateIf((_input, value) => value !== undefined)
  @IsIn(["Public", "MembersOnly"])
  visibility?: "Public" | "MembersOnly";

  @ValidateIf((_input, value) => value !== undefined)
  @IsString()
  @MaxLength(500)
  coverImageUrl?: string;

  @ValidateIf((_input, value) => value !== undefined)
  @IsString()
  @MaxLength(500)
  externalLink?: string;

  @IsOptional()
  @IsISO8601()
  expiresAt?: string | null;
}
