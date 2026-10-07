export const ACTIVE_CHAPTER_STATUS = "Active";

export const REGION_3_AFFILIATED_SCHOOLS = [
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

export type ChapterSeedRecord = {
  chapterId: bigint;
  schoolName: string;
  chapterName: string;
  status: string;
};

export type ChapterSeedCreateData = {
  schoolName: string;
  chapterName: string;
  status: typeof ACTIVE_CHAPTER_STATUS;
};

export type ChapterSeedUpdateData = {
  schoolName?: string;
  chapterName?: string;
  status?: typeof ACTIVE_CHAPTER_STATUS;
  updatedAt?: Date;
};

export type ChapterSeedClient = {
  chapter: {
    findMany(args: {
      select: {
        chapterId: true;
        schoolName: true;
        chapterName: true;
        status: true;
      };
    }): Promise<ChapterSeedRecord[]>;
    update(args: {
      where: { chapterId: bigint };
      data: ChapterSeedUpdateData;
    }): Promise<unknown>;
    create(args: { data: ChapterSeedCreateData }): Promise<unknown>;
  };
};

export type AffiliatedSchoolSeedSummary = {
  expectedCount: number;
  created: number;
  updated: number;
  unchanged: number;
  matched: number;
  duplicateSchoolNames: string[];
};

export function normalizeSchoolName(schoolName: string) {
  return schoolName
    .trim()
    .replace(/\s*-\s*/g, " - ")
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en-US");
}

export function findDuplicateNormalizedSchoolNames(
  schoolNames: readonly string[] = REGION_3_AFFILIATED_SCHOOLS,
) {
  const groupedNames = new Map<string, string[]>();

  for (const schoolName of schoolNames) {
    const normalizedName = normalizeSchoolName(schoolName);
    groupedNames.set(normalizedName, [
      ...(groupedNames.get(normalizedName) ?? []),
      schoolName,
    ]);
  }

  return [...groupedNames.values()]
    .filter((names) => names.length > 1)
    .map(([schoolName]) => schoolName)
    .sort((left, right) => left.localeCompare(right));
}

export function findMissingAffiliatedSchools(
  chapters: readonly Pick<ChapterSeedRecord, "schoolName">[],
) {
  const existingSchoolNames = new Set(
    chapters.map((chapter) => normalizeSchoolName(chapter.schoolName)),
  );

  return REGION_3_AFFILIATED_SCHOOLS.filter(
    (schoolName) => !existingSchoolNames.has(normalizeSchoolName(schoolName)),
  );
}

export async function reconcileRegion3AffiliatedSchools(
  client: ChapterSeedClient,
  now = new Date(),
): Promise<AffiliatedSchoolSeedSummary> {
  const existingChapters = await client.chapter.findMany({
    select: {
      chapterId: true,
      schoolName: true,
      chapterName: true,
      status: true,
    },
  });

  const chaptersBySchoolName =
    groupChaptersByNormalizedSchoolName(existingChapters);

  const summary: AffiliatedSchoolSeedSummary = {
    expectedCount: REGION_3_AFFILIATED_SCHOOLS.length,
    created: 0,
    updated: 0,
    unchanged: 0,
    matched: 0,
    duplicateSchoolNames: findDuplicateExistingSchoolNames(existingChapters),
  };

  for (const schoolName of REGION_3_AFFILIATED_SCHOOLS) {
    const [existingChapter] =
      chaptersBySchoolName.get(normalizeSchoolName(schoolName)) ?? [];

    if (!existingChapter) {
      await client.chapter.create({
        data: {
          schoolName,
          chapterName: schoolName,
          status: ACTIVE_CHAPTER_STATUS,
        },
      });
      summary.created += 1;
      continue;
    }

    summary.matched += 1;

    const updateData: ChapterSeedUpdateData = {};
    if (existingChapter.schoolName !== schoolName) {
      updateData.schoolName = schoolName;
    }
    if (!existingChapter.chapterName.trim()) {
      updateData.chapterName = schoolName;
    }
    if (existingChapter.status !== ACTIVE_CHAPTER_STATUS) {
      updateData.status = ACTIVE_CHAPTER_STATUS;
    }

    if (Object.keys(updateData).length) {
      updateData.updatedAt = now;
      await client.chapter.update({
        where: { chapterId: existingChapter.chapterId },
        data: updateData,
      });
      summary.updated += 1;
    } else {
      summary.unchanged += 1;
    }
  }

  return summary;
}

function groupChaptersByNormalizedSchoolName<
  Chapter extends Pick<ChapterSeedRecord, "schoolName">,
>(chapters: readonly Chapter[]) {
  const chaptersBySchoolName = new Map<string, Chapter[]>();

  for (const chapter of chapters) {
    const normalizedName = normalizeSchoolName(chapter.schoolName);
    chaptersBySchoolName.set(normalizedName, [
      ...(chaptersBySchoolName.get(normalizedName) ?? []),
      chapter,
    ]);
  }

  return chaptersBySchoolName;
}

function findDuplicateExistingSchoolNames(
  chapters: readonly Pick<ChapterSeedRecord, "schoolName">[],
) {
  return [...groupChaptersByNormalizedSchoolName(chapters).values()]
    .filter((matchingChapters) => matchingChapters.length > 1)
    .map(([chapter]) => chapter.schoolName.trim())
    .sort((left, right) => left.localeCompare(right));
}
