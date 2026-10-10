import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { PublicationStatus } from '../../../../generated/prisma/client';

/**
 * Validador de propriedade única, no escopo deste arquivo (não é uma
 * abstração compartilhada — mesmo critério de YAGNI já usado no projeto
 * para não generalizar antes de um segundo consumidor real). Verifica,
 * no mesmo campo, a consistência entre `status` e `scheduledAt`:
 *
 * - `status=SCHEDULED` → se `scheduledAt` foi enviado, deve ser uma data
 *   válida (só forma). Obrigatoriedade continua regra do Service (Bloco
 *   B) — não duplicada aqui, para não mover regra de lifecycle para a
 *   camada de DTO.
 * - `status=DRAFT` → `scheduledAt` não pode ter sido enviado — isso não é
 *   regra de lifecycle (não depende do estado atual da Publication), é
 *   só forma do payload.
 *
 * Duas `@ValidateIf` empilhadas na mesma propriedade, com condições
 * mutuamente exclusivas, NÃO funcionam para isso: o `class-validator`
 * trata cada `@ValidateIf` como mais uma condição que precisa ser
 * verdadeira para os validadores daquela propriedade rodarem — com duas
 * condições que nunca são verdadeiras ao mesmo tempo, nenhuma delas roda
 * nunca, e o campo passa a aceitar qualquer coisa silenciosamente (era
 * exatamente o bug corrigido aqui: `status=DRAFT` com `scheduledAt`
 * preenchido retornava 200 em vez de 400). Por isso o validador é único e
 * decide internamente, por `status`, qual regra aplicar.
 */
function IsScheduledAtConsistentWithStatus(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isScheduledAtConsistentWithStatus',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          const dto = args.object as UpdatePublicationDto;

          if (dto.status === PublicationStatus.SCHEDULED) {
            // Obrigatoriedade é regra do Service (Bloco B), não duplicada
            // aqui — se ausente, passa por esta validação de forma e é
            // rejeitado depois pelo PublicationsService.schedule.
            if (value === undefined) {
              return true;
            }
            return value instanceof Date && !isNaN(value.getTime());
          }

          // status === DRAFT (ou qualquer outro valor — @IsEnum, nesta
          // mesma classe, já rejeita valores fora do enum separadamente)
          return value === undefined;
        },
        defaultMessage(args: ValidationArguments): string {
          const dto = args.object as UpdatePublicationDto;
          return dto.status === PublicationStatus.SCHEDULED
            ? 'scheduledAt deve ser uma data válida quando status=SCHEDULED.'
            : 'scheduledAt não deve ser enviado quando status=DRAFT — o desagendamento sempre limpa scheduledAt.';
        },
      },
    });
  };
}

/**
 * Único ponto de entrada HTTP para as duas transições de lifecycle
 * aprovadas no Bloco B (`DRAFT ⇄ SCHEDULED`) — mesmo critério já definido
 * no Design Freeze ("o desagendamento é a transição SCHEDULED → DRAFT,
 * realizada via PATCH").
 *
 * `status` é o estado **alvo**: `SCHEDULED` faz o Controller chamar
 * `PublicationsService.schedule(id, scheduledAt)`; `DRAFT` chama
 * `PublicationsService.unschedule(id)`.
 *
 * Por que `scheduledAt` continua no mesmo DTO, em vez de dois
 * DTOs/endpoints separados: o Design Freeze já fixou um único `PATCH` para
 * as duas transições, e `status` já é o discriminador explícito de qual
 * delas o cliente quer — dividir em dois endpoints mudaria o contrato HTTP
 * aprovado sem necessidade. O que não pode acontecer é a combinação
 * inválida ser **silenciosamente aceita**: `scheduledAt` enviado junto com
 * `status=DRAFT` é rejeitado com `400` por
 * `IsScheduledAtConsistentWithStatus` acima, nunca ignorado.
 *
 * Futuridade de `scheduledAt` e rejeição de transição para o mesmo estado
 * continuam regra de negócio do Service (Bloco B), não duplicada aqui —
 * este validador só garante a forma do payload (presença/ausência e tipo
 * de `scheduledAt` conforme `status`), mesma natureza de
 * `forbidNonWhitelisted`.
 *
 * Sem campo `channel`: o Service não tem operação para alterá-lo
 * isoladamente nesta sprint.
 */
export class UpdatePublicationDto {
  @ApiProperty({
    enum: [PublicationStatus.DRAFT, PublicationStatus.SCHEDULED],
    example: PublicationStatus.SCHEDULED,
    description: 'Estado alvo da transição.',
  })
  @IsEnum(PublicationStatus)
  status: PublicationStatus;

  @ApiPropertyOptional({
    example: '2026-11-01T12:00:00.000Z',
    description:
      'Obrigatório quando status=SCHEDULED (futuridade validada pelo ' +
      'Service). Proibido quando status=DRAFT — enviá-lo nesse caso é ' +
      'rejeitado com 400, não ignorado.',
  })
  @Type(() => Date)
  @IsScheduledAtConsistentWithStatus()
  scheduledAt?: Date;
}
