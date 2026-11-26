import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { trimText } from '../../common/transforms';

export class AnswerInquiryDto {
  @Transform(trimText)
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  answer: string;
}
