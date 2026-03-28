import { IsOptional, IsString } from 'class-validator';

export class UpdateDataItemDto {
  @IsString()
  @IsOptional()
  rawValue?: string;

  @IsString()
  @IsOptional()
  manualOverrideValue?: string;

  @IsString()
  @IsOptional()
  unit?: string;
}
