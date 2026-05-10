import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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

  async crear(compradorId: string, dto: CrearConsultaDto): Promise<Consulta> {
    const auto = await this.carsService.obtenerPorId(dto.autoId);
    const consulta = this.consultasRepo.create({
      autoId: dto.autoId,
      compradorId,
      vendedorId: auto.vendedorId,
      pregunta: dto.pregunta,
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
    if (consulta.vendedorId !== vendedorId) throw new ForbiddenException('No podés responder esta consulta');
    consulta.respuesta = dto.respuesta;
    return this.consultasRepo.save(consulta);
  }
}
