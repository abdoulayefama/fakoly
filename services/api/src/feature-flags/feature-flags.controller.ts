import { Body, Controller, Get, Param, Patch, Req, UseGuards } from "@nestjs/common";
import { FeatureFlagsService } from "./feature-flags.service";
import { FeatureKey } from "@prisma/client";
import { InternalApiKeyGuard } from "../internal/internal-api-key.guard";

@Controller("/internal/feature-flags")
@UseGuards(InternalApiKeyGuard)
export class FeatureFlagsController {
  constructor(private readonly service: FeatureFlagsService) {}

  @Get("/:countryCode")
  get(@Param("countryCode") countryCode: string) {
    return this.service.getCountryFlags(countryCode.toUpperCase());
  }

  @Patch("/:countryCode")
  set(@Param("countryCode") countryCode: string, @Body() body: { key: FeatureKey; enabled: boolean }, @Req() req: any) {
    return this.service.setFlag(countryCode.toUpperCase(), body.key, body.enabled, {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
  }
}