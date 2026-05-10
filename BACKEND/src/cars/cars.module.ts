import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Auto } from './auto.entity';
import { CarsService } from './cars.service';
import { CarsController } from './cars.controller';
import { IaModule } from '../ia/ia.module';

@Module({
  imports: [TypeOrmModule.forFeature([Auto]), IaModule],
  providers: [CarsService],
  controllers: [CarsController],
  exports: [CarsService],
})
export class CarsModule {}
