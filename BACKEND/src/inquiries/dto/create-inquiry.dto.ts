import { Transform } from 'class-transformer';
import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { trimText } from '../../common/transforms';

export class CreateInquiryDto {
  @IsUUID()
  carId: string;

  @Transform(trimText)
  @IsString()
  @MinLength(8)
  @MaxLength(500)
  question: string;
}
