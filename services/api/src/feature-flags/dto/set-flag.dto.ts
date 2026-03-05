import { FeatureKey } from "@prisma/client";
import { IsBoolean, IsEnum } from "class-validator";

export class SetFlagDto {
  @IsEnum(FeatureKey)
  key!: FeatureKey;

  @IsBoolean()
  enabled!: boolean;
}