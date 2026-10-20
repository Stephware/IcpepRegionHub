import {
  IsEmail,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from "class-validator";

export class CreateChapterOfficerDto {
  @IsOptional()
  @IsNumberString()
  userId?: string;

  @IsString()
  @MaxLength(150)
  fullName!: string;

  @IsString()
  @MaxLength(100)
  position!: string;

  @IsOptional()
  @ValidateIf((_object, value) => value !== "")
  @IsEmail()
  @MaxLength(256)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  photoUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  contactNumber?: string;

  @IsString()
  @MaxLength(20)
  academicYear!: string;
}
