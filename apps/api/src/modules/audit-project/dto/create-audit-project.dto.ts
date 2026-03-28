import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAuditProjectDto {
  @IsString()
  @IsNotEmpty({ message: '企业ID不能为空' })
  enterpriseId!: string;

  @IsString()
  @IsNotEmpty({ message: '批次ID不能为空' })
  batchId!: string;

  @IsString()
  @IsOptional()
  businessType?: string;

  @IsString()
  @IsOptional()
  templateVersionId?: string;

  @IsString()
  @IsOptional()
  deadline?: string;
}
