import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Instrument } from '../instruments/entities/instrument.entity';
import { Order } from './entities/order.entity';
import { MarketData } from '../common/entities/market-data.entity';
import { BuyOrderStrategy } from './strategies/buy-order-strategy';
import { SellOrderStrategy } from './strategies/sell-order-strategy';

@Module({
  imports: [TypeOrmModule.forFeature([Order, Instrument, MarketData])],
  controllers: [OrdersController],
  providers: [OrdersService, BuyOrderStrategy, SellOrderStrategy],
})
export class OrdersModule {}
