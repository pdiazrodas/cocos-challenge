import { IsIn, IsNumber, IsPositive, ValidateIf } from 'class-validator';

export class CreateOrderDto {
  @IsNumber()
  userId: number;

  @IsNumber()
  instrumentId: number;

  @IsIn(['BUY', 'SELL'])
  side: 'BUY' | 'SELL';

  @IsIn(['MARKET', 'LIMIT'])
  type: 'MARKET' | 'LIMIT';

  @IsNumber()
  @IsPositive()
  size: number;

  @ValidateIf((o) => o.type === 'LIMIT')
  @IsNumber()
  @IsPositive()
  price?: number;
}
