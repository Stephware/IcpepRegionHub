import { Transform } from "class-transformer";
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from "class-validator";
import { UserRole } from "../../common/constants/roles.js";

export const FACULTY_DESIGNATIONS = [
  "Professor",
  "Faculty Adviser",
  "Program Coordinator",
  "Other",
] as const;

export class RegisterDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName!: string;

  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName!: string;

  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(256)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @IsString()
  @Matches(/^[1-9]\d*$/)
  @MaxLength(19)
  chapterId!: string;

  @IsIn([UserRole.ChapterOfficer, UserRole.FacultyRepresentative])
  role!: UserRole.ChapterOfficer | UserRole.FacultyRepresentative;

  @ValidateIf(
    (input: RegisterDto, value) =>
      input.role === UserRole.FacultyRepresentative || value !== undefined,
  )
  @IsIn(FACULTY_DESIGNATIONS)
  facultyDesignation?: string;
}
