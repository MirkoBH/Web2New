import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { CrearUsuarioDto } from '../users/dto/crear-usuario.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async registrar(dto: CrearUsuarioDto) {
    const usuario = await this.usersService.crear(dto);
    const token = this.generarToken(usuario as any);
    return { usuario, token };
  }

  async login(dto: LoginDto) {
    const usuario = await this.usersService.buscarPorEmailConPassword(dto.email);
    if (!usuario) throw new UnauthorizedException('Credenciales inválidas');

    const passwordValida = await bcrypt.compare(dto.password, usuario.password);
    if (!passwordValida) throw new UnauthorizedException('Credenciales inválidas');

    const { password: _, ...datos } = usuario as any;
    const token = this.generarToken(datos);
    return { usuario: datos, token };
  }

  private generarToken(usuario: { id: string; email: string }) {
    return this.jwtService.sign({
      sub:   usuario.id,
      email: usuario.email,
    });
  }
}
