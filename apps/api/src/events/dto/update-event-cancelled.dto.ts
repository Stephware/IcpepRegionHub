import { IsBoolean } from "class-validator";

export class UpdateEventCancelledDto {
  @IsBoolean()
  isCancelled!: boolean;
}
