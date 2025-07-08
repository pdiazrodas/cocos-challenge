import { BuyOrderStrategy } from './buy-order-strategy';
import { BadRequestException } from '@nestjs/common';

describe('BuyOrderStrategy', () => {
  let strategy: BuyOrderStrategy;

  const instrumentRepoStub = {
    findOne: jest.fn(),
  };

  const orderRepoStub = {
    query: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const marketdataRepoStub = {
    query: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    strategy = new BuyOrderStrategy(
      instrumentRepoStub as any,
      orderRepoStub as any,
      marketdataRepoStub as any,
    );
  });

  describe('execute()', () => {
    it('should reject if both size and investmentAmount are provided', async () => {
      const dto = {
        side: 'BUY' as const,
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
        side: 'BUY' as const,
        type: 'MARKET' as const,
        instrumentId: 1,
        userId: 1,
      };

      await expect(strategy.execute(dto)).rejects.toThrow(BadRequestException);
    });

    it('should reject if instrument does not exist', async () => {
      instrumentRepoStub.findOne.mockResolvedValueOnce(null);

      const dto = {
        side: 'BUY' as const,
        type: 'MARKET' as const,
        size: 1,
        instrumentId: 1,
        userId: 1,
      };

      await expect(strategy.execute(dto)).rejects.toThrow(BadRequestException);
    });

    it('should reject if instrument is of type MONEDA', async () => {
      instrumentRepoStub.findOne.mockResolvedValueOnce({
        id: 1,
        type: 'MONEDA',
      });

      const dto = {
        side: 'BUY' as const,
        type: 'MARKET' as const,
        size: 1,
        instrumentId: 1,
        userId: 1,
      };

      await expect(strategy.execute(dto)).rejects.toThrow(BadRequestException);
    });

    it('should reject if no market price is found', async () => {
      instrumentRepoStub.findOne.mockResolvedValueOnce({
        id: 1,
        type: 'ACCIONES',
      });
      marketdataRepoStub.query.mockResolvedValueOnce([{ close: null }]);

      const dto = {
        side: 'BUY' as const,
        type: 'MARKET' as const,
        size: 1,
        instrumentId: 1,
        userId: 1,
      };

      await expect(strategy.execute(dto)).rejects.toThrow(BadRequestException);
    });

    it('should reject if size derived from investmentAmount is 0', async () => {
      // Mocking the instrument
      instrumentRepoStub.findOne.mockResolvedValueOnce({
        id: 1,
        type: 'ACCIONES',
      });
      // Mocking close price of instrument
      marketdataRepoStub.query.mockResolvedValueOnce([{ close: 1000 }]);
      // orderRepoStub.query.mockResolvedValueOnce([{ available_cash: '2000' }]);

      const dto = {
        side: 'BUY' as const,
        type: 'MARKET' as const,
        investmentAmount: 500,
        instrumentId: 1,
        userId: 1,
      };

      // Mocking the rejected order
      const orderToSave = {
        id: 1,
        instrumentId: 1,
        userId: 1,
        side: 'BUY',
        size: 0,
        price: 1000,
        type: 'MARKET',
        status: 'REJECTED',
        datetime: new Date(),
      };

      orderRepoStub.create.mockReturnValueOnce(orderToSave);
      orderRepoStub.save.mockResolvedValueOnce(orderToSave);

      const result = await strategy.execute(dto);
      expect(result).toEqual(orderToSave);
      expect(result.status).toBe('REJECTED');
    });

    it('should reject if available cash is insufficient', async () => {
      instrumentRepoStub.findOne.mockResolvedValueOnce({
        id: 1,
        type: 'ACCIONES',
      });
      marketdataRepoStub.query.mockResolvedValueOnce([{ close: 1000 }]);
      orderRepoStub.query.mockResolvedValueOnce([{ available_cash: '500' }]);

      const dto = {
        side: 'BUY' as const,
        type: 'MARKET' as const,
        size: 1,
        instrumentId: 1,
        userId: 1,
      };

      // Mocking the rejected order
      const orderToSave = {
        id: 1,
        instrumentId: 1,
        userId: 1,
        side: 'BUY',
        size: 0,
        price: 1000,
        type: 'MARKET',
        status: 'REJECTED',
        datetime: new Date(),
      };
      orderRepoStub.create.mockReturnValueOnce(orderToSave);
      orderRepoStub.save.mockResolvedValueOnce(orderToSave);

      const result = await strategy.execute(dto);
      expect(result.status).toBe('REJECTED');
    });

    it('should accept and fill order when all validations pass (MARKET)', async () => {
      instrumentRepoStub.findOne.mockResolvedValueOnce({
        id: 1,
        type: 'ACCIONES',
      });
      marketdataRepoStub.query.mockResolvedValueOnce([{ close: 1000 }]);
      orderRepoStub.query.mockResolvedValueOnce([{ available_cash: '5000' }]);

      const dto = {
        side: 'BUY' as const,
        type: 'MARKET' as const,
        size: 2,
        instrumentId: 1,
        userId: 1,
      };

      const createdOrder = {
        id: 99,
        status: 'FILLED',
        price: 1000,
        size: 2,
      };

      orderRepoStub.create.mockReturnValueOnce(createdOrder);
      orderRepoStub.save.mockResolvedValueOnce(createdOrder);

      const result = await strategy.execute(dto);
      expect(result.status).toBe('FILLED');
      expect(result.size).toBe(2);
      expect(result.price).toBe(1000);
    });

    it('should accept and fill order when all validations pass (LIMIT)', async () => {
      instrumentRepoStub.findOne.mockResolvedValueOnce({
        id: 1,
        type: 'ACCIONES',
      });
      marketdataRepoStub.query.mockResolvedValueOnce([{ close: 1000 }]);
      orderRepoStub.query.mockResolvedValueOnce([{ available_cash: '5000' }]);

      const dto = {
        side: 'BUY' as const,
        type: 'LIMIT' as const,
        size: 2,
        price: 950,
        instrumentId: 1,
        userId: 1,
      };

      const createdOrder = {
        id: 99,
        status: 'NEW',
        price: 950,
        size: 2,
      };

      orderRepoStub.create.mockReturnValueOnce(createdOrder);
      orderRepoStub.save.mockResolvedValueOnce(createdOrder);

      const result = await strategy.execute(dto);
      expect(result.status).toBe('NEW');
      expect(result.size).toBe(2);
      expect(result.price).toBe(950);
    });
  });
});
