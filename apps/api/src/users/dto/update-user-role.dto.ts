import { IsEnum } from "class-validator";
import { UserRole } from "../../common/constants/roles.js";

export class UpdateUserRoleDto {
  @IsEnum(UserRole)
  role!: UserRole;
}
