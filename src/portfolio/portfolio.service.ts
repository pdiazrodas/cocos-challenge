import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { PortfolioDto, PortfolioPositionDto } from './dto/portfolio.dto';

@Injectable()
export class PortfolioService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepo: Repository<Order>,
  ) {}

  public async getPortfolioForUser(userId: number): Promise<PortfolioDto> {
    const availableCash = await this.getCashAvailable(userId);
    const positionsWithTotalValue =
      await this.getPositionsWithTotalValueRaw(userId);

    return {
      currency: 'ARS',
      availableCash,
      totalAccountValue:
        positionsWithTotalValue.totalMarketValue + availableCash,
      positions: positionsWithTotalValue.positions,
    };
  }

  private async getCashAvailable(userId: number): Promise<number> {
    const rawQuery = `
    SELECT SUM(
      CASE 
        WHEN side = 'CASH_IN' THEN size * price
        WHEN side = 'SELL' THEN size * price
        WHEN side = 'CASH_OUT' THEN -1 * size * price
        WHEN side = 'BUY' THEN -1 * size * price
        ELSE 0
      END
    ) AS available_cash
    FROM orders
    WHERE userid = $1 AND status = 'FILLED';
  `;

    const result = await this.ordersRepo.query(rawQuery, [userId]);

    return parseFloat(result[0]?.available_cash) || 0;
  }

  private async getPositionsWithTotalValueRaw(userId: number): Promise<{
    positions: PortfolioPositionDto[];
    totalMarketValue: number;
  }> {
    const rawQuery = `
    WITH positions AS (
      SELECT 
        i.id AS instrumentId,
        i.ticker,
        i.name,
        i.type,
        SUM(
          CASE
            WHEN o.side = 'BUY' THEN o.size
            WHEN o.side = 'SELL' THEN -1 * o.size
            ELSE 0
          END
        ) AS quantity,
        md.close AS closePrice,
        md.previousclose AS previousClose
      FROM orders o
      JOIN instruments i ON o.instrumentId = i.id
      JOIN (
        SELECT instrumentid, close, previousclose
        FROM marketdata
        WHERE date = (SELECT MAX(date) FROM marketdata)
      ) md ON md.instrumentid = i.id
      WHERE o.status = 'FILLED'
        AND o.userId = $1
        AND i.type <> 'MONEDA'
      GROUP BY i.id, i.ticker, i.name, i.type, md.close, md.previousclose
      HAVING SUM(
        CASE 
          WHEN o.side = 'BUY' THEN o.size
          WHEN o.side = 'SELL' THEN -1 * o.size
          ELSE 0
        END
      ) > 0
    )
    SELECT 
      *, 
      quantity * closePrice AS marketValue,
      ROUND(((closePrice - previousClose) / previousClose) * 100, 2) AS dailyReturn,
      SUM(quantity * closePrice) OVER () AS totalMarketValue
    FROM positions;
  `;

    const results = await this.ordersRepo.query(rawQuery, [userId]);

    const positions = results.map((r) => ({
      instrumentId: r.instrumentid,
      ticker: r.ticker,
      name: r.name,
      type: r.type,
      quantity: Number(r.quantity),
      marketValue: Number(r.marketvalue),
      dailyReturn: Number(r.dailyreturn),
    }));

    // totalMarketValue of all positions
    const totalMarketValue = Number(results[0]?.totalmarketvalue ?? 0);

    return { positions, totalMarketValue };
  }
}
