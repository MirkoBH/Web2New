import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IaModule } from '../ia/ia.module';
import { AlmacenamientoService } from './almacenamiento.service';
import { Auto } from './auto.entity';
import { AutosController } from './autos.controller';
import { AutosService } from './autos.service';
import { ImagenAuto } from './imagen-auto.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Auto, ImagenAuto]), IaModule],
  controllers: [AutosController],
  providers: [AutosService, AlmacenamientoService],
  exports: [AutosService],
})
export class AutosModule {}
