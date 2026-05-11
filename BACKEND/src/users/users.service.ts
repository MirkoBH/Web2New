import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Usuario } from './usuario.entity';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuariosRepo: Repository<Usuario>,
  ) {}

  async crear(dto: CrearUsuarioDto): Promise<Omit<Usuario, 'password'>> {
    const existe = await this.usuariosRepo.findOneBy({ email: dto.email.toLowerCase() });
    if (existe) throw new ConflictException('El email ya está registrado');

    const hash = await bcrypt.hash(dto.password, 12);
    const usuario = this.usuariosRepo.create({
      ...dto,
      email: dto.email.toLowerCase(),
      password: hash,
      emailVerificado: true,
    });

    const guardado = await this.usuariosRepo.save(usuario);
    const { password: _, ...resultado } = guardado as any;
    return resultado;
  }

  async buscarPorEmailConPassword(email: string): Promise<Usuario | null> {
    return this.usuariosRepo
      .createQueryBuilder('u')
      .addSelect('u.password')
      .where('u.email = :email', { email: email.toLowerCase() })
      .getOne();
  }

  async buscarPorId(id: string): Promise<Usuario> {
    const usuario = await this.usuariosRepo.findOneBy({ id });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    return usuario;
  }

  async actualizar(id: string, dto: ActualizarUsuarioDto): Promise<Usuario> {
    const usuario = await this.buscarPorId(id);
    Object.assign(usuario, dto);
    return this.usuariosRepo.save(usuario);
  }
}
