import { PartialType, PickType } from '@nestjs/mapped-types';
import { CreateCarDto } from './create-car.dto';

/**
 * Al editar solo se pueden cambiar los datos que el vendedor puede corregir
 * sin que sea otro auto: precio, kilometraje, descripción y daños.
 */
export class UpdateCarDto extends PartialType(
  PickType(CreateCarDto, [
    'price',
    'mileage',
    'description',
    'damageDetails',
  ] as const),
) {}
