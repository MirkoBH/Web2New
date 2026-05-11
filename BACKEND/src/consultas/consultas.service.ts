import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Consulta } from './consulta.entity';
import { CrearConsultaDto } from './dto/crear-consulta.dto';
import { ResponderConsultaDto } from './dto/responder-consulta.dto';
import { CarsService } from '../cars/cars.service';

@Injectable()
export class ConsultasService {
  constructor(
    @InjectRepository(Consulta)
    private readonly consultasRepo: Repository<Consulta>,
    private readonly carsService: CarsService,
  ) {}

  async crear(usuarioId: string, dto: CrearConsultaDto): Promise<Consulta> {
    const auto = await this.carsService.obtenerPorId(dto.autoId);

    // ── Regla 1: No podés consultar tu propia publicación ──────
    if (auto.vendedorId === usuarioId) {
      throw new ForbiddenException('No podés enviar consultas a tu propia publicación.');
    }

    // ── Regla 2: Solo una consulta por usuario por publicación ──
    const yaConsulto = await this.consultasRepo.findOne({
      where: { autoId: dto.autoId, compradorId: usuarioId },
    });
    if (yaConsulto) {
      throw new BadRequestException('Ya enviaste una consulta a esta publicación. Esperá la respuesta del vendedor.');
    }

    const consulta = this.consultasRepo.create({
      autoId:      dto.autoId,
      compradorId: usuarioId,
      vendedorId:  auto.vendedorId,
      pregunta:    dto.pregunta,
    });
    return this.consultasRepo.save(consulta);
  }

  async listarPorAuto(autoId: string): Promise<Consulta[]> {
    return this.consultasRepo.find({
      where: { autoId },
      order: { createdAt: 'ASC' },
      relations: ['comprador'],
    });
  }

  async listarPorVendedor(vendedorId: string): Promise<Consulta[]> {
    return this.consultasRepo.find({
      where: { vendedorId },
      order: { createdAt: 'DESC' },
      relations: ['auto', 'comprador'],
    });
  }

  async responder(id: string, vendedorId: string, dto: ResponderConsultaDto): Promise<Consulta> {
    const consulta = await this.consultasRepo.findOneBy({ id });
    if (!consulta) throw new NotFoundException('Consulta no encontrada');
    if (consulta.vendedorId !== vendedorId) {
      throw new ForbiddenException('No podés responder esta consulta.');
    }
    if (consulta.compradorId === vendedorId) {
      throw new ForbiddenException('No podés responder tu propia consulta.');
    }
    consulta.respuesta = dto.respuesta;
    return this.consultasRepo.save(consulta);
  }
}
