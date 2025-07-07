import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateOrderDto } from '../dto/create-order.dto';
import { Order } from '../entities/order.entity';
import { OrderStrategy } from '../interfaces/order-strategy.interface';
import { Repository } from 'typeorm';
import { Instrument } from '../../instruments/entities/instrument.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { MarketData } from '../../common/entities/market-data.entity';

enum OrderStatus {
  NEW = 'NEW',
  FILLED = 'FILLED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

@Injectable()
export class BuyOrderStrategy implements OrderStrategy {
  constructor(
    @InjectRepository(Instrument)
    private readonly instrumentRepo: Repository<Instrument>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(MarketData)
    private readonly marketdataRepo: Repository<MarketData>,
  ) {}

  async execute(dto: CreateOrderDto): Promise<Order> {
    // 1. Validar que el instrumento existe
    // 2. Obtener último precio si es MARKET
    // 3. Calcular el monto necesario (price × size)
    // 4. Verificar que el usuario tenga el cash disponible
    // 5. Si todo OK:
    //    - Si MARKET → estado = FILLED
    //    - Si LIMIT → estado = NEW
    // 6. Si no cumple, devolver estado REJECTED
    // 7. Crear y retornar entidad Order

    // Check that instrument exists and is not of type MONEDA
    const instrument = await this.validateInstrument(dto.instrumentId);
    let priceToUse: number;

    console.log('Instrument validated:', instrument);

    // If the order is MARKET, get the latest price. If not, use the provided price.
    if (dto.type === 'MARKET') {
      priceToUse = await this.getLatestPrice(dto.instrumentId);
    } else {
      priceToUse = dto.price!; // Price already validated by DTO for LIMIT orders
    }

    // Calculate the total cost of the order and check the user has enough cash
    const totalCost = dto.size * priceToUse;
    const availableCash = await this.getAvailableCash(dto.userId);

    console.log(
      `Total cost: ${totalCost}, Available cash: ${availableCash}, Price to use: ${priceToUse}`,
    );

    if (totalCost > availableCash) {
      return this.buildRejectedOrder(
        dto,
        priceToUse,
        'Insufficient funds to execute the order.',
      );
    }

    // Set the order status based on the type
    const statusToSet =
      dto.type === 'MARKET' ? OrderStatus.FILLED : OrderStatus.NEW;

    return await this.buildAcceptedOrder(dto, priceToUse, statusToSet);
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

  private async getAvailableCash(userId: number): Promise<number> {
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

    const result = await this.orderRepo.query(rawQuery, [userId]);
    return Number(result[0]?.available_cash ?? 0);
  }

  private async buildRejectedOrder(
    dto: CreateOrderDto,
    price: number,
    reason?: string, // optional, for future posible extension
  ): Promise<Order> {
    const order = this.orderRepo.create({
      userId: dto.userId,
      instrumentId: dto.instrumentId,
      side: dto.side,
      type: dto.type,
      size: dto.size,
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
  ): Promise<Order> {
    const order = this.orderRepo.create({
      userId: dto.userId,
      instrumentId: dto.instrumentId,
      side: dto.side,
      type: dto.type,
      size: dto.size,
      price,
      status,
      datetime: new Date(),
    });

    return await this.orderRepo.save(order);
  }
}
