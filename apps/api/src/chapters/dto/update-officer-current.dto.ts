import { IsBoolean } from "class-validator";

export class UpdateOfficerCurrentDto {
  @IsBoolean()
  isCurrent!: boolean;
}
