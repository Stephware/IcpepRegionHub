import {
  IsEmail,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from "class-validator";

export class UpdateCollaborationPostDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  collaborationType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  eventName?: string;

  @IsOptional()
  @IsISO8601()
  eventDate?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  contactName?: string;

  @IsOptional()
  @ValidateIf((_object, value) => value !== "")
  @IsEmail()
  @MaxLength(256)
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  contactNumber?: string;

  @IsOptional()
  @IsISO8601()
  expiresAt?: string | null;
}
