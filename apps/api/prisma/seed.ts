import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { reconcileRegion3AffiliatedSchools } from "../src/chapters/affiliated-schools.js";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is required before seeding ICpEP Region 3 chapters.",
  );
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(databaseUrl),
});

try {
  const result = await reconcileRegion3AffiliatedSchools(prisma);

  console.log(
    [
      `Seeded ${result.expectedCount} official ICpEP Region 3 affiliated schools.`,
      `created=${result.created}`,
      `updated=${result.updated}`,
      `unchanged=${result.unchanged}`,
      `matched=${result.matched}`,
    ].join(" "),
  );

  if (result.duplicateSchoolNames.length) {
    console.warn(
      `Existing duplicate chapter records were detected for: ${result.duplicateSchoolNames.join(
        ", ",
      )}. No records were deleted or merged automatically.`,
    );
  }
} finally {
  await prisma.$disconnect();
}
