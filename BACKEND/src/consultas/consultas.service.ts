import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AutosService } from '../autos/autos.service';
import { Consulta } from './consulta.entity';
import { CrearConsultaDto } from './dto/crear-consulta.dto';
import { ResponderConsultaDto } from './dto/responder-consulta.dto';

/** Consulta tal como se ve en la publicación: del comprador solo el nombre. */
export interface ConsultaPublica {
  id: string;
  autoId: string;
  pregunta: string;
  respuesta: string | null;
  comprador: { nombre: string };
  creadoEn: Date;
}

/** Consulta recibida por el vendedor, con el auto al que se refiere. */
export interface ConsultaRecibida extends ConsultaPublica {
  auto: { id: string; marca: string; modelo: string; anio: number };
}

@Injectable()
export class ConsultasService {
  constructor(
    @InjectRepository(Consulta)
    private readonly consultas: Repository<Consulta>,
    private readonly autosService: AutosService,
  ) {}

  async crear(
    compradorId: string,
    dto: CrearConsultaDto,
  ): Promise<ConsultaPublica> {
    const auto = await this.autosService.obtenerBasico(dto.autoId);
    if (auto.vendedorId === compradorId) {
      throw new ForbiddenException('No podés consultar tu propia publicación');
    }

    const yaConsulto = await this.consultas.existsBy({
      autoId: auto.id,
      compradorId,
    });
    if (yaConsulto) {
      throw new ConflictException(
        'Ya enviaste una consulta a esta publicación. Esperá la respuesta del vendedor',
      );
    }

    const { id } = await this.consultas.save(
      this.consultas.create({
        autoId: auto.id,
        compradorId,
        vendedorId: auto.vendedorId,
        pregunta: dto.pregunta,
      }),
    );
    return aPublica(await this.buscar(id));
  }

  async listarPorAuto(autoId: string): Promise<ConsultaPublica[]> {
    const consultas = await this.consultas.find({
      where: { autoId },
      relations: { comprador: true },
      order: { creadoEn: 'ASC' },
    });
    return consultas.map(aPublica);
  }

  async listarRecibidas(vendedorId: string): Promise<ConsultaRecibida[]> {
    const consultas = await this.consultas.find({
      where: { vendedorId },
      relations: { comprador: true, auto: true },
      order: { creadoEn: 'DESC' },
    });
    return consultas.map(aRecibida);
  }

  async responder(
    id: string,
    vendedorId: string,
    dto: ResponderConsultaDto,
  ): Promise<ConsultaPublica> {
    const consulta = await this.buscar(id);
    if (consulta.vendedorId !== vendedorId) {
      throw new ForbiddenException(
        'Solo el vendedor puede responder esta consulta',
      );
    }
    consulta.respuesta = dto.respuesta;
    await this.consultas.update(id, { respuesta: dto.respuesta });
    return aPublica(consulta);
  }

  private async buscar(id: string): Promise<Consulta> {
    const consulta = await this.consultas.findOne({
      where: { id },
      relations: { comprador: true },
    });
    if (!consulta) {
      throw new NotFoundException('Consulta no encontrada');
    }
    return consulta;
  }
}

function aPublica(consulta: Consulta): ConsultaPublica {
  return {
    id: consulta.id,
    autoId: consulta.autoId,
    pregunta: consulta.pregunta,
    respuesta: consulta.respuesta,
    comprador: { nombre: consulta.comprador.nombre },
    creadoEn: consulta.creadoEn,
  };
}

function aRecibida(consulta: Consulta): ConsultaRecibida {
  return {
    ...aPublica(consulta),
    auto: {
      id: consulta.auto.id,
      marca: consulta.auto.marca,
      modelo: consulta.auto.modelo,
      anio: consulta.auto.anio,
    },
  };
}
