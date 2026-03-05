import { Body, Controller, Get, Param, Patch, Req, UseGuards } from "@nestjs/common";
import { FeatureFlagsService } from "./feature-flags.service";
import { AdminJwtGuard } from "../admin-auth/guards/admin-jwt.guard";
import { PermissionsGuard } from "../admin-auth/guards/permissions.guard";
import { RequirePermissions } from "../admin-auth/decorators/require-permissions.decorator";
import { AdminPermissionCode } from "../admin-auth/permissions";
import { SetFlagDto } from "./dto/set-flag.dto";




@Controller("/admin/feature-flags")
@UseGuards(AdminJwtGuard, PermissionsGuard)
export class FeatureFlagsAdminController {
  constructor(private readonly service: FeatureFlagsService) {}

  @Get("/:countryCode")
  @RequirePermissions(AdminPermissionCode.FEATURE_FLAGS_READ)
  getCountry(@Param("countryCode") countryCode: string) {
    return this.service.getCountryFlags(countryCode.toUpperCase());
  }

@Patch("/:countryCode")
  @RequirePermissions(AdminPermissionCode.FEATURE_FLAGS_WRITE)
  setFlag(@Param("countryCode") countryCode: string, @Body() dto: SetFlagDto, @Req() req: any) {
    const ip = req.ip;
    const userAgent = req.headers["user-agent"] as string | undefined;
    const actor = `admin:${req.adminUserId}`;

    return this.service.setFlag(countryCode.toUpperCase(), dto.key, dto.enabled, {
      ip,
      userAgent,
      actor,
    });
  }

}