import { Module } from "@nestjs/common";
import { AppService } from "./app.service";
import { ConfigModule } from "./config/config.module";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthModule } from "./health/health.module";

@Module({
  imports: [ConfigModule, PrismaModule, HealthModule],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}