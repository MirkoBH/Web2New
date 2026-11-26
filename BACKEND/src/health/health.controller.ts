import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { DataSource } from 'typeorm';

/** GET /api/health — lo usa Render para saber si el servicio está vivo. */
@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(private readonly database: DataSource) {}

  @Get()
  async check(): Promise<{ status: 'ok'; database: boolean }> {
    let database = true;
    try {
      await this.database.query('SELECT 1');
    } catch {
      database = false;
    }
    return { status: 'ok', database };
  }
}
