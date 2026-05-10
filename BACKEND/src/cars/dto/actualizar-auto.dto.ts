import { PartialType } from '@nestjs/mapped-types';
import { CrearAutoDto } from './crear-auto.dto';

// Todos los campos de CrearAutoDto son opcionales al actualizar
export class ActualizarAutoDto extends PartialType(CrearAutoDto) {}
