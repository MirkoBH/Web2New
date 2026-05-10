import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CrearUsuarioDto } from '../users/dto/crear-usuario.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  registrar(@Body() dto: CrearUsuarioDto) {
    return this.authService.registrar(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
