import { PartialType, PickType } from '@nestjs/mapped-types';
import { CrearAutoDto } from './crear-auto.dto';

/**
 * Al editar solo se pueden cambiar los datos que el vendedor puede corregir
 * sin que sea otro auto: precio, kilometraje, descripción y daños.
 */
export class EditarAutoDto extends PartialType(
  PickType(CrearAutoDto, [
    'precio',
    'kilometraje',
    'descripcion',
    'detallesDanios',
  ] as const),
) {}
