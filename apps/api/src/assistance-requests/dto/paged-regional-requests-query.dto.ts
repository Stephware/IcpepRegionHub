import { IsIn, IsNumberString, IsOptional } from "class-validator";
import { PageQueryDto } from "../../common/dto/page-query.dto.js";
import { ASSISTANCE_PRIORITIES } from "./create-assistance-request.dto.js";
import { ASSISTANCE_STATUSES } from "./list-assistance-requests-query.dto.js";

export class PagedRegionalRequestsQueryDto extends PageQueryDto {
  @IsOptional()
  @IsIn(ASSISTANCE_STATUSES)
  status?: (typeof ASSISTANCE_STATUSES)[number];

  @IsOptional()
  @IsIn(ASSISTANCE_PRIORITIES)
  priority?: (typeof ASSISTANCE_PRIORITIES)[number];

  @IsOptional()
  @IsNumberString()
  chapterId?: string;
}
