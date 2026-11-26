import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiModule } from '../ai/ai.module';
import { StorageService } from './storage.service';
import { Car } from './car.entity';
import { CarsController } from './cars.controller';
import { CarsService } from './cars.service';
import { CarImage } from './car-image.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Car, CarImage]), AiModule],
  controllers: [CarsController],
  providers: [CarsService, StorageService],
  exports: [CarsService],
})
export class CarsModule {}
