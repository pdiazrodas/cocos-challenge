import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { BuyOrderStrategy } from './strategies/buy-order-strategy';
import { Order } from './entities/order.entity';
import { SellOrderStrategy } from './strategies/sell-order-strategy';

@Injectable()
export class OrdersService {
  constructor(
    private readonly buyOrderStrategy: BuyOrderStrategy,
    private readonly sellOrderStrategy: SellOrderStrategy,
  ) {}

  public async submitOrder(dto: CreateOrderDto): Promise<Order> {
    switch (dto.side) {
      case 'BUY':
        return await this.buyOrderStrategy.execute(dto);
      case 'SELL':
        return await this.sellOrderStrategy.execute(dto);
      // Future implementations could be included here. For example: CASH_IN, CASH_OUT, etc.
      default:
        throw new BadRequestException(
          `Order side ${dto.side} not supported yet.`,
        );
    }
  }
}
