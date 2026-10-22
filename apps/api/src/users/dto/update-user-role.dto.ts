import { IsEnum, IsIn, Matches, MaxLength, ValidateIf } from "class-validator";
import { UserRole } from "../../common/constants/roles.js";
import { FACULTY_DESIGNATIONS } from "../../auth/dto/register.dto.js";

export class UpdateUserRoleDto {
  @IsEnum(UserRole)
  role!: UserRole;

  @ValidateIf(
    (input: UpdateUserRoleDto, value) =>
      [UserRole.ChapterOfficer, UserRole.FacultyRepresentative].includes(
        input.role,
      ) || value !== undefined,
  )
  @Matches(/^[1-9]\d*$/)
  @MaxLength(19)
  chapterId?: string;

  @ValidateIf(
    (input: UpdateUserRoleDto, value) =>
      input.role === UserRole.FacultyRepresentative || value !== undefined,
  )
  @IsIn(FACULTY_DESIGNATIONS)
  facultyDesignation?: string;
}
