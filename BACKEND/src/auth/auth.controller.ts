import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { AuthService, Session } from './auth.service';
import { LoginDto } from './dto/login.dto';

/** Límite más estricto para frenar ataques de fuerza bruta: 5 intentos por minuto. */
const AUTH_LIMIT = { default: { limit: 5, ttl: 60_000 } };

@Controller('auth')
@Throttle(AUTH_LIMIT)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** POST /api/auth/register */
  @Post('register')
  register(@Body() dto: CreateUserDto): Promise<Session> {
    return this.authService.register(dto);
  }

  /** POST /api/auth/login */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<Session> {
    return this.authService.login(dto);
  }
}
