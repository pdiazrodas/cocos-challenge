import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
import { PortfolioDto } from './dto/portfolio.dto';

describe('PortfolioController', () => {
  describe('getPortfolio()', () => {
    let controller: PortfolioController;
    let serviceStub: jest.Mocked<PortfolioService>;

    const mockPortfolio: PortfolioDto = {
      currency: 'ARS',
      availableCash: 150000,
      totalAccountValue: 170000,
      positions: [],
    };

    beforeEach(() => {
      serviceStub = {
        getPortfolioForUser: jest.fn().mockResolvedValue(mockPortfolio),
      } as unknown as jest.Mocked<PortfolioService>;

      controller = new PortfolioController(serviceStub);
    });

    it('should return portfolio from service for given userId', async () => {
      const userId = 1;
      const result = await controller.getPortfolio(userId);

      expect(serviceStub.getPortfolioForUser).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockPortfolio);
    });
  });
});
