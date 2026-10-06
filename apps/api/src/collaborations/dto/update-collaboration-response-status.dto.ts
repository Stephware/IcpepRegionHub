import { IsIn } from "class-validator";

export class UpdateCollaborationResponseStatusDto {
  @IsIn(["Accepted", "Declined"])
  status!: "Accepted" | "Declined";
}
