import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterAuthenticationDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(7)
  @MaxLength(72)
  password: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['man', 'woman'])
  gender: string;

  @IsOptional()
  @IsString()
  role?: string;
}
