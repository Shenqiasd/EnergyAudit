import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAuditBatchDto {
  @IsString()
  @IsNotEmpty({ message: '批次名称不能为空' })
  name!: string;

  @IsInt({ message: '年份必须为整数' })
  year!: number;

  @IsEnum(['energy_audit', 'energy_diagnosis'], { message: '业务类型必须是 energy_audit 或 energy_diagnosis' })
  @IsOptional()
  businessType?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  templateVersionId?: string;

  @IsString()
  @IsOptional()
  filingDeadline?: string;

  @IsString()
  @IsOptional()
  reviewDeadline?: string;
}
