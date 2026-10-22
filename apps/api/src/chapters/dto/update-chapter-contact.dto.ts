import { Transform } from "class-transformer";
import {
  IsEmail,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
} from "class-validator";

export class UpdateChapterContactDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @ValidateIf((_object, value) => value !== undefined && value !== "")
  @IsEmail()
  @MaxLength(256)
  officialEmail?: string;

  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @MaxLength(30)
  contactNumber?: string;

  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @ValidateIf((_object, value) => value !== undefined && value !== "")
  @IsUrl({ protocols: ["http", "https"], require_protocol: true })
  @MaxLength(500)
  facebookUrl?: string;
}
