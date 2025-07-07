import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { OrderStrategy } from '../interfaces/order-strategy.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Instrument } from '../../instruments/entities/instrument.entity';
import { Order } from '../entities/order.entity';
import { MarketData } from '../../common/entities/market-data.entity';
import { CreateOrderDto } from '../dto/create-order.dto';

enum OrderStatus {
  NEW = 'NEW',
  FILLED = 'FILLED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

const logger = new Logger('SellOrderStrategy');

// TBD: An improvement could be to separate common methods into a base class or utility functions
// to avoid code duplication between BuyOrderStrategy and SellOrderStrategy.
// This would allow for better maintainability and reusability of code.

@Injectable()
export class SellOrderStrategy implements OrderStrategy {
  constructor(
    @InjectRepository(Instrument)
    private readonly instrumentRepo: Repository<Instrument>,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(MarketData)
    private readonly marketdataRepo: Repository<MarketData>,
  ) {}

  async execute(dto: CreateOrderDto): Promise<Order> {
    this.validateSellMode(dto);

    // Check that instrument exists and is not of type MONEDA
    const instrument = await this.validateInstrument(dto.instrumentId);

    // If the order is MARKET, get the latest price. If not, use the provided price.
    let priceToUse: number;
    if (dto.type === 'MARKET') {
      priceToUse = await this.getLatestPrice(dto.instrumentId);
    } else {
      priceToUse = dto.price!; // Price already validated by DTO for LIMIT orders
    }

    logger.log(
      `Instrument validated: ${instrument.ticker}, Price to use: ${priceToUse}`,
    );

    // Calculate the available shares for selling
    const availableShares = await this.getAvailableShares(
      dto.userId,
      dto.instrumentId,
    );

    let sizeToUse: number;
    if (!dto.size && dto.investmentAmount) {
      sizeToUse = Math.floor(dto.investmentAmount / priceToUse);
    } else {
      sizeToUse = dto.size!; // Size already validated by DTO
    }

    // If the size to use exceeds available shares, reject the order
    if (sizeToUse > availableShares) {
      logger.log(
        `Order rejected: Selling ${sizeToUse} exceeds available shares (${availableShares})`,
      );
      return await this.buildRejectedOrder(dto, priceToUse, sizeToUse);
    }

    // Set the order status based on the type
    const statusToSet =
      dto.type === 'MARKET' ? OrderStatus.FILLED : OrderStatus.NEW;

    logger.log(
      `Order accepted: Selling ${sizeToUse} at ${priceToUse}, Status: ${statusToSet}`,
    );

    return await this.buildAcceptedOrder(
      dto,
      priceToUse,
      statusToSet,
      sizeToUse,
    );
  }

  private async validateInstrument(instrumentId: number): Promise<Instrument> {
    const instrument = await this.instrumentRepo.findOne({
      where: { id: instrumentId },
    });

    if (!instrument) {
      throw new BadRequestException('The instrument does not exist.');
    }

    if (instrument.type === 'MONEDA') {
      throw new BadRequestException(
        'Instruments of type MONEDA cannot be traded directly.',
      );
    }

    return instrument;
  }

  private async getLatestPrice(instrumentId: number): Promise<number> {
    const rawQuery = `
      SELECT close
      FROM marketdata
      WHERE instrumentid = $1
        AND date = (
          SELECT MAX(date)
          FROM marketdata
          WHERE instrumentid = $1
        );
    `;
    const result = await this.marketdataRepo.query(rawQuery, [instrumentId]);
    const close = result[0]?.close;

    console.log(`Latest price for instrument ${instrumentId}:`, close);

    if (!close) {
      throw new BadRequestException(
        'No market price found for the instrument.',
      );
    }

    return Number(close);
  }

  private async getAvailableShares(
    userId: number,
    instrumentId: number,
  ): Promise<number> {
    const rawQuery = `
    SELECT SUM(
      CASE 
        WHEN side = 'BUY' THEN size
        WHEN side = 'SELL' THEN -1 * size
        ELSE 0
      END
    ) AS available_shares
    FROM orders
    WHERE userid = $1 AND instrumentid = $2 AND status = 'FILLED';
  `;

    const result = await this.orderRepo.query(rawQuery, [userId, instrumentId]);
    return Number(result[0]?.available_shares ?? 0);
  }

  private async buildRejectedOrder(
    dto: CreateOrderDto,
    price: number,
    size: number,
  ): Promise<Order> {
    const order = this.orderRepo.create({
      userId: dto.userId,
      instrumentId: dto.instrumentId,
      side: dto.side,
      type: dto.type,
      size,
      price,
      status: OrderStatus.REJECTED,
      datetime: new Date(),
    });

    return await this.orderRepo.save(order);
  }

  private async buildAcceptedOrder(
    dto: CreateOrderDto,
    price: number,
    status: string,
    size: number,
  ): Promise<Order> {
    const order = this.orderRepo.create({
      userId: dto.userId,
      instrumentId: dto.instrumentId,
      side: dto.side,
      type: dto.type,
      size,
      price,
      status,
      datetime: new Date(),
    });

    return await this.orderRepo.save(order);
  }

  private validateSellMode(dto: CreateOrderDto): void {
    const hasSize = dto.size !== undefined;
    const hasAmount = dto.investmentAmount !== undefined;

    if (hasSize && hasAmount) {
      throw new BadRequestException(
        'You must provide either size or investment amount, not both.',
      );
    }

    if (!hasSize && !hasAmount) {
      throw new BadRequestException(
        'You must specify either size or investment amount for the order.',
      );
    }
  }
}
