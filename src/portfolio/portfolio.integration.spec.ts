import { Test } from '@nestjs/testing';
import { PortfolioModule } from './portfolio.module';
import { PortfolioController } from './portfolio.controller';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Order } from '../orders/entities/order.entity';

describe('PortfolioModule Integration', () => {
  let controller: PortfolioController;

  const repoStub = {
    query: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      imports: [PortfolioModule],
    })
      .overrideProvider(getRepositoryToken(Order))
      .useValue(repoStub)
      .compile();

    controller = moduleRef.get(PortfolioController);
  });

  it('should return correct portfolio with mocked cash and positions', async () => {
    // We mock call to getCashAvailable()
    repoStub.query
      .mockResolvedValueOnce([{ available_cash: '200000' }]) // cash
      .mockResolvedValueOnce([
        {
          instrumentid: 3,
          ticker: 'ALUA',
          name: 'Aluar',
          type: 'ACCIONES',
          quantity: '5',
          marketvalue: '7800',
          dailyreturn: '1.85',
          totalmarketvalue: '39000',
        },
      ]); // positions

    const result = await controller.getPortfolio(1);

    expect(result).toEqual({
      currency: 'ARS',
      availableCash: 200000,
      totalAccountValue: 239000,
      positions: [
        {
          instrumentId: 3,
          ticker: 'ALUA',
          name: 'Aluar',
          type: 'ACCIONES',
          quantity: 5,
          marketValue: 7800,
          dailyReturn: 1.85,
        },
      ],
    });

    expect(repoStub.query).toHaveBeenCalledTimes(2);
    expect(repoStub.query).toHaveBeenCalledWith(expect.any(String), [1]);
  });
});
