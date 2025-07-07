import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { BuyOrderStrategy } from './strategies/buy-order-strategy';
import { Order } from './entities/order.entity';

@Injectable()
export class OrdersService {
  constructor(
    private readonly buyOrderStrategy: BuyOrderStrategy,
    // Próximo: private readonly sellOrderStrategy: SellOrderStrategy
  ) {}

  public async submitOrder(dto: CreateOrderDto): Promise<Order> {
    switch (dto.side) {
      case 'BUY':
        return await this.buyOrderStrategy.execute(dto);
      case 'SELL':
        throw new BadRequestException(
          'Order side SELL is not implemented yet.',
        );
      // Future implementations could be included here. For example: CASH_IN, CASH_OUT, etc.
      default:
        throw new BadRequestException(
          `Order side ${dto.side} not supported yet.`,
        );
    }
  }
}
