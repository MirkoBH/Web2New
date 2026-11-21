import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { DataSource } from 'typeorm';

/** GET /api/salud — lo usa Render para saber si el servicio está vivo. */
@Controller('salud')
@SkipThrottle()
export class SaludController {
  constructor(private readonly baseDeDatos: DataSource) {}

  @Get()
  async verificar(): Promise<{ estado: 'ok'; baseDeDatos: boolean }> {
    let baseDeDatos = true;
    try {
      await this.baseDeDatos.query('SELECT 1');
    } catch {
      baseDeDatos = false;
    }
    return { estado: 'ok', baseDeDatos };
  }
}
