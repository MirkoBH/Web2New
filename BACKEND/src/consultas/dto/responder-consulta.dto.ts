import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { limpiarTexto } from '../../comun/transformaciones';

export class ResponderConsultaDto {
  @Transform(limpiarTexto)
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  respuesta: string;
}
