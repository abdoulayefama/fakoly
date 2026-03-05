import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { FeatureKey, AuditAction } from "@prisma/client";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class FeatureFlagsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getCountryFlags(countryCode: string) {
    const country = await this.prisma.country.findUnique({
      where: { code: countryCode },
      include: { flags: true },
    });
    if (!country) throw new NotFoundException("Country not found");
    return country;
  }

  async setFlag(
    countryCode: string,
    key: FeatureKey,
    enabled: boolean,
    meta?: { ip?: string; userAgent?: string; actor?: string },
  ) {
    const country = await this.prisma.country.findUnique({ where: { code: countryCode } });
    if (!country) throw new NotFoundException("Country not found");

    const before = await this.prisma.featureFlag.findUnique({
      where: { countryId_key: { countryId: country.id, key } },
    });

    const after = await this.prisma.featureFlag.upsert({
      where: { countryId_key: { countryId: country.id, key } },
      update: { enabled },
      create: { countryId: country.id, key, enabled },
    });

    await this.audit.log({
      action: AuditAction.FEATURE_FLAG_SET,
      actor: meta?.actor ?? "internal_api",
      countryId: country.id,
      entity: "FeatureFlag",
      entityId: after.id,
      before,
      after,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return after;
  }
}