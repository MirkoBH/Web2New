import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { normalizeEmail } from '../../common/transforms';

export class LoginDto {
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'El email no es válido' })
  @MaxLength(120)
  email: string;

  @IsString()
  @MinLength(1)
  @MaxLength(72)
  password: string;
}
