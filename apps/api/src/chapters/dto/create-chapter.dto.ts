import { IsEmail, IsOptional, IsString, MaxLength } from "class-validator";

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
