import { IsBoolean } from "class-validator";

export class UpdateAnnouncementPublishDto {
  @IsBoolean()
  isPublished!: boolean;
}
