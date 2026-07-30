import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from './repositories/users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { User } from '../../../generated/prisma/client';

/**
 * Fator de custo fixo, não configurável — ADR-002/SPR-006, seção 7.6:
 * nenhum consumidor real precisa variar isso hoje (mesmo princípio de
 * configuration.ts na SPR-003, de não antecipar configuração sem uso real).
 */
const BCRYPT_SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  /**
   * Cria um usuário com senha já hasheada.
   *
   * Não há endpoint HTTP público que exponha este método nesta sprint —
   * ver observação em SPR-007 sobre a ausência de fluxo de registro
   * documentado na SPR-006. Método existe para uso em testes/seed e para
   * uma futura sprint que decida como o registro deve funcionar.
   */
  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.usersRepository.findByEmail(dto.email);

    if (existing) {
      throw new ConflictException('E-mail já cadastrado.');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    return this.usersRepository.create({
      email: dto.email,
      password: passwordHash,
      name: dto.name,
    });
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
      createdAt: user.createdAt.toISOString(),
    };
  }
}
