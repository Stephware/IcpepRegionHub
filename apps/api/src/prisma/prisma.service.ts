import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(configService: ConfigService) {
    const databaseUrl = configService.get<string>("DATABASE_URL");

    if (
      !databaseUrl ||
      databaseUrl.includes("USERNAME:PASSWORD") ||
      databaseUrl.includes("CHANGE_ME")
    ) {
      throw new Error(
        "DATABASE_URL is not configured. Set it in apps/api/.env before starting the API.",
      );
    }

    super({
      adapter: new PrismaPg(databaseUrl),
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
