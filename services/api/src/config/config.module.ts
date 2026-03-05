import { Module } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@nestjs/config";
import { envSchema } from "./env.schema";

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
      validate: (config: Record<string, unknown>) => {
        const parsed = envSchema.safeParse(config);
        if (!parsed.success) {
          // Erreur lisible en cas de .env incomplet / invalide
          const details = parsed.error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("\n");
          throw new Error(`Invalid environment variables:\n${details}`);
        }
        return parsed.data;
      },
    }),
  ],
})
export class ConfigModule {}