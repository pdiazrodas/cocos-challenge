import { BadRequestException } from '@nestjs/common';
import { SellOrderStrategy } from './sell-order-strategy';

describe('SellOrderStrategy', () => {
  let strategy: SellOrderStrategy;

  const instrumentRepoStub = { findOne: jest.fn() };
  const orderRepoStub = {
    query: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const marketdataRepoStub = { query: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();

    strategy = new SellOrderStrategy(
      instrumentRepoStub as any,
      orderRepoStub as any,
      marketdataRepoStub as any,
    );
  });

  describe('execute()', () => {
    it('should reject if both size and investmentAmount are provided', async () => {
      const dto = {
        side: 'SELL' as const,
        type: 'MARKET' as const,
        size: 10,
        investmentAmount: 5000,
        instrumentId: 1,
        userId: 1,
      };

      await expect(strategy.execute(dto)).rejects.toThrow(BadRequestException);
    });

    it('should reject if neither size nor investmentAmount is provided', async () => {
      const dto = {
        side: 'SELL' as const,
        type: 'MARKET' as const,
        instrumentId: 1,
        userId: 1,
      };

      await expect(strategy.execute(dto)).rejects.toThrow(BadRequestException);
    });

    it('should reject if instrument does not exist', async () => {
      instrumentRepoStub.findOne.mockResolvedValueOnce(null);

      const dto = {
        side: 'SELL' as const,
        type: 'MARKET' as const,
        size: 1,
        instrumentId: 1,
        userId: 1,
      };

      await expect(strategy.execute(dto)).rejects.toThrow(BadRequestException);
    });

    it('should reject if instrument is MONEDA', async () => {
      instrumentRepoStub.findOne.mockResolvedValueOnce({
        id: 1,
        type: 'MONEDA',
      });

      const dto = {
        side: 'SELL' as const,
        type: 'MARKET' as const,
        size: 1,
        instrumentId: 1,
        userId: 1,
      };

      await expect(strategy.execute(dto)).rejects.toThrow(BadRequestException);
    });

    it('should reject if no market price is available', async () => {
      instrumentRepoStub.findOne.mockResolvedValueOnce({
        id: 1,
        type: 'ACCIONES',
      });
      marketdataRepoStub.query.mockResolvedValueOnce([{ close: null }]);

      const dto = {
        side: 'SELL' as const,
        type: 'MARKET' as const,
        size: 1,
        instrumentId: 1,
        userId: 1,
      };

      await expect(strategy.execute(dto)).rejects.toThrow(BadRequestException);
    });

    it('should reject if trying to sell more than available shares', async () => {
      instrumentRepoStub.findOne.mockResolvedValueOnce({
        id: 1,
        type: 'ACCIONES',
      });
      marketdataRepoStub.query.mockResolvedValueOnce([{ close: 1000 }]);
      orderRepoStub.query.mockResolvedValueOnce([{ available_shares: '1' }]);

      const dto = {
        side: 'SELL' as const,
        type: 'MARKET' as const,
        size: 5,
        instrumentId: 1,
        userId: 1,
      };

      const orderToSave = { id: 44, status: 'REJECTED' };
      orderRepoStub.create.mockReturnValueOnce(orderToSave);
      orderRepoStub.save.mockResolvedValueOnce(orderToSave);

      const result = await strategy.execute(dto);
      expect(result.status).toBe('REJECTED');
    });

    it('should reject if investmentAmount is provided but sizeToUse is 0', async () => {
      instrumentRepoStub.findOne.mockResolvedValueOnce({
        id: 1,
        type: 'ACCIONES',
      });
      marketdataRepoStub.query.mockResolvedValueOnce([{ close: 1000 }]);
      orderRepoStub.query.mockResolvedValueOnce([{ available_shares: '10' }]);

      const dto = {
        side: 'SELL' as const,
        type: 'MARKET' as const,
        investmentAmount: 11000, // This would lead to sizeToUse being 0
        instrumentId: 1,
        userId: 1,
      };

      const orderToSave = { id: 99, status: 'REJECTED' };
      orderRepoStub.create.mockReturnValueOnce(orderToSave);
      orderRepoStub.save.mockResolvedValueOnce(orderToSave);

      const result = await strategy.execute(dto);
      expect(result.status).toBe('REJECTED');
    });

    it('should accept and fill order when size <= shares (MARKET)', async () => {
      instrumentRepoStub.findOne.mockResolvedValueOnce({
        id: 1,
        type: 'ACCIONES',
      });
      marketdataRepoStub.query.mockResolvedValueOnce([{ close: 1000 }]);
      orderRepoStub.query.mockResolvedValueOnce([{ available_shares: '10' }]);

      const dto = {
        side: 'SELL' as const,
        type: 'MARKET' as const,
        size: 5,
        instrumentId: 1,
        userId: 1,
      };

      const orderToSave = { id: 99, status: 'FILLED', price: 1000, size: 5 };
      orderRepoStub.create.mockReturnValueOnce(orderToSave);
      orderRepoStub.save.mockResolvedValueOnce(orderToSave);

      const result = await strategy.execute(dto);
      expect(result.status).toBe('FILLED');
      expect(result.price).toBe(1000);
    });

    it('should accept and create NEW order for LIMIT type', async () => {
      instrumentRepoStub.findOne.mockResolvedValueOnce({
        id: 1,
        type: 'ACCIONES',
      });
      marketdataRepoStub.query.mockResolvedValueOnce([{ close: 1000 }]);
      orderRepoStub.query.mockResolvedValueOnce([{ available_shares: '10' }]);

      const dto = {
        side: 'SELL' as const,
        type: 'LIMIT' as const,
        size: 3,
        price: 1050,
        instrumentId: 1,
        userId: 1,
      };

      const orderToSave = { id: 100, status: 'NEW', price: 1050, size: 3 };
      orderRepoStub.create.mockReturnValueOnce(orderToSave);
      orderRepoStub.save.mockResolvedValueOnce(orderToSave);

      const result = await strategy.execute(dto);
      expect(result.status).toBe('NEW');
      expect(result.price).toBe(1050);
    });
  });
});
