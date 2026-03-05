import { Module } from "@nestjs/common";
import { CountriesService } from "./countries.service";
import { CountriesAdminController } from "./countries.admin.controller";

@Module({
  controllers: [CountriesAdminController],
  providers: [CountriesService],
  exports: [CountriesService],
})
export class CountriesModule {}