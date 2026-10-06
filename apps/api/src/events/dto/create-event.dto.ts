import {
  IsISO8601,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateEventDto {
  @IsString()
  @MaxLength(250)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @MaxLength(100)
  eventType!: string;

  @IsOptional()
  @IsNumberString()
  organizerChapterId?: string;

  @IsOptional()
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

  @IsOptional()
  @IsString()
  @MaxLength(500)
  registrationLink?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverImageUrl?: string;
}
