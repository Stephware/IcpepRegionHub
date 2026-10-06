import { IsIn, IsString, MaxLength } from "class-validator";

export const ASSISTANCE_CATEGORIES = [
  "General",
  "Membership",
  "Events",
  "Chapter Administration",
  "Technical",
  "Other",
] as const;

export const ASSISTANCE_PRIORITIES = [
  "Low",
  "Normal",
  "High",
  "Urgent",
] as const;

export class CreateAssistanceRequestDto {
  @IsIn(ASSISTANCE_CATEGORIES)
  category!: (typeof ASSISTANCE_CATEGORIES)[number];

  @IsString()
  @MaxLength(250)
  subject!: string;

  @IsString()
  description!: string;

  @IsIn(ASSISTANCE_PRIORITIES)
  priority!: (typeof ASSISTANCE_PRIORITIES)[number];
}
