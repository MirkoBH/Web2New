import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Auto } from '../autos/auto.entity';
import { Usuario } from '../usuarios/usuario.entity';

/** Pregunta pública de un comprador sobre un auto, con la respuesta del vendedor. */
@Entity('consultas')
@Index(['autoId', 'compradorId'], { unique: true })
export class Consulta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Auto, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn()
  auto: Auto;

  @Column({ type: 'uuid' })
  autoId: string;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn()
  comprador: Usuario;

  @Column({ type: 'uuid' })
  compradorId: string;

  /** Se guarda para listar rápido las consultas recibidas por cada vendedor. */
  @ManyToOne(() => Usuario, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn()
  vendedor: Usuario;

  @Column({ type: 'uuid' })
  vendedorId: string;

  @Column({ type: 'text' })
  pregunta: string;

  @Column({ type: 'text', nullable: true })
  respuesta: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  creadoEn: Date;
}
