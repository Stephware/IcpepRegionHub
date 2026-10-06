import { IsBoolean } from "class-validator";

export class UpdateEventPublishDto {
  @IsBoolean()
  isPublished!: boolean;
}
