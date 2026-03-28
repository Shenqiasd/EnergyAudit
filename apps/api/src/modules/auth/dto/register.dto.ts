import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码长度不能少于6位' })
  password!: string;

  @IsString()
  @IsNotEmpty({ message: '姓名不能为空' })
  name!: string;

  @IsEnum(['enterprise_user', 'manager', 'reviewer'], { message: '角色必须是 enterprise_user, manager 或 reviewer' })
  role!: string;
}
