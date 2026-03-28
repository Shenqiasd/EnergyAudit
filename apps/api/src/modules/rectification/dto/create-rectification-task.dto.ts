import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRectificationTaskDto {
  @IsString()
  @IsNotEmpty({ message: '审计项目ID不能为空' })
  auditProjectId!: string;

  @IsArray({ message: '问题ID列表必须是数组' })
  @IsString({ each: true })
  issueIds!: string[];

  @IsString()
  @IsOptional()
  deadline?: string;
}
