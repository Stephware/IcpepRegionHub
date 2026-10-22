import { IsIn, IsOptional } from "class-validator";
import { PageQueryDto } from "../../common/dto/page-query.dto.js";

export const ACCOUNT_STATES = ["All", "Pending", "Active", "Inactive", "Rejected"] as const;

export class ListAccountsQueryDto extends PageQueryDto {
  @IsOptional()
  @IsIn(ACCOUNT_STATES)
  filter?: (typeof ACCOUNT_STATES)[number];
}
