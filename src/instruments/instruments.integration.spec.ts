import { Test } from '@nestjs/testing';
import { InstrumentsModule } from './instruments.module';
import { InstrumentsController } from './instruments.controller';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Instrument } from './entities/instrument.entity';

describe('InstrumentsModule Integration', () => {
  let controller: InstrumentsController;

  const repoStub = {
    query: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      imports: [InstrumentsModule],
    })
      .overrideProvider(getRepositoryToken(Instrument))
      .useValue(repoStub)
      .compile();

    controller = moduleRef.get(InstrumentsController);
  });

  it('should return search results based on term with mock repo', async () => {
    const searchTerm = 'valor';
    repoStub.query.mockResolvedValueOnce([
      {
        id: 9,
        ticker: 'VALO',
        name: 'Grupo Financiero Valores',
        type: 'ACCIONES',
      },
    ]);

    const result = await controller.search(searchTerm);

    expect(result).toEqual([
      {
        id: 9,
        ticker: 'VALO',
        name: 'Grupo Financiero Valores',
        type: 'ACCIONES',
      },
    ]);

    expect(repoStub.query).toHaveBeenCalledTimes(1);
    expect(repoStub.query).toHaveBeenCalledWith(expect.any(String), [
      searchTerm,
    ]);
  });
});
