import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { trimText, normalizeEmail, emptyToNull } from '../../common/transforms';

export class CreateUserDto {
  @Transform(trimText)
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  name: string;

  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'El email no es válido' })
  @MaxLength(120)
  email: string;

  @IsOptional()
  @Transform(emptyToNull)
  @IsString()
  @Matches(/^[+\d\s()-]{8,30}$/, {
    message:
      'El teléfono solo puede tener números, espacios y los signos + ( ) -',
  })
  phone?: string | null;

  /** bcrypt solo usa los primeros 72 bytes, por eso el máximo. */
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/, {
    message: 'La contraseña debe tener letras, números y al menos un símbolo',
  })
  password: string;
}
