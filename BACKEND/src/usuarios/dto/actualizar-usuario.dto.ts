import { PartialType, PickType } from '@nestjs/mapped-types';
import { CrearUsuarioDto } from './crear-usuario.dto';

/** El usuario solo puede cambiar su nombre y su teléfono. */
export class ActualizarUsuarioDto extends PartialType(
  PickType(CrearUsuarioDto, ['nombre', 'telefono'] as const),
) {}
