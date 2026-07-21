import { Logger } from '@nestjs/common';

import { AppConfigService } from '../config/app-config.service';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  function createService(): PrismaService {
    const appConfigService = {
      databaseUrl: 'postgresql://user:pass@localhost:5432/db',
    } as AppConfigService;

    return new PrismaService(appConfigService);
  }

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('conecta ao banco em onModuleInit', async () => {
    const service = createService();
    const connectSpy = jest
      .spyOn(service, '$connect')
      .mockResolvedValue(undefined);

    await service.onModuleInit();

    expect(connectSpy).toHaveBeenCalledTimes(1);
  });

  it('loga e propaga o erro quando a conexão falha em onModuleInit', async () => {
    const service = createService();
    const connectionError = new Error('connection refused');
    jest.spyOn(service, '$connect').mockRejectedValue(connectionError);
    const errorLogSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    await expect(service.onModuleInit()).rejects.toThrow(connectionError);
    expect(errorLogSpy).toHaveBeenCalled();
  });

  it('desconecta do banco em onModuleDestroy', async () => {
    const service = createService();
    const disconnectSpy = jest
      .spyOn(service, '$disconnect')
      .mockResolvedValue(undefined);

    await service.onModuleDestroy();

    expect(disconnectSpy).toHaveBeenCalledTimes(1);
  });

  it('loga (sem lançar) quando a desconexão falha em onModuleDestroy', async () => {
    const service = createService();
    jest
      .spyOn(service, '$disconnect')
      .mockRejectedValue(new Error('disconnect failed'));
    const errorLogSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    await expect(service.onModuleDestroy()).resolves.toBeUndefined();
    expect(errorLogSpy).toHaveBeenCalled();
  });
});
