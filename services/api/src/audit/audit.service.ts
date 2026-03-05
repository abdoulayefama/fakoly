import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditAction, Prisma } from "@prisma/client";

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  private toJson(val: unknown | null | undefined):
    | Prisma.InputJsonValue
    | Prisma.NullableJsonNullValueInput
    | undefined {
    if (val === undefined) return undefined;
    if (val === null) return Prisma.JsonNull;

    // Convertit Date/BigInt/objets Prisma en JSON sérialisable
    return JSON.parse(JSON.stringify(val)) as Prisma.InputJsonValue;
  }

  async log(input: {
    action: AuditAction;
    actor: string;
    countryId?: string | null;
    entity: string;
    entityId?: string | null;
    before?: unknown | null;
    after?: unknown | null;
    ip?: string | null;
    userAgent?: string | null;
  }) {
    return this.prisma.auditLog.create({
      data: {
        action: input.action,
        actor: input.actor,
        countryId: input.countryId ?? null,
        entity: input.entity,
        entityId: input.entityId ?? null,
        before: this.toJson(input.before),
        after: this.toJson(input.after),
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  }
}