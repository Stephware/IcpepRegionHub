import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { getDemoConfig, seedDemoDatabase } from "./demo-seed.js";

const config = getDemoConfig(process.env);
const prisma = new PrismaClient({ adapter: new PrismaPg(config.databaseUrl) });
try {
  const result = await seedDemoDatabase(prisma, config);
  console.log(
    "Local demo seed complete. Existing records and walkthrough edits were preserved.",
    result,
  );
  console.log(
    "Demo logins use the original DEMO_SEED_PASSWORD. pending@hub-demo.test requires admin approval.",
  );
} finally {
  await prisma.$disconnect();
}
