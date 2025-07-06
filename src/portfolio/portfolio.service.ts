import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
// import { MarketData } from '../common/entities/market-data.entity';
// import { Instrument } from '../instruments/entities/instrument.entity';
import { PortfolioDto } from './dto/portfolio.dto';

@Injectable()
export class PortfolioService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepo: Repository<Order>,

    // @InjectRepository(MarketData)
    // private readonly marketDataRepo: Repository<MarketData>,

    // @InjectRepository(Instrument)
    // private readonly instrumentsRepo: Repository<Instrument>,
  ) {}

  public async getPortfolioForUser(userId: number): Promise<PortfolioDto> {
    const availableCash = await this.getCashAvailable(userId);

    return {
      currency: 'ARS',
      availableCash,
      totalAccountValue: 0,
      positions: [],
    };
  }

  private async getCashAvailable(userId: number): Promise<number> {
    const result = await this.ordersRepo
      .createQueryBuilder('orders')
      .select(
        `SUM(
          CASE 
            WHEN side = 'CASH_IN' THEN size * price
            WHEN side = 'SELL' THEN size * price
            WHEN side = 'CASH_OUT' THEN -1 * size * price
            WHEN side = 'BUY' THEN -1 * size * price
            ELSE 0
          END
        )`,
        'available_cash',
      )
      .where('orders.userId = :userId', { userId })
      .andWhere('orders.status = :status', { status: 'FILLED' })
      .getRawOne();

    return parseFloat(result.available_cash) || 0;
  }
}
