export class PortfolioPositionDto {
  instrumentId: number;
  ticker: string;
  name: string;
  type: string;
  quantity: number;
  marketValue: number;
  dailyReturnPercent: number;
}

export class PortfolioDto {
  currency: string;
  availableCash: number;
  totalAccountValue: number;
  positions: PortfolioPositionDto[];
}
