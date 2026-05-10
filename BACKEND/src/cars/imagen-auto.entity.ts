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

  @ManyToOne(() => Auto, (auto) => auto.imagenes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'auto_id' })
  auto: Auto;

  @Column({ name: 'auto_id' })
  autoId: string;

  // Path dentro del bucket: "{autoId}/{uuid}.ext"
  @Column({ type: 'text', name: 'storage_path' })
  storagePath: string;

  // URL pública completa de Supabase Storage
  @Column({ type: 'text', name: 'url_publica' })
  urlPublica: string;

  // Nombre original del archivo subido
  @Column({ length: 255, nullable: true })
  nombre: string;

  // Posición en la galería (0 = portada)
  @Column({ type: 'int', default: 0 })
  orden: number;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;
}
