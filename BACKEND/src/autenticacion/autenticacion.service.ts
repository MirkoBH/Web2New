import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { ContenidoToken } from '../comun/tipos/usuario-autenticado';
import { CrearUsuarioDto } from '../usuarios/dto/crear-usuario.dto';
import { aPerfil, PerfilUsuario, Usuario } from '../usuarios/usuario.entity';
import { UsuariosService } from '../usuarios/usuarios.service';
import { IniciarSesionDto } from './dto/iniciar-sesion.dto';

export interface Sesion {
  usuario: PerfilUsuario;
  token: string;
}

/**
 * Hash de una contraseña cualquiera. Se compara contra él cuando el email no
 * existe, para que la respuesta tarde lo mismo y no revele qué emails están
 * registrados.
 */
const HASH_FICTICIO =
  '$2b$12$TPWusUqtVD.MHj.ZyFwvqeFhuAqmUbxLBbn8Be50JaPbBwrU3WzTm';

@Injectable()
export class AutenticacionService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
  ) {}

  async registrar(dto: CrearUsuarioDto): Promise<Sesion> {
    const usuario = await this.usuariosService.crear(dto);
    return this.crearSesion(usuario);
  }

  async iniciarSesion(dto: IniciarSesionDto): Promise<Sesion> {
    const usuario = await this.usuariosService.buscarConPassword(dto.email);
    const coincide = await bcrypt.compare(
      dto.password,
      usuario?.password ?? HASH_FICTICIO,
    );
    if (!usuario || !coincide) {
      throw new UnauthorizedException('Email o contraseña incorrectos');
    }
    return this.crearSesion(usuario);
  }

  private crearSesion(usuario: Usuario): Sesion {
    const contenido: ContenidoToken = { sub: usuario.id, email: usuario.email };
    return {
      usuario: aPerfil(usuario),
      token: this.jwtService.sign(contenido),
    };
  }
}
