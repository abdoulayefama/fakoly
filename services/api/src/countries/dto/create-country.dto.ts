import { IsBoolean, IsOptional, IsString, Length, Matches } from "class-validator";

export class CreateCountryDto {
  @IsString()
  @Length(2, 2)
  @Matches(/^[A-Z]{2}$/)
  code!: string; // "GN"

  @IsString()
  @Length(2, 80)
  name!: string;

  @IsString()
  @Length(3, 8)
  currency!: string; // "GNF"

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  defaultLocale?: string;

  @IsOptional()
  @IsString()
  callingCode?: string;
}