import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Usuario } from '../users/usuario.entity';
import { ImagenAuto } from './imagen-auto.entity';

export enum TipoCombustible {
  NAFTA = 'Nafta',
  DIESEL = 'Diesel',
  HIBRIDO = 'Hibrido',
  ELECTRICO = 'Electrico',
}

export enum TipoTransmision {
  MANUAL = 'Manual',
  AUTOMATICO = 'Automatico',
}

@Entity('autos')
export class Auto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Usuario, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendedor_id' })
  vendedor: Usuario;

  @Column({ name: 'vendedor_id' })
  vendedorId: string;

  @Column({ length: 60 })
  marca: string;

  @Column({ length: 80 })
  modelo: string;

  @Column({ length: 40, nullable: true })
  color: string;

  @Column({ type: 'int' })
  anio: number;

  @Column({ type: 'int' })
  kilometraje: number;

  @Column({ type: 'enum', enum: TipoTransmision })
  transmision: TipoTransmision;

  @Column({ type: 'enum', enum: TipoCombustible })
  combustible: TipoCombustible;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  precio: number;

  @Column({ length: 100 })
  ubicacion: string;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ type: 'text', nullable: true })
  detallesDanios: string;

  // ── Relación con imágenes (almacenadas en Supabase Storage) ──
  @OneToMany(() => ImagenAuto, (img) => img.auto, { eager: true, cascade: true })
  imagenes: ImagenAuto[];

  // ── Resultado del análisis de IA ──────────────────────────
  @Column({ nullable: true, length: 40 })
  iaEstado: string;

  @Column({ type: 'float', nullable: true })
  iaPuntaje: number;

  @Column({ type: 'text', nullable: true })
  iaDanios: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  iaRangoPrecioMin: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  iaRangoPrecioMax: number;

  @Column({ type: 'text', nullable: true })
  iaResumen: string;

  @Column({ default: false })
  iaAprobado: boolean;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
