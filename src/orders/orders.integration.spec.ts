import { Test } from '@nestjs/testing';
import { OrdersModule } from './orders.module';
import { OrdersController } from './orders.controller';
import { BuyOrderStrategy } from './strategies/buy-order-strategy';
import { SellOrderStrategy } from './strategies/sell-order-strategy';
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Instrument } from '../instruments/entities/instrument.entity';
import { MarketData } from '../common/entities/market-data.entity';

describe('OrdersModule Integration', () => {
  let controller: OrdersController;

  const buyStrategyStub = {
    execute: jest.fn(),
  };

  const sellStrategyStub = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      imports: [OrdersModule],
    })
      .overrideProvider(getRepositoryToken(Order))
      .useValue({})
      .overrideProvider(getRepositoryToken(Instrument))
      .useValue({})
      .overrideProvider(getRepositoryToken(MarketData))
      .useValue({})
      .overrideProvider(BuyOrderStrategy)
      .useValue(buyStrategyStub)
      .overrideProvider(SellOrderStrategy)
      .useValue(sellStrategyStub)
      .compile();

    controller = moduleRef.get(OrdersController);
  });

  it('should submit BUY order through buy strategy', async () => {
    const dto: CreateOrderDto = {
      side: 'BUY',
      type: 'MARKET',
      size: 2,
      instrumentId: 1,
      userId: 1,
    };

    const mockOrder = {
      id: 1,
      side: 'BUY',
      type: 'MARKET',
      size: 2,
      price: 1000,
      status: 'FILLED',
      userId: 1,
      instrumentId: 1,
      datetime: new Date(),
    } as unknown as Order;

    buyStrategyStub.execute.mockResolvedValueOnce(mockOrder);

    const result = await controller.create(dto);

    expect(result).toEqual(mockOrder);
    expect(buyStrategyStub.execute).toHaveBeenCalledWith(dto);
    expect(sellStrategyStub.execute).not.toHaveBeenCalled();
  });

  it('should submit SELL order through sell strategy', async () => {
    const dto: CreateOrderDto = {
      side: 'SELL',
      type: 'LIMIT',
      size: 3,
      price: 1050,
      instrumentId: 2,
      userId: 1,
    };

    const mockOrder = {
      id: 2,
      side: 'SELL',
      type: 'LIMIT',
      size: 3,
      price: 1050,
      status: 'NEW',
      userId: 1,
      instrumentId: 2,
      datetime: new Date(),
    } as unknown as Order;

    sellStrategyStub.execute.mockResolvedValueOnce(mockOrder);

    const result = await controller.create(dto);

    expect(result).toEqual(mockOrder);
    expect(sellStrategyStub.execute).toHaveBeenCalledWith(dto);
    expect(buyStrategyStub.execute).not.toHaveBeenCalled();
  });
});
