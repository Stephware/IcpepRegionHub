import { IsBoolean } from "class-validator";

export class UpdateAnnouncementPinDto {
  @IsBoolean()
  isPinned!: boolean;
}
