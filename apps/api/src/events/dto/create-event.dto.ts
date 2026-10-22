import {
  IsISO8601,
  IsIn,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from "class-validator";

export class CreateEventDto {
  @IsString()
  @MaxLength(250)
  title!: string;

  @ValidateIf((_input, value) => value !== undefined)
  @IsString()
  description?: string;

  @IsString()
  @MaxLength(100)
  eventType!: string;

  @ValidateIf((_input, value) => value !== undefined)
  @IsIn(["Regional", "Chapter", "Academic"])
  scope?: "Regional" | "Chapter" | "Academic";

  @IsOptional()
  @IsNumberString()
  organizerChapterId?: string | null;

  @ValidateIf((_input, value) => value !== undefined)
  @IsString()
  @MaxLength(300)
  venue?: string;

  @IsISO8601()
  startDateTime!: string;

  @IsOptional()
  @IsISO8601()
  endDateTime?: string | null;

  @IsOptional()
  @IsISO8601()
  registrationDeadline?: string | null;

  @ValidateIf((_input, value) => value !== undefined)
  @IsString()
  @MaxLength(500)
  registrationLink?: string;

  @ValidateIf((_input, value) => value !== undefined)
  @IsString()
  @MaxLength(500)
  coverImageUrl?: string;
}
