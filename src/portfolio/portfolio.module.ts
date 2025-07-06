import { Module } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { PortfolioController } from './portfolio.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../orders/entities/order.entity';
import { MarketData } from '../common/entities/market-data.entity';
import { Instrument } from '../instruments/entities/instrument.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, MarketData, Instrument])],
  controllers: [PortfolioController],
  providers: [PortfolioService],
})
export class PortfolioModule {}
