import { IsIn } from "class-validator";

export class UpdateCollaborationAdminStatusDto {
  @IsIn(["Open", "Closed"])
  status!: "Open" | "Closed";
}
