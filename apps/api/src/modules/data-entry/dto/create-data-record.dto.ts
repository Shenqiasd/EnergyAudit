import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDataRecordDto {
  @IsString()
  @IsNotEmpty({ message: '审计项目ID不能为空' })
  auditProjectId!: string;

  @IsString()
  @IsNotEmpty({ message: '模块代码不能为空' })
  moduleCode!: string;

  @IsString()
  @IsOptional()
  templateVersionId?: string;
}
