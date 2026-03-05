import "dotenv/config";
import { PrismaClient, FeatureKey } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcrypt";

function createPrisma() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is missing in environment");

  const pool = new Pool({ connectionString: url });
  const prisma = new PrismaClient({
    adapter: new PrismaPg(pool),
    log: ["error", "warn"],
  });

  return { prisma, pool };
}

async function seedCountryAndFlags(prisma: PrismaClient) {
  const country = await prisma.country.upsert({
    where: { code: "GN" },
    update: { isActive: true, name: "Guinée", currency: "GNF" },
    create: { code: "GN", name: "Guinée", currency: "GNF", isActive: true },
  });

  const keys: FeatureKey[] = [
    FeatureKey.MOBILITY_MOTO,
    FeatureKey.MOBILITY_CAR,
    FeatureKey.MOBILITY_TRICYCLE,
    FeatureKey.DELIVERY_PARCEL,
    FeatureKey.FOOD,
    FeatureKey.MARKETPLACE,
    FeatureKey.CARPOOL,
  ];

  for (const key of keys) {
    await prisma.featureFlag.upsert({
      where: { countryId_key: { countryId: country.id, key } },
      update: { enabled: true },
      create: { countryId: country.id, key, enabled: true },
    });
  }

  console.log("Seed OK:", country.code);
}

async function seedRbac(prisma: PrismaClient, adminEmail?: string) {
  const perms = [
    "FEATURE_FLAGS_WRITE",
    "FEATURE_FLAGS_READ",
    "AUDIT_READ",
    "COUNTRY_MANAGE",
    "USERS_MANAGE",
  ];

  for (const code of perms) {
    await prisma.adminPermission.upsert({
      where: { code },
      update: { name: code },
      create: { code, name: code },
    });
  }

  const superRole = await prisma.adminRole.upsert({
    where: { code: "SUPER_ADMIN" },
    update: { name: "Super Admin", isActive: true },
    create: { code: "SUPER_ADMIN", name: "Super Admin", isActive: true },
  });

  const allPerms = await prisma.adminPermission.findMany({ select: { id: true } });

  for (const p of allPerms) {
    await prisma.adminRolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superRole.id,
          permissionId: p.id,
        },
      },
      update: {},
      create: { roleId: superRole.id, permissionId: p.id },
    });
  }

  if (adminEmail) {
    const admin = await prisma.adminUser.findUnique({ where: { email: adminEmail } });
    if (admin) {
      await prisma.adminUserRole.upsert({
        where: {
          userId_roleId: {
            userId: admin.id,
            roleId: superRole.id,
          },
        },
        update: {},
        create: { userId: admin.id, roleId: superRole.id },
      });
      console.log("RBAC OK: SUPER_ADMIN role linked to", adminEmail);
    }
  }
}

async function seedBootstrapAdmin(prisma: PrismaClient) {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

  if (!email || !password) return { email: undefined as string | undefined };

  const hash = await bcrypt.hash(password, 10);

  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: { isActive: true },
    create: { email, passwordHash: hash, fullName: "Super Admin" },
  });

  console.log("Bootstrap Admin OK:", admin.email);
  return { email: admin.email };
}

async function main() {
  const { prisma, pool } = createPrisma();

  try {
    await seedCountryAndFlags(prisma);
    const { email } = await seedBootstrapAdmin(prisma);
    await seedRbac(prisma, email ?? undefined);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});