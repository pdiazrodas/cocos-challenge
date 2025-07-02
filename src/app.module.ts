import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { OrdersModule } from './orders/orders.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { InstrumentsModule } from './instruments/instruments.module';

@Module({
  imports: [UsersModule, InstrumentsModule, PortfolioModule, OrdersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
