import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Car } from './car.entity';

@Entity('imagenes_auto')
export class CarImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Car, (car) => car.images, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'auto_id' })
  car: Car;

  @Column({ name: 'auto_id', type: 'uuid' })
  carId: string;

  /** Ruta dentro del bucket, por ejemplo `<carId>/<uuid>.jpg`. */
  @Column({ name: 'ruta_archivo', type: 'text' })
  filePath: string;

  @Column({ name: 'url_publica', type: 'text' })
  publicUrl: string;

  @Column({ name: 'orden', type: 'int', default: 0 })
  position: number;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
  createdAt: Date;
}
