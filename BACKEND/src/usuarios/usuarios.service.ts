import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { Usuario } from './usuario.entity';

const RONDAS_BCRYPT = 12;

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarios: Repository<Usuario>,
  ) {}

  async crear(dto: CrearUsuarioDto): Promise<Usuario> {
    const existente = await this.usuarios.existsBy({ email: dto.email });
    if (existente) {
      throw new ConflictException('El email ya está registrado');
    }

    const usuario = this.usuarios.create({
      nombre: dto.nombre,
      email: dto.email,
      telefono: dto.telefono ?? null,
      password: await bcrypt.hash(dto.password, RONDAS_BCRYPT),
      emailVerificado: true,
    });
    return this.usuarios.save(usuario);
  }

  /** Incluye el hash de la contraseña: usar solo para validar credenciales. */
  buscarConPassword(email: string): Promise<Usuario | null> {
    return this.usuarios
      .createQueryBuilder('usuario')
      .addSelect('usuario.password')
      .where('usuario.email = :email', { email })
      .getOne();
  }

  async buscarPorId(id: string): Promise<Usuario> {
    const usuario = await this.usuarios.findOneBy({ id });
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return usuario;
  }

  async actualizar(id: string, dto: ActualizarUsuarioDto): Promise<Usuario> {
    const usuario = await this.buscarPorId(id);
    if (dto.nombre !== undefined) usuario.nombre = dto.nombre;
    if (dto.telefono !== undefined) usuario.telefono = dto.telefono || null;
    return this.usuarios.save(usuario);
  }
}
