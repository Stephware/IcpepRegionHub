import { describe, expect, it } from "@jest/globals";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { RegisterDto } from "./dto/register.dto.js";

const input = {
  firstName: " Demo ",
  lastName: " Officer ",
  email: " PERSON@HUB-DEMO.TEST ",
  password: "test-password-only",
  chapterId: "1",
  role: "ChapterOfficer",
};
async function errors(data: object) {
  return validate(plainToInstance(RegisterDto, data), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
}
describe("registration validation", () => {
  it("normalizes names and email before validation", async () => {
    const dto = plainToInstance(RegisterDto, input);
    expect(await validate(dto)).toHaveLength(0);
    expect(dto.firstName).toBe("Demo");
    expect(dto.email).toBe("person@hub-demo.test");
  });
  it("accepts affiliated faculty with a recognized designation", async () => {
    expect(
      await errors({
        ...input,
        role: "FacultyRepresentative",
        facultyDesignation: "Professor",
      }),
    ).toHaveLength(0);
  });
  it.each(["RegionalOfficer", "RegionalAdmin", "Unknown"])(
    "rejects public role %s",
    async (role) => {
      expect(
        (await errors({ ...input, role })).some(
          (error) => error.property === "role",
        ),
      ).toBe(true);
    },
  );
  it.each([undefined, null, "Invalid"])(
    "requires a valid faculty designation %s",
    async (facultyDesignation) => {
      expect(
        (
          await errors({
            ...input,
            role: "FacultyRepresentative",
            facultyDesignation,
          })
        ).some((error) => error.property === "facultyDesignation"),
      ).toBe(true);
    },
  );
  it.each(["1.5", "0", "-1", "", null])(
    "rejects invalid institution ID %s",
    async (chapterId) => {
      expect(
        (await errors({ ...input, chapterId })).some(
          (error) => error.property === "chapterId",
        ),
      ).toBe(true);
    },
  );
  it("rejects blank names and client-controlled approval flags", async () => {
    const result = await errors({
      ...input,
      firstName: "   ",
      isApproved: true,
      isActive: false,
    });
    expect(result.map((error) => error.property)).toEqual(
      expect.arrayContaining(["firstName", "isApproved", "isActive"]),
    );
  });
});
