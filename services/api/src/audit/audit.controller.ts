import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditAction } from "@prisma/client";
import { InternalApiKeyGuard } from "../internal/internal-api-key.guard";

@Controller("/internal/audit-logs")
@UseGuards(InternalApiKeyGuard)
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(
    @Query("limit") limit = "50",
    @Query("action") action?: AuditAction,
    @Query("countryCode") countryCode?: string,
  ) {
    const take = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);

    let countryId: string | undefined = undefined;
    if (countryCode) {
      const c = await this.prisma.country.findUnique({
        where: { code: countryCode.toUpperCase() },
        select: { id: true },
      });
      countryId = c?.id;
    }

    const where: any = {};
    if (action) where.action = action;
    if (countryId) where.countryId = countryId;

    const items = await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
    });

    return { take, count: items.length, items };
  }
}