import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateUserProfileDto {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  address?: string;
}
