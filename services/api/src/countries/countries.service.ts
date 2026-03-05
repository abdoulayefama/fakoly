import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { AuditAction } from "@prisma/client";
import { CreateCountryDto } from "./dto/create-country.dto";
import { UpdateCountryDto } from "./dto/update-country.dto";
import { UpdateCountrySettingsDto } from "./dto/update-country-settings.dto";

@Injectable()
export class CountriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list() {
    return this.prisma.country.findMany({
      orderBy: { code: "asc" },
      include: { settings: true },
    });
  }

  async getByCode(code: string) {
    const country = await this.prisma.country.findUnique({
      where: { code },
      include: { settings: true, flags: true },
    });
    if (!country) throw new NotFoundException("Country not found");
    return country;
  }

   async create(input: CreateCountryDto, meta?: { actor?: string; ip?: string; userAgent?: string }) {
    const code = input.code.toUpperCase();

    try {
      const created = await this.prisma.country.create({
        data: {
          code,
          name: input.name,
          currency: input.currency,
          isActive: input.isActive ?? true,
          timezone: input.timezone ?? "Africa/Conakry",
          defaultLocale: input.defaultLocale ?? "fr-GN",
          callingCode: input.callingCode,
          settings: { create: {} },
        },
        include: { settings: true },
      });

      await this.audit.log({
        action: AuditAction.COUNTRY_CREATED,
        actor: meta?.actor ?? "internal_api",
        countryId: created.id,
        entity: "Country",
        entityId: created.id,
        before: undefined,
        after: created,
        ip: meta?.ip,
        userAgent: meta?.userAgent,
      });

      return created;
    } catch (e: any) {
      // Prisma unique violation
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new ConflictException(`Country with code '${code}' already exists`);
      }
      throw e;
    }
  }

  async update(code: string, input: UpdateCountryDto, meta?: { actor?: string; ip?: string; userAgent?: string }) {
    const existing = await this.prisma.country.findUnique({ where: { code } });
    if (!existing) throw new NotFoundException("Country not found");

    const updated = await this.prisma.country.update({
      where: { code },
      data: {
        name: input.name,
        currency: input.currency,
        isActive: input.isActive,
        timezone: input.timezone,
        defaultLocale: input.defaultLocale,
        callingCode: input.callingCode,
      },
      include: { settings: true },
    });

    await this.audit.log({
      action: AuditAction.COUNTRY_UPDATED,
      actor: meta?.actor ?? "internal_api",
      countryId: existing.id,
      entity: "Country",
      entityId: existing.id,
      before: existing,
      after: updated,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return updated;
  }

  async activate(code: string, isActive: boolean, meta?: { actor?: string; ip?: string; userAgent?: string }) {
    const existing = await this.prisma.country.findUnique({ where: { code } });
    if (!existing) throw new NotFoundException("Country not found");

    const updated = await this.prisma.country.update({
      where: { code },
      data: { isActive },
    });

    await this.audit.log({
      action: isActive ? AuditAction.COUNTRY_ACTIVATED : AuditAction.COUNTRY_DEACTIVATED,
      actor: meta?.actor ?? "internal_api",
      countryId: existing.id,
      entity: "Country",
      entityId: existing.id,
      before: existing,
      after: updated,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return updated;
  }

  async getSettings(code: string) {
    const country = await this.prisma.country.findUnique({
      where: { code },
      include: { settings: true },
    });
    if (!country) throw new NotFoundException("Country not found");

    // si settings absent (cas anciens), on le crée
    if (!country.settings) {
      const created = await this.prisma.countrySettings.create({
        data: { countryId: country.id },
      });
      return created;
    }

    return country.settings;
  }

  async updateSettings(
    code: string,
    input: UpdateCountrySettingsDto,
    meta?: { actor?: string; ip?: string; userAgent?: string },
  ) {
    const country = await this.prisma.country.findUnique({ where: { code } });
    if (!country) throw new NotFoundException("Country not found");

    const before = await this.prisma.countrySettings.findUnique({ where: { countryId: country.id } });

    const after = await this.prisma.countrySettings.upsert({
      where: { countryId: country.id },
      update: {
        mapProvider: input.mapProvider,
        mapboxPublicToken: input.mapboxPublicToken,
        mapStyleUrl: input.mapStyleUrl,
        defaultCommissionBps: input.defaultCommissionBps,
        vatEnabled: input.vatEnabled,
        vatRateBps: input.vatRateBps,
        supportPhone: input.supportPhone,
        supportEmail: input.supportEmail,
      },
      create: {
        countryId: country.id,
        mapProvider: input.mapProvider ?? "mapbox",
        mapboxPublicToken: input.mapboxPublicToken,
        mapStyleUrl: input.mapStyleUrl,
        defaultCommissionBps: input.defaultCommissionBps ?? 1500,
        vatEnabled: input.vatEnabled ?? false,
        vatRateBps: input.vatRateBps ?? 0,
        supportPhone: input.supportPhone,
        supportEmail: input.supportEmail,
      },
    });

    await this.audit.log({
      action: AuditAction.COUNTRY_SETTINGS_UPDATED,
      actor: meta?.actor ?? "internal_api",
      countryId: country.id,
      entity: "CountrySettings",
      entityId: after.id,
      before,
      after,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return after;
  }
}