import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { UserRole } from "../common/constants/roles.js";
import { Roles } from "../common/decorators/roles.decorator.js";
import { AuthGuard } from "../common/guards/auth.guard.js";
import { RolesGuard } from "../common/guards/roles.guard.js";
import { ChaptersService } from "./chapters.service.js";
import { CreateChapterDto } from "./dto/create-chapter.dto.js";
import { CreateChapterOfficerDto } from "./dto/create-chapter-officer.dto.js";
import { UpdateChapterDto } from "./dto/update-chapter.dto.js";
import { UpdateChapterOfficerDto } from "./dto/update-chapter-officer.dto.js";
import { UpdateChapterStatusDto } from "./dto/update-chapter-status.dto.js";
import { UpdateOfficerCurrentDto } from "./dto/update-officer-current.dto.js";

@Controller("admin/chapters")
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.RegionalAdmin)
export class ChapterAdminController {
  constructor(private readonly chaptersService: ChaptersService) {}

  @Get()
  listChapters() {
    return this.chaptersService.listAllChapters();
  }

  @Get(":id")
  getChapter(@Param("id") id: string) {
    return this.chaptersService.getChapter(this.parseId(id, "Chapter"));
  }

  @Post()
  createChapter(@Body() input: CreateChapterDto) {
    return this.chaptersService.createChapter(input);
  }

  @Patch(":id")
  updateChapter(
    @Param("id") id: string,
    @Body() input: UpdateChapterDto,
  ) {
    return this.chaptersService.updateChapter(
      this.parseId(id, "Chapter"),
      input,
    );
  }

  @Patch(":id/status")
  updateStatus(
    @Param("id") id: string,
    @Body() input: UpdateChapterStatusDto,
  ) {
    return this.chaptersService.updateChapterStatus(
      this.parseId(id, "Chapter"),
      input.status,
    );
  }

  @Get(":id/officers")
  listOfficers(@Param("id") id: string) {
    return this.chaptersService.listAllOfficers(
      this.parseId(id, "Chapter"),
    );
  }

  @Post(":id/officers")
  createOfficer(
    @Param("id") id: string,
    @Body() input: CreateChapterOfficerDto,
  ) {
    return this.chaptersService.createOfficer(
      this.parseId(id, "Chapter"),
      input,
    );
  }

  @Patch(":chapterId/officers/:officerId")
  updateOfficer(
    @Param("chapterId") chapterId: string,
    @Param("officerId") officerId: string,
    @Body() input: UpdateChapterOfficerDto,
  ) {
    return this.chaptersService.updateOfficer(
      this.parseId(chapterId, "Chapter"),
      this.parseId(officerId, "Officer"),
      input,
    );
  }

  @Patch(":chapterId/officers/:officerId/current")
  updateOfficerCurrent(
    @Param("chapterId") chapterId: string,
    @Param("officerId") officerId: string,
    @Body() input: UpdateOfficerCurrentDto,
  ) {
    return this.chaptersService.setOfficerCurrent(
      this.parseId(chapterId, "Chapter"),
      this.parseId(officerId, "Officer"),
      input.isCurrent,
    );
  }

  private parseId(id: string, label: string) {
    if (!/^\d+$/.test(id)) {
      throw new BadRequestException(
        `${label} ID must be a positive integer.`,
      );
    }

    const parsedId = BigInt(id);

    if (parsedId <= 0n) {
      throw new BadRequestException(
        `${label} ID must be a positive integer.`,
      );
    }

    return parsedId;
  }
}
