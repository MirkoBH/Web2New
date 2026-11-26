import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CarsService } from '../cars/cars.service';
import { Inquiry } from './inquiry.entity';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { AnswerInquiryDto } from './dto/answer-inquiry.dto';

/** Consulta tal como se ve en la publicación: del comprador solo el nombre. */
export interface PublicInquiry {
  id: string;
  carId: string;
  question: string;
  answer: string | null;
  buyer: { name: string };
  createdAt: Date;
}

/** Consulta recibida por el vendedor, con el auto al que se refiere. */
export interface ReceivedInquiry extends PublicInquiry {
  car: { id: string; brand: string; model: string; year: number };
}

@Injectable()
export class InquiriesService {
  constructor(
    @InjectRepository(Inquiry)
    private readonly inquiries: Repository<Inquiry>,
    private readonly carsService: CarsService,
  ) {}

  async create(buyerId: string, dto: CreateInquiryDto): Promise<PublicInquiry> {
    const car = await this.carsService.findBasic(dto.carId);
    if (car.sellerId === buyerId) {
      throw new ForbiddenException('No podés consultar tu propia publicación');
    }

    const alreadyAsked = await this.inquiries.existsBy({
      carId: car.id,
      buyerId,
    });
    if (alreadyAsked) {
      throw new ConflictException(
        'Ya enviaste una consulta a esta publicación. Esperá la respuesta del vendedor',
      );
    }

    const { id } = await this.inquiries.save(
      this.inquiries.create({
        carId: car.id,
        buyerId,
        sellerId: car.sellerId,
        question: dto.question,
      }),
    );
    return toPublic(await this.runSearch(id));
  }

  async listByCar(carId: string): Promise<PublicInquiry[]> {
    const inquiries = await this.inquiries.find({
      where: { carId },
      relations: { buyer: true },
      order: { createdAt: 'ASC' },
    });
    return inquiries.map(toPublic);
  }

  async listReceived(sellerId: string): Promise<ReceivedInquiry[]> {
    const inquiries = await this.inquiries.find({
      where: { sellerId },
      relations: { buyer: true, car: true },
      order: { createdAt: 'DESC' },
    });
    return inquiries.map(toReceived);
  }

  async answer(
    id: string,
    sellerId: string,
    dto: AnswerInquiryDto,
  ): Promise<PublicInquiry> {
    const inquiry = await this.runSearch(id);
    if (inquiry.sellerId !== sellerId) {
      throw new ForbiddenException(
        'Solo el vendedor puede responder esta consulta',
      );
    }
    inquiry.answer = dto.answer;
    await this.inquiries.update(id, { answer: dto.answer });
    return toPublic(inquiry);
  }

  private async runSearch(id: string): Promise<Inquiry> {
    const inquiry = await this.inquiries.findOne({
      where: { id },
      relations: { buyer: true },
    });
    if (!inquiry) {
      throw new NotFoundException('Consulta no encontrada');
    }
    return inquiry;
  }
}

function toPublic(inquiry: Inquiry): PublicInquiry {
  return {
    id: inquiry.id,
    carId: inquiry.carId,
    question: inquiry.question,
    answer: inquiry.answer,
    buyer: { name: inquiry.buyer.name },
    createdAt: inquiry.createdAt,
  };
}

function toReceived(inquiry: Inquiry): ReceivedInquiry {
  return {
    ...toPublic(inquiry),
    car: {
      id: inquiry.car.id,
      brand: inquiry.car.brand,
      model: inquiry.car.model,
      year: inquiry.car.year,
    },
  };
}
