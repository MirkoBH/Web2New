import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 80 })
  nombre: string;

  @Column({ length: 120, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  telefono: string | null;

  /** Hash bcrypt. No se lee salvo que se pida explícitamente (`addSelect`). */
  @Column({ select: false })
  password: string;

  @Column({ default: false })
  emailVerificado: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  creadoEn: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  actualizadoEn: Date;
}

/** Datos del usuario que se devuelven al propio usuario. Nunca incluye el hash. */
export type PerfilUsuario = Pick<
  Usuario,
  'id' | 'nombre' | 'email' | 'telefono'
>;

export function aPerfil(usuario: Usuario): PerfilUsuario {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    telefono: usuario.telefono,
  };
}
