import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty({ message: '刷新令牌不能为空' })
  refreshToken!: string;
}
