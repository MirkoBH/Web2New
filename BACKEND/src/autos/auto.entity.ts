import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';
import { ImagenAuto } from './imagen-auto.entity';

export enum Transmision {
  Manual = 'Manual',
  Automatico = 'Automatico',
}

export enum Combustible {
  Nafta = 'Nafta',
  Diesel = 'Diesel',
  Hibrido = 'Hibrido',
  Electrico = 'Electrico',
}

/** Postgres devuelve `numeric` como texto; esto lo convierte a número. */
const numerico = {
  to: (valor: number | null) => valor,
  from: (valor: string | null) => (valor === null ? null : Number(valor)),
};

@Entity('autos')
export class Auto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn()
  vendedor: Usuario;

  @Column({ type: 'uuid' })
  vendedorId: string;

  @Column({ length: 60 })
  marca: string;

  @Column({ length: 80 })
  modelo: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  color: string | null;

  @Column({ type: 'int' })
  anio: number;

  @Index()
  @Column({ type: 'int' })
  kilometraje: number;

  @Column({
    type: 'enum',
    enum: Transmision,
    enumName: 'autos_transmision_enum',
  })
  transmision: Transmision;

  @Column({
    type: 'enum',
    enum: Combustible,
    enumName: 'autos_combustible_enum',
  })
  combustible: Combustible;

  @Column({ type: 'numeric', precision: 10, scale: 2, transformer: numerico })
  precio: number;

  @Column({ length: 100 })
  ubicacion: string;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ type: 'text', nullable: true })
  detallesDanios: string | null;

  @Column({ type: 'varchar', length: 40 })
  iaEstado: string;

  @Column({ type: 'double precision' })
  iaPuntaje: number;

  @Column({ type: 'text' })
  iaDanios: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, transformer: numerico })
  iaPrecioMin: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, transformer: numerico })
  iaPrecioMax: number;

  @Column({ type: 'text' })
  iaResumen: string;

  @OneToMany(() => ImagenAuto, (imagen) => imagen.auto)
  imagenes: ImagenAuto[];

  @Index()
  @CreateDateColumn({ type: 'timestamptz' })
  creadoEn: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  actualizadoEn: Date;
}
