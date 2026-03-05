import { Body, Controller, Get, Param, Patch } from "@nestjs/common";
import { FeatureFlagsService } from "./feature-flags.service";
import { FeatureKey } from "@prisma/client";

@Controller("/internal/feature-flags")
export class FeatureFlagsController {
  constructor(private readonly service: FeatureFlagsService) {}

  @Get("/:countryCode")
  get(@Param("countryCode") countryCode: string) {
    return this.service.getCountryFlags(countryCode.toUpperCase());
  }

  @Patch("/:countryCode")
  set(
    @Param("countryCode") countryCode: string,
    @Body() body: { key: FeatureKey; enabled: boolean },
  ) {
    return this.service.setFlag(countryCode.toUpperCase(), body.key, body.enabled);
  }
}