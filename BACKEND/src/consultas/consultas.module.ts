import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consulta } from './consulta.entity';
import { ConsultasService } from './consultas.service';
import { ConsultasController } from './consultas.controller';
import { CarsModule } from '../cars/cars.module';

@Module({
  imports: [TypeOrmModule.forFeature([Consulta]), CarsModule],
  providers: [ConsultasService],
  controllers: [ConsultasController],
})
export class ConsultasModule {}
