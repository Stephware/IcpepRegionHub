import "reflect-metadata";
import { describe, expect, it } from "@jest/globals";
import { ForbiddenException, type ExecutionContext } from "@nestjs/common";
import { GUARDS_METADATA } from "@nestjs/common/constants.js";
import { Reflector } from "@nestjs/core";
import { ChapterCollaborationsController } from "../collaborations/chapter-collaborations.controller.js";
import { CollaborationsController } from "../collaborations/collaborations.controller.js";
import { UserRole } from "../common/constants/roles.js";
import { AuthGuard } from "../common/guards/auth.guard.js";
import { RolesGuard } from "../common/guards/roles.guard.js";
import { AnnouncementAdminController } from "./announcement-admin.controller.js";
import { MemberAnnouncementsController } from "./member-announcements.controller.js";
import { RegionalAnnouncementsController } from "./regional-announcements.controller.js";

describe("announcement and faculty browse permissions", () => {
  const guard = new RolesGuard(new Reflector());

  function canAccess(controller: object, role: UserRole) {
    return guard.canActivate({
      getClass: () => controller,
      getHandler: () => function handler() {},
      switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }),
    } as unknown as ExecutionContext);
  }

  it.each(Object.values(UserRole))(
    "restricts announcement management for %s",
    (role) => {
      if ([UserRole.RegionalOfficer, UserRole.RegionalAdmin].includes(role)) {
        expect(canAccess(RegionalAnnouncementsController, role)).toBe(true);
      } else {
        expect(() => canAccess(RegionalAnnouncementsController, role)).toThrow(
          ForbiddenException,
        );
      }
      if (role === UserRole.RegionalAdmin) {
        expect(canAccess(AnnouncementAdminController, role)).toBe(true);
      } else {
        expect(() => canAccess(AnnouncementAdminController, role)).toThrow(
          ForbiddenException,
        );
      }
    },
  );

  it("keeps faculty member browsing authenticated and excludes chapter collaboration actions", () => {
    for (const controller of [
      MemberAnnouncementsController,
      CollaborationsController,
    ]) {
      expect(Reflect.getMetadata(GUARDS_METADATA, controller)).toContain(
        AuthGuard,
      );
      expect(canAccess(controller, UserRole.FacultyRepresentative)).toBe(true);
    }
    expect(() =>
      canAccess(
        ChapterCollaborationsController,
        UserRole.FacultyRepresentative,
      ),
    ).toThrow(ForbiddenException);
    for (const controller of [
      RegionalAnnouncementsController,
      AnnouncementAdminController,
    ]) {
      expect(Reflect.getMetadata(GUARDS_METADATA, controller)).toEqual([
        AuthGuard,
        RolesGuard,
      ]);
    }
  });
});
