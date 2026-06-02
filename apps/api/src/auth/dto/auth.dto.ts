import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SignupDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @ApiProperty({ example: 'jane@collabflow.dev' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Demo@1234', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}

export class LoginDto {
  @ApiProperty({ example: 'admin@collabflow.dev' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Demo@1234' })
  @IsString()
  @MinLength(1)
  password!: string;
}
