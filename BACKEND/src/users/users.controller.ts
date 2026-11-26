import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../common/types/authenticated-user';
import { UpdateUserDto } from './dto/update-user.dto';
import { toProfile, UserProfile } from './user.entity';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** GET /api/users/me — perfil del usuario autenticado. */
  @Get('me')
  async getProfile(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserProfile> {
    return toProfile(await this.usersService.findById(user.id));
  }

  /** PATCH /api/users/me — actualizar nombre y teléfono. */
  @Patch('me')
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateUserDto,
  ): Promise<UserProfile> {
    return toProfile(await this.usersService.update(user.id, dto));
  }
}
