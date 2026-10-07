import { describe, expect, it, jest } from "@jest/globals";
import {
  ACTIVE_CHAPTER_STATUS,
  type ChapterSeedClient,
  type ChapterSeedCreateData,
  type ChapterSeedRecord,
  type ChapterSeedUpdateData,
  findDuplicateNormalizedSchoolNames,
  findMissingAffiliatedSchools,
  reconcileRegion3AffiliatedSchools,
  REGION_3_AFFILIATED_SCHOOLS,
} from "./affiliated-schools.js";

const officialSchools = [
  "Angeles University Foundation",
  "Bataan Peninsula State University",
  "Bulacan State University - Bustos Campus",
  "Bulacan State University - Main Campus",
  "Bulacan State University - Meneses Campus",
  "Colegio de San Gabriel Arcangel",
  "Columban College Inc",
  "Dr. Yanga's College Inc.",
  "EASTWOODS Professional College of Science and Technology",
  "Fernandez College of Arts and Technology",
  "FEU Pampanga",
  "Holy Angel University",
  "Holy Cross College",
  "La Consolacion University Philippines",
  "Lyceum of Subic Bay",
  "National University Baliwag",
  "National University Clark",
  "Pampanga State Agricultural University",
  "Pampanga State University",
  "President Ramon Magsaysay State University",
  "St. Nicolas College of Business and Technology",
  "STI College Balagtas",
  "STI San Jose del Monte",
  "Systems Plus College Foundation",
  "University of the Assumption",
  "Wesleyan University - Philippines",
] as const;

type MutableChapterSeedRecord = ChapterSeedRecord & {
  updatedAt?: Date | null;
};

describe("Region 3 affiliated schools", () => {
  it("defines exactly 26 canonical schools", () => {
    expect(REGION_3_AFFILIATED_SCHOOLS).toHaveLength(26);
    expect(REGION_3_AFFILIATED_SCHOOLS).toEqual(officialSchools);
  });

  it("does not define duplicate school names", () => {
    expect(findDuplicateNormalizedSchoolNames()).toEqual([]);
  });

  it("includes every required official school", () => {
    expect(
      findMissingAffiliatedSchools(
        officialSchools.map((schoolName, index) => ({
          chapterId: BigInt(index + 1),
          schoolName,
          chapterName: schoolName,
          status: ACTIVE_CHAPTER_STATUS,
        })),
      ),
    ).toEqual([]);
  });

  it("keeps the three Bulacan State University campuses separate", () => {
    expect(
      REGION_3_AFFILIATED_SCHOOLS.filter((schoolName) =>
        schoolName.startsWith("Bulacan State University - "),
      ),
    ).toEqual([
      "Bulacan State University - Bustos Campus",
      "Bulacan State University - Main Campus",
      "Bulacan State University - Meneses Campus",
    ]);
  });

  it("keeps the National University campuses separate", () => {
    expect(
      REGION_3_AFFILIATED_SCHOOLS.filter((schoolName) =>
        schoolName.startsWith("National University "),
      ),
    ).toEqual(["National University Baliwag", "National University Clark"]);
  });

  it("seeds missing schools without creating duplicates on repeated runs", async () => {
    const { client, createChapter } = createSeedClient();
    const now = new Date("2026-10-08T00:00:00.000Z");

    const firstResult = await reconcileRegion3AffiliatedSchools(client, now);
    const secondResult = await reconcileRegion3AffiliatedSchools(client, now);

    expect(firstResult).toEqual(
      expect.objectContaining({
        created: 26,
        updated: 0,
        unchanged: 0,
      }),
    );
    expect(secondResult).toEqual(
      expect.objectContaining({
        created: 0,
        updated: 0,
        unchanged: 26,
      }),
    );
    expect(createChapter).toHaveBeenCalledTimes(26);
  });

  it("normalizes obvious formatting differences instead of inserting another record", async () => {
    const { client, createChapter, updateChapter } = createSeedClient([
      {
        chapterId: 1n,
        schoolName: "Bulacan State University- Main Campus",
        chapterName: "Bulacan State University - Main Campus",
        status: "Inactive",
      },
    ]);

    await reconcileRegion3AffiliatedSchools(
      client,
      new Date("2026-10-08T00:00:00.000Z"),
    );

    expect(createChapter).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          schoolName: "Bulacan State University - Main Campus",
        }),
      }),
    );
    expect(updateChapter).toHaveBeenCalledWith({
      where: { chapterId: 1n },
      data: {
        schoolName: "Bulacan State University - Main Campus",
        status: ACTIVE_CHAPTER_STATUS,
        updatedAt: new Date("2026-10-08T00:00:00.000Z"),
      },
    });
  });
});

function createSeedClient(initialChapters: MutableChapterSeedRecord[] = []) {
  const chapters = [...initialChapters];
  const createChapter = jest.fn(
    async ({ data }: { data: ChapterSeedCreateData }) => {
      const chapter: MutableChapterSeedRecord = {
        chapterId: BigInt(chapters.length + 1),
        schoolName: data.schoolName,
        chapterName: data.chapterName,
        status: data.status,
      };
      chapters.push(chapter);
      return chapter;
    },
  );
  const updateChapter = jest.fn(
    async ({
      where,
      data,
    }: {
      where: { chapterId: bigint };
      data: ChapterSeedUpdateData;
    }) => {
      const chapter = chapters.find(
        (record) => record.chapterId === where.chapterId,
      );
      if (!chapter) {
        throw new Error(`Missing chapter ${where.chapterId.toString()}`);
      }
      Object.assign(chapter, data);
      return chapter;
    },
  );

  const client: ChapterSeedClient = {
    chapter: {
      findMany: async () => chapters,
      update: updateChapter,
      create: createChapter,
    },
  };

  return {
    client,
    createChapter,
    updateChapter,
    chapters,
  };
}
