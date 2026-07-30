import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marca uma rota como pública, isentando-a do JwtAuthGuard global
 * (ADR-002 / SPR-006, seção 8.4 — guard global + exceções explícitas).
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
