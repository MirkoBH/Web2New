import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Auto } from './auto.entity';

@Entity('imagenes_auto')
export class ImagenAuto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Auto, (auto) => auto.imagenes, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn()
  auto: Auto;

  @Column({ type: 'uuid' })
  autoId: string;

  /** Ruta dentro del bucket, por ejemplo `<autoId>/<uuid>.jpg`. */
  @Column({ type: 'text' })
  rutaArchivo: string;

  @Column({ type: 'text' })
  urlPublica: string;

  @Column({ type: 'int', default: 0 })
  orden: number;

  @CreateDateColumn({ type: 'timestamptz' })
  creadoEn: Date;
}
