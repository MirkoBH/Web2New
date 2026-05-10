import { IsString, IsUUID, MinLength } from 'class-validator';

export class CrearConsultaDto {
  @IsUUID()
  autoId: string;

  @IsString()
  @MinLength(8)
  pregunta: string;
}
