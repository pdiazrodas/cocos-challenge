import { InstrumentsService } from './instruments.service';

describe('InstrumentsService', () => {
  let service: InstrumentsService;
  const repoStub = {
    query: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new InstrumentsService(repoStub as any);
  });

  describe('searchByTerm()', () => {
    it('should return mapped search results for matching instruments', async () => {
      const searchTerm = 'alua';
      repoStub.query.mockResolvedValueOnce([
        {
          id: 3,
          ticker: 'ALUA',
          name: 'Aluar',
          type: 'ACCIONES',
        },
        {
          id: 5,
          ticker: 'VALO',
          name: 'Grupo Financiero Valores',
          type: 'ACCIONES',
        },
      ]);

      const result = await service.searchByTerm(searchTerm);

      expect(repoStub.query).toHaveBeenCalledWith(expect.any(String), [
        searchTerm,
      ]);
      expect(result).toEqual([
        {
          id: 3,
          ticker: 'ALUA',
          name: 'Aluar',
          type: 'ACCIONES',
        },
        {
          id: 5,
          ticker: 'VALO',
          name: 'Grupo Financiero Valores',
          type: 'ACCIONES',
        },
      ]);
    });

    it('should return empty array when no instruments match', async () => {
      repoStub.query.mockResolvedValueOnce([]);
      const result = await service.searchByTerm('xyz');

      expect(result).toEqual([]);
    });
  });
});
