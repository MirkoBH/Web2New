import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CrearUsuarioDto {
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  nombre: string;

  @IsEmail()
  @MaxLength(120)
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/, {
    message: 'La contraseña debe tener letras, números y al menos un símbolo',
  })
  password: string;
}
