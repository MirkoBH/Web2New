import { IsString, MinLength } from 'class-validator';

export class ResponderConsultaDto {
  @IsString()
  @MinLength(5)
  respuesta: string;
}
