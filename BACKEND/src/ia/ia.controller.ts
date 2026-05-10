import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { IaService } from './ia.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

class AnalizarTextoDto {
  descripcion: string;
  marca: string;
  modelo: string;
  anio: number;
  precio: number;
  kilometraje: number;
}

// Endpoint auxiliar para análisis desde el frontend directamente
@Controller('ia')
@UseGuards(JwtAuthGuard)
export class IaController {
  constructor(private readonly iaService: IaService) {}

  // POST /api/ia/analizar — análisis rápido sin auto guardado
  @Post('analizar')
  async analizarRapido(@Body() datos: AnalizarTextoDto) {
    // Construye un auto parcial para reutilizar el servicio
    const autoParcial: any = {
      ...datos,
      transmision: 'Manual',
      combustible: 'Nafta',
      ubicacion: 'Argentina',
      descripcion: datos.descripcion,
      detallesDanios: '',
    };
    return this.iaService.analizarAuto(autoParcial);
  }
}
