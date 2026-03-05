import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { FeatureKey } from "@prisma/client";

@Injectable()
export class FeatureFlagsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCountryFlags(countryCode: string) {
    const country = await this.prisma.country.findUnique({
      where: { code: countryCode },
      include: { flags: true },
    });
    if (!country) throw new NotFoundException("Country not found");
    return country;
  }

  async setFlag(countryCode: string, key: FeatureKey, enabled: boolean) {
    const country = await this.prisma.country.findUnique({ where: { code: countryCode } });
    if (!country) throw new NotFoundException("Country not found");

    return this.prisma.featureFlag.upsert({
      where: { countryId_key: { countryId: country.id, key } },
      update: { enabled },
      create: { countryId: country.id, key, enabled },
    });
  }
}