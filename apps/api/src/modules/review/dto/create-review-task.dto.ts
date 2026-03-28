import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateReviewTaskDto {
  @IsString()
  @IsNotEmpty({ message: '审计项目ID不能为空' })
  auditProjectId!: string;

  @IsString()
  @IsOptional()
  reviewerId?: string;

  @IsString()
  @IsOptional()
  reviewType?: string;
}
