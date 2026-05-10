import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Auto } from './auto.entity';
import { ImagenAuto } from './imagen-auto.entity';
import { CarsService } from './cars.service';
import { CarsController } from './cars.controller';
import { StorageService } from './storage.service';
import { IaModule } from '../ia/ia.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Auto, ImagenAuto]),
    IaModule,
  ],
  providers: [CarsService, StorageService],
  controllers: [CarsController],
  exports: [CarsService],
})
export class CarsModule {}
