import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  limpiarTexto,
  normalizarEmail,
  vacioANulo,
} from '../../comun/transformaciones';

export class CrearUsuarioDto {
  @Transform(limpiarTexto)
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  nombre: string;

  @Transform(normalizarEmail)
  @IsEmail({}, { message: 'El email no es válido' })
  @MaxLength(120)
  email: string;

  @IsOptional()
  @Transform(vacioANulo)
  @IsString()
  @Matches(/^[+\d\s()-]{8,30}$/, {
    message:
      'El teléfono solo puede tener números, espacios y los signos + ( ) -',
  })
  telefono?: string | null;

  /** bcrypt solo usa los primeros 72 bytes, por eso el máximo. */
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/, {
    message: 'La contraseña debe tener letras, números y al menos un símbolo',
  })
  password: string;
}
