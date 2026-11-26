import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import type {
  ChatCompletionContentPart,
  ChatCompletionContentPartImage,
} from 'groq-sdk/resources/chat/completions';
import type { EnvironmentVariables } from '../config/validate-environment';
import type {
  AppraisalInput,
  AppraisalImage,
  AppraisalResult,
} from './ai.types';
import { buildUserMessage, SYSTEM_PROMPT } from './appraisal-prompt';
import { buildMosaic, MAX_MOSAIC_PHOTOS } from './mosaic';
import { validateAppraisal } from './validate-appraisal';

const TIMEOUT_MS = 45_000;
export const AI_UNAVAILABLE_MESSAGE =
  'El análisis de IA no está disponible, intentá en unos minutos';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly groq: Groq;
  private readonly model: string;

  constructor(config: ConfigService<EnvironmentVariables, true>) {
    this.groq = new Groq({
      apiKey: config.get('GROQ_API_KEY', { infer: true }),
      timeout: TIMEOUT_MS,
      maxRetries: 1,
    });
    this.model = config.get('GROQ_MODEL', { infer: true });
  }

  /**
   * Tasa el vehículo a partir de sus datos y fotos.
   * Si la IA falla o responde algo inválido, lanza 503: la publicación no se
   * guarda sin un análisis real.
   */
  async appraise(
    data: AppraisalInput,
    images: AppraisalImage[],
  ): Promise<AppraisalResult> {
    const count = Math.min(images.length, MAX_MOSAIC_PHOTOS);
    const content: ChatCompletionContentPart[] = [
      toImagePart(await buildMosaic(images.map((i) => i.data))),
      { type: 'text', text: buildUserMessage(data, count) },
    ];

    let response: string;
    try {
      const completion = await this.groq.chat.completions.create({
        model: this.model,
        temperature: 0.1,
        max_completion_tokens: 700,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: content },
        ],
      });
      response = completion.choices[0]?.message?.content ?? '';
    } catch (error) {
      this.logger.error(`Groq no respondió: ${describeError(error)}`);
      throw new ServiceUnavailableException(AI_UNAVAILABLE_MESSAGE);
    }

    const result = validateAppraisal(parseJson(response));
    if (!result) {
      this.logger.error(`Respuesta de IA inválida: ${response.slice(0, 300)}`);
      throw new ServiceUnavailableException(AI_UNAVAILABLE_MESSAGE);
    }
    return result;
  }
}

function toImagePart(jpeg: Buffer): ChatCompletionContentPartImage {
  const url = `data:image/jpeg;base64,${jpeg.toString('base64')}`;
  return { type: 'image_url', image_url: { url } };
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
