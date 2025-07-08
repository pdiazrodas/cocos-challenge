import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrdersModule } from './orders/orders.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { InstrumentsModule } from './instruments/instruments.module';
import { User } from './users/entities/user.entity';
import { Instrument } from './instruments/entities/instrument.entity';
import { Order } from './orders/entities/order.entity';
import { MarketData } from './common/entities/market-data.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.PGHOST,
      port: parseInt(process.env.PGPORT ?? '5432', 10),
      username: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      synchronize: false,
      autoLoadEntities: true,
      entities: [User, Instrument, Order, MarketData],
    }),
    InstrumentsModule,
    PortfolioModule,
    OrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
