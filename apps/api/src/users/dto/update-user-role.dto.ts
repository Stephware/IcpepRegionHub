import { IsEnum, IsOptional, Matches } from "class-validator";
import { UserRole } from "../../common/constants/roles.js";

export class UpdateUserRoleDto {
  @IsEnum(UserRole)
  role!: UserRole;

  @IsOptional()
  @Matches(/^[1-9]\d*$/)
  chapterId?: string;
}
