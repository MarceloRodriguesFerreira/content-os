import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from './repositories/users.repository';
import { CreateUserInput } from './interfaces/create-user-input.interface';
import { UserResponseDto } from './dto/user-response.dto';
import { Prisma, User } from '../../../generated/prisma/client';

/**
 * Fator de custo fixo, não configurável — ADR-002/SPR-006, seção 7.6:
 * nenhum consumidor real precisa variar isso hoje (mesmo princípio de
 * configuration.ts na SPR-003, de não antecipar configuração sem uso real).
 */
const BCRYPT_SALT_ROUNDS = 10;

/** Código do Prisma para violação de constraint única (`P2002`). */
const PRISMA_UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  /**
   * Cria um usuário com senha já hasheada.
   *
   * Contrato interno (`CreateUserInput`), não um DTO HTTP — quem chama
   * (seed, testes, ou `AuthService.register()` na SPR-011) mapeia seu
   * próprio DTO para este shape antes de chamar `create()`. Ver Design
   * Freeze da SPR-011, seção "Contrato interno entre AuthService e
   * UsersService".
   *
   * E-mail normalizado (`trim` + `lowercase`) aqui, não no DTO — é regra de
   * negócio (mesmo texto de entrada deve sempre mapear ao mesmo registro),
   * não validação de forma.
   *
   * Unicidade de e-mail tem dois caminhos, não intercambiáveis (Design
   * Freeze da SPR-011, seção "Correção — duplicidade prévia vs. condição de
   * corrida"):
   * 1. `findByEmail` prévio — só otimização de UX (erro mais cedo, sem
   *    round-trip de escrita no caso comum). NÃO é a garantia.
   * 2. Captura de `P2002` na escrita — a garantia real, ancorada na
   *    constraint `@unique` do Postgres (`schema.prisma`), correta mesmo
   *    sob duas requisições concorrentes que passam pelo caminho 1
   *    simultaneamente. Nenhuma lógica aqui depende de qual requisição
   *    "chegou primeiro" — o Postgres decide isso atomicamente na escrita.
   */
  async create(input: CreateUserInput): Promise<User> {
    const email = input.email.trim().toLowerCase();

    const existing = await this.usersRepository.findByEmail(email);

    if (existing) {
      throw new ConflictException('E-mail já cadastrado.');
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);

    try {
      return await this.usersRepository.create({
        email,
        password: passwordHash,
        name: input.name,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PRISMA_UNIQUE_CONSTRAINT_VIOLATION
      ) {
        throw new ConflictException('E-mail já cadastrado.');
      }

      throw error;
    }
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async findByIdOrFail(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return user;
  }

  toResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      active: user.active,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
