import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class UpdateCountrySettingsDto {
  @IsOptional()
  @IsString()
  mapProvider?: string; // "mapbox" | "osm"

  @IsOptional()
  @IsString()
  mapboxPublicToken?: string;

  @IsOptional()
  @IsString()
  mapStyleUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  defaultCommissionBps?: number;

  @IsOptional()
  @IsBoolean()
  vatEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  vatRateBps?: number;

  @IsOptional()
  @IsString()
  supportPhone?: string;

  @IsOptional()
  @IsString()
  supportEmail?: string;
}