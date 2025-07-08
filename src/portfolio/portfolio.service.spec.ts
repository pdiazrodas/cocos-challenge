import { PortfolioService } from './portfolio.service';

describe('PortfolioService', () => {
  let service: PortfolioService;
  const ordersRepoStub = {
    query: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PortfolioService(ordersRepoStub as any);
  });

  describe('getPortfolioForUser()', () => {
    it('should return correct portfolio with available cash and total market value', async () => {
      // Cash available mocked to 150000
      ordersRepoStub.query
        .mockResolvedValueOnce([{ available_cash: '150000' }])
        // Positions with total market value mocked
        .mockResolvedValueOnce([
          {
            instrumentid: 1,
            ticker: 'DYCA',
            name: 'Dycasa S.A.',
            type: 'ACCIONES',
            quantity: '10',
            marketvalue: '2590',
            dailyreturn: '1.2',
            totalmarketvalue: '25900',
          },
        ]);

      const result = await service.getPortfolioForUser(1);

      expect(result).toEqual({
        currency: 'ARS',
        availableCash: 150000,
        totalAccountValue: 150000 + 25900,
        positions: [
          {
            instrumentId: 1,
            ticker: 'DYCA',
            name: 'Dycasa S.A.',
            type: 'ACCIONES',
            quantity: 10,
            marketValue: 2590,
            dailyReturn: 1.2,
          },
        ],
      });

      expect(ordersRepoStub.query).toHaveBeenCalledTimes(2);
    });
  });
});
