import { InstrumentsController } from './instruments.controller';
import { InstrumentsService } from './instruments.service';
import { InstrumentSearchDto } from './dto/instruments-search.dto';

describe('InstrumentsController', () => {
  let controller: InstrumentsController;
  let serviceStub: jest.Mocked<InstrumentsService>;

  const mockResults: InstrumentSearchDto[] = [
    {
      id: 3,
      ticker: 'ALUA',
      name: 'Aluar',
      type: 'ACCIONES',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    serviceStub = {
      searchByTerm: jest.fn().mockResolvedValue(mockResults),
    } as unknown as jest.Mocked<InstrumentsService>;

    controller = new InstrumentsController(serviceStub);
  });

  describe('search()', () => {
    it('should return instruments based on the search term', async () => {
      const term = 'alu';
      const result = await controller.search(term);

      expect(serviceStub.searchByTerm).toHaveBeenCalledWith(term);
      expect(result).toEqual(mockResults);
    });
  });
});
