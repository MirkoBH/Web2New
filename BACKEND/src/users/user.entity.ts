import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/** Tabla `usuarios`: las columnas quedan en español y se mapean con `name`. */
@Entity('usuarios')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'nombre', length: 80 })
  name: string;

  @Column({ length: 120, unique: true })
  email: string;

  @Column({ name: 'telefono', type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  /** Hash bcrypt. No se lee salvo que se pida explícitamente (`addSelect`). */
  @Column({ select: false })
  password: string;

  @Column({ name: 'email_verificado', default: false })
  emailVerified: boolean;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'actualizado_en', type: 'timestamptz' })
  updatedAt: Date;
}

/** Datos del usuario que se devuelven al propio usuario. Nunca incluye el hash. */
export type UserProfile = Pick<User, 'id' | 'name' | 'email' | 'phone'>;

export function toProfile(user: User): UserProfile {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
  };
}
