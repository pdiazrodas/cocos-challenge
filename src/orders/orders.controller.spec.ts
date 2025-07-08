import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './entities/order.entity';

describe('OrdersController', () => {
  let controller: OrdersController;
  let serviceStub: jest.Mocked<OrdersService>;

  const mockOrder = {
    id: 99,
    userId: 1,
    instrumentId: 1,
    side: 'BUY',
    type: 'MARKET',
    size: 2,
    price: 1000,
    status: 'FILLED',
    datetime: new Date(),
  } as unknown as Order;

  beforeEach(() => {
    jest.clearAllMocks();

    serviceStub = {
      submitOrder: jest.fn().mockResolvedValue(mockOrder),
    } as unknown as jest.Mocked<OrdersService>;

    controller = new OrdersController(serviceStub);
  });

  describe('create()', () => {
    it('should submit order via service and return created order', async () => {
      const dto: CreateOrderDto = {
        side: 'BUY',
        type: 'MARKET',
        size: 2,
        instrumentId: 1,
        userId: 1,
      };

      const result = await controller.create(dto);

      expect(serviceStub.submitOrder).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockOrder);
    });
  });
});
