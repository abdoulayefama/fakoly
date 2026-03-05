import { Module } from "@nestjs/common";
import { AppService } from "./app.service";
import { ConfigModule } from "./config/config.module";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthModule } from "./health/health.module";
import { FeatureFlagsModule } from "./feature-flags/feature-flags.module";
import { AuditModule } from "./audit/audit.module";

@Module({
  imports: [ConfigModule, PrismaModule, HealthModule, FeatureFlagsModule, AuditModule],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}