import { PrismaClient, FeatureKey } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const country = await prisma.country.upsert({
    where: { code: "GN" },
    update: {},
    create: {
      code: "GN",
      name: "Guinée",
      currency: "GNF",
      isActive: true,
    },
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

  // Par défaut V1 Guinée: tout activé (vous pouvez modifier)
  for (const key of keys) {
    await prisma.featureFlag.upsert({
      where: { countryId_key: { countryId: country.id, key } },
      update: { enabled: true },
      create: { countryId: country.id, key, enabled: true },
    });
  }

  console.log("Seed OK:", country.code);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });