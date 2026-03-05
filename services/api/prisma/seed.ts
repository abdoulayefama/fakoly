import "dotenv/config";
import { PrismaClient, FeatureKey } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

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

async function main() {
  const { prisma, pool } = createPrisma();

  try {
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
  } finally {
    // important: fermer Prisma + pool PG
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
