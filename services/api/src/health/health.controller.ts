import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "./redis.service";

@Controller()
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get("/health")
  async health() {
    const startedAt = Date.now();

    const db = await this.prisma.$queryRaw`SELECT 1 as ok`;
    const redis = await this.redis.ping();

    return {
      status: "ok",
      service: "fakoly-api",
      checks: {
        db: Array.isArray(db) ? "ok" : "ok",
        redis: redis === "PONG" ? "ok" : "unknown",
      },
      ts: new Date().toISOString(),
      ms: Date.now() - startedAt,
    };
  }
}