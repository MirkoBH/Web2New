import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum RolUsuario {
  COMPRADOR = 'comprador',
  VENDEDOR = 'vendedor',
}

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 80 })
  nombre: string;

  @Column({ unique: true, length: 120 })
  email: string;

  @Column({ length: 30, nullable: true })
  telefono: string;

  @Column({ select: false })
  password: string;

  @Column({ type: 'enum', enum: RolUsuario, default: RolUsuario.COMPRADOR })
  role: RolUsuario;

  @Column({ default: false })
  emailVerificado: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
