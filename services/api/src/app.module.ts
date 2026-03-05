import { Module } from "@nestjs/common";
import { AppService } from "./app.service";
import { ConfigModule } from "./config/config.module";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthModule } from "./health/health.module";
import { FeatureFlagsModule } from "./feature-flags/feature-flags.module";
import { AuditModule } from "./audit/audit.module";
import { AdminAuthModule } from "./admin-auth/admin-auth.module";
import { AuthCoreModule } from "./auth-core/auth-core.module";

@Module({
  imports: [ConfigModule, PrismaModule, HealthModule, FeatureFlagsModule, AuditModule, AdminAuthModule, AuthCoreModule],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}