import { PartialType, PickType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

/** El usuario solo puede cambiar su nombre y su teléfono. */
export class UpdateUserDto extends PartialType(
  PickType(CreateUserDto, ['name', 'phone'] as const),
) {}
