import { OrdersService } from './orders.service';
import { BuyOrderStrategy } from './strategies/buy-order-strategy';
import { SellOrderStrategy } from './strategies/sell-order-strategy';
import { BadRequestException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './entities/order.entity';

describe('OrdersService', () => {
  let service: OrdersService;
  const buyStrategyStub = {
    execute: jest.fn(),
  };

  const sellStrategyStub = {
    execute: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OrdersService(
      buyStrategyStub as unknown as BuyOrderStrategy,
      sellStrategyStub as unknown as SellOrderStrategy,
    );
  });

  describe('submitOrder()', () => {
    it('should delegate to BuyOrderStrategy for BUY side', async () => {
      const dto = { side: 'BUY' } as CreateOrderDto;
      const expectedOrder = { id: 1 } as Order;
      buyStrategyStub.execute.mockResolvedValueOnce(expectedOrder);

      const result = await service.submitOrder(dto);

      expect(buyStrategyStub.execute).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedOrder);
    });

    it('should delegate to SellOrderStrategy for SELL side', async () => {
      const dto = { side: 'SELL' } as CreateOrderDto;
      const expectedOrder = { id: 2 } as Order;
      sellStrategyStub.execute.mockResolvedValueOnce(expectedOrder);

      const result = await service.submitOrder(dto);

      expect(sellStrategyStub.execute).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedOrder);
    });

    it('should throw BadRequestException for unsupported side', async () => {
      const dto = { side: 'CASH_OUT' } as unknown as CreateOrderDto;

      await expect(service.submitOrder(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
