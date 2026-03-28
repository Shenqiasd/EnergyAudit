import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateAuditBatchDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsInt({ message: '年份必须为整数' })
  @IsOptional()
  year?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  filingDeadline?: string;

  @IsString()
  @IsOptional()
  reviewDeadline?: string;
}
