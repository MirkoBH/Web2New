import { Transform } from 'class-transformer';
import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { limpiarTexto } from '../../comun/transformaciones';

export class CrearConsultaDto {
  @IsUUID()
  autoId: string;

  @Transform(limpiarTexto)
  @IsString()
  @MinLength(8)
  @MaxLength(500)
  pregunta: string;
}
