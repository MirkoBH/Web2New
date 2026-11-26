import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../common/types/authenticated-user';
import {
  PublicInquiry,
  ReceivedInquiry,
  InquiriesService,
} from './inquiries.service';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { AnswerInquiryDto } from './dto/answer-inquiry.dto';

@Controller('inquiries')
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  /** POST /api/inquiries — un comprador pregunta sobre un auto. */
  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateInquiryDto,
  ): Promise<PublicInquiry> {
    return this.inquiriesService.create(user.id, dto);
  }

  /** GET /api/inquiries/car/:carId — público: preguntas y respuestas del auto. */
  @Get('car/:carId')
  listByCar(
    @Param('carId', ParseUUIDPipe) carId: string,
  ): Promise<PublicInquiry[]> {
    return this.inquiriesService.listByCar(carId);
  }

  /** GET /api/inquiries/received — consultas sobre mis publicaciones. */
  @Get('received')
  @UseGuards(JwtAuthGuard)
  listReceived(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ReceivedInquiry[]> {
    return this.inquiriesService.listReceived(user.id);
  }

  /** PATCH /api/inquiries/:id/answer — el vendedor responde. */
  @Patch(':id/answer')
  @UseGuards(JwtAuthGuard)
  answer(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AnswerInquiryDto,
  ): Promise<PublicInquiry> {
    return this.inquiriesService.answer(id, user.id, dto);
  }
}
