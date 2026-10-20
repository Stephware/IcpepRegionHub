import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from "class-validator";

export class CreateChapterDto {
  @IsString()
  @MaxLength(200)
  schoolName!: string;

  @IsString()
  @MaxLength(200)
  chapterName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  acronym?: string;

  @IsOptional()
  @ValidateIf((_object, value) => value !== "")
  @IsEmail()
  @MaxLength(256)
  officialEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  contactNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  facebookUrl?: string;
}
