import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Car } from '../cars/car.entity';
import { User } from '../users/user.entity';

/** Pregunta pública de un comprador sobre un auto, con la respuesta del vendedor. */
@Entity('consultas')
@Index(['carId', 'buyerId'], { unique: true })
export class Inquiry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Car, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'auto_id' })
  car: Car;

  @Column({ name: 'auto_id', type: 'uuid' })
  carId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'comprador_id' })
  buyer: User;

  @Column({ name: 'comprador_id', type: 'uuid' })
  buyerId: string;

  /** Se guarda para listar rápido las consultas recibidas por cada vendedor. */
  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'vendedor_id' })
  seller: User;

  @Column({ name: 'vendedor_id', type: 'uuid' })
  sellerId: string;

  @Column({ name: 'pregunta', type: 'text' })
  question: string;

  @Column({ name: 'respuesta', type: 'text', nullable: true })
  answer: string | null;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
  createdAt: Date;
}
