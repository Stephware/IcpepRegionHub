import { IsEmail, IsNumberString, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateChapterOfficerDto {
  @IsOptional()
  @IsNumberString()
  userId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(256)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  contactNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  academicYear?: string;
}
