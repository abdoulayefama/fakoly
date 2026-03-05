import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditAction } from "@prisma/client";
import { AdminJwtGuard } from "../admin-auth/guards/admin-jwt.guard";
import { PermissionsGuard } from "../admin-auth/guards/permissions.guard";
import { RequirePermissions } from "../admin-auth/decorators/require-permissions.decorator";
import { AdminPermissionCode } from "../admin-auth/permissions";

@Controller("/admin/audit-logs")
@UseGuards(AdminJwtGuard, PermissionsGuard)
export class AuditAdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @RequirePermissions(AdminPermissionCode.AUDIT_READ)
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