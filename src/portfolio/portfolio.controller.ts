import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { PortfolioDto } from './dto/portfolio.dto';

@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get()
  getPortfolio(
    @Query('userId', ParseIntPipe) userId: number,
  ): Promise<PortfolioDto> {
    return this.portfolioService.getPortfolioForUser(userId);
  }
}
