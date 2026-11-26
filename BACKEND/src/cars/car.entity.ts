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
import { User } from '../users/user.entity';
import { CarImage } from './car-image.entity';

export enum Transmission {
  Manual = 'Manual',
  Automatic = 'Automatico',
}

export enum Fuel {
  Gasoline = 'Nafta',
  Diesel = 'Diesel',
  Hybrid = 'Hibrido',
  Electric = 'Electrico',
}

/** Postgres devuelve `numeric` como texto; esto lo convierte a número. */
const numericTransformer = {
  to: (value: number | null) => value,
  from: (value: string | null) => (value === null ? null : Number(value)),
};

/** Tabla `autos`: las columnas quedan en español y se mapean con `name`. */
@Entity('autos')
export class Car {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'vendedor_id' })
  seller: User;

  @Column({ name: 'vendedor_id', type: 'uuid' })
  sellerId: string;

  @Column({ name: 'marca', length: 60 })
  brand: string;

  @Column({ name: 'modelo', length: 80 })
  model: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  color: string | null;

  @Column({ name: 'anio', type: 'int' })
  year: number;

  @Index()
  @Column({ name: 'kilometraje', type: 'int' })
  mileage: number;

  @Column({
    name: 'transmision',
    type: 'enum',
    enum: Transmission,
    enumName: 'autos_transmision_enum',
  })
  transmission: Transmission;

  @Column({
    name: 'combustible',
    type: 'enum',
    enum: Fuel,
    enumName: 'autos_combustible_enum',
  })
  fuel: Fuel;

  @Column({
    name: 'precio',
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: numericTransformer,
  })
  price: number;

  @Column({ name: 'ubicacion', length: 100 })
  location: string;

  @Column({ name: 'descripcion', type: 'text' })
  description: string;

  @Column({ name: 'detalles_danios', type: 'text', nullable: true })
  damageDetails: string | null;

  @Column({ name: 'ia_estado', type: 'varchar', length: 40 })
  aiCondition: string;

  @Column({ name: 'ia_puntaje', type: 'double precision' })
  aiScore: number;

  @Column({ name: 'ia_danios', type: 'text' })
  aiDamages: string;

  @Column({
    name: 'ia_precio_min',
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: numericTransformer,
  })
  aiMinPrice: number;

  @Column({
    name: 'ia_precio_max',
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: numericTransformer,
  })
  aiMaxPrice: number;

  @Column({ name: 'ia_resumen', type: 'text' })
  aiSummary: string;

  @OneToMany(() => CarImage, (image) => image.car)
  images: CarImage[];

  @Index()
  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'actualizado_en', type: 'timestamptz' })
  updatedAt: Date;
}
