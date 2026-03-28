import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateEnterpriseDto {
  @IsString()
  @IsNotEmpty({ message: '统一社会信用代码不能为空' })
  unifiedSocialCreditCode!: string;

  @IsString()
  @IsNotEmpty({ message: '企业名称不能为空' })
  name!: string;

  @IsString()
  @IsOptional()
  industryCode?: string;

  @IsString()
  @IsOptional()
  contactPerson?: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;

  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  @IsOptional()
  contactEmail?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
