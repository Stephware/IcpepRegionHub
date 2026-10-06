import { IsIn } from "class-validator";

export class UpdateChapterStatusDto {
  @IsIn(["Active", "Inactive"])
  status!: "Active" | "Inactive";
}
