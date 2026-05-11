import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { IaService } from './ia.service';
import type { DatosAnalisisAuto } from './ia.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('ia')
@UseGuards(JwtAuthGuard)
export class IaController {
  constructor(private readonly iaService: IaService) {}

  @Post('analizar')
  analizarRapido(@Body() datos: Record<string, any>) {
    return this.iaService.analizarConImagenes(datos as DatosAnalisisAuto, []);
  }
}
