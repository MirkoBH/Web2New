import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Usuario } from '../users/usuario.entity';
import { Auto } from '../cars/auto.entity';

@Entity('consultas')
export class Consulta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Auto, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'auto_id' })
  auto: Auto;

  @Column({ name: 'auto_id' })
  autoId: string;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'comprador_id' })
  comprador: Usuario;

  @Column({ name: 'comprador_id' })
  compradorId: string;

  @Column({ name: 'vendedor_id' })
  vendedorId: string;

  @Column({ type: 'text' })
  pregunta: string;

  @Column({ type: 'text', nullable: true })
  respuesta: string;

  @CreateDateColumn()
  createdAt: Date;
}
