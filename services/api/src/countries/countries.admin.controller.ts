import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { CountriesService } from "./countries.service";
import { AdminJwtGuard } from "../admin-auth/guards/admin-jwt.guard";
import { PermissionsGuard } from "../admin-auth/guards/permissions.guard";
import { RequirePermissions } from "../admin-auth/decorators/require-permissions.decorator";
import { AdminPermissionCode } from "../admin-auth/permissions";
import { CreateCountryDto } from "./dto/create-country.dto";
import { UpdateCountryDto } from "./dto/update-country.dto";
import { UpdateCountrySettingsDto } from "./dto/update-country-settings.dto";

@Controller("/admin/countries")
@UseGuards(AdminJwtGuard, PermissionsGuard)
export class CountriesAdminController {
  constructor(private readonly service: CountriesService) {}

  private meta(req: any) {
    return {
      ip: req.ip,
      userAgent: req.headers["user-agent"] as string | undefined,
      actor: `admin:${req.adminUserId}`,
    };
  }

  @Get()
  @RequirePermissions(AdminPermissionCode.COUNTRY_READ)
  list() {
    return this.service.list();
  }

  @Post()
  @RequirePermissions(AdminPermissionCode.COUNTRY_WRITE)
  create(@Body() dto: CreateCountryDto, @Req() req: any) {
    return this.service.create(dto, this.meta(req));
  }

  @Get("/:code")
  @RequirePermissions(AdminPermissionCode.COUNTRY_READ)
  get(@Param("code") code: string) {
    return this.service.getByCode(code.toUpperCase());
  }

  @Patch("/:code")
  @RequirePermissions(AdminPermissionCode.COUNTRY_WRITE)
  update(@Param("code") code: string, @Body() dto: UpdateCountryDto, @Req() req: any) {
    return this.service.update(code.toUpperCase(), dto, this.meta(req));
  }

  @Patch("/:code/activate")
  @RequirePermissions(AdminPermissionCode.COUNTRY_WRITE)
  activate(@Param("code") code: string, @Req() req: any) {
    return this.service.activate(code.toUpperCase(), true, this.meta(req));
  }

  @Patch("/:code/deactivate")
  @RequirePermissions(AdminPermissionCode.COUNTRY_WRITE)
  deactivate(@Param("code") code: string, @Req() req: any) {
    return this.service.activate(code.toUpperCase(), false, this.meta(req));
  }

  @Get("/:code/settings")
  @RequirePermissions(AdminPermissionCode.COUNTRY_READ)
  getSettings(@Param("code") code: string) {
    return this.service.getSettings(code.toUpperCase());
  }

  @Patch("/:code/settings")
  @RequirePermissions(AdminPermissionCode.COUNTRY_WRITE)
  updateSettings(@Param("code") code: string, @Body() dto: UpdateCountrySettingsDto, @Req() req: any) {
    return this.service.updateSettings(code.toUpperCase(), dto, this.meta(req));
  }
}