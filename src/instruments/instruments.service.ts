import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Instrument } from './entities/instrument.entity';
import { InstrumentSearchDto } from './dto/instruments-search.dto';

@Injectable()
export class InstrumentsService {
  constructor(
    @InjectRepository(Instrument)
    private readonly instrumentRepo: Repository<Instrument>,
  ) {}

  public async searchByTerm(term: string): Promise<InstrumentSearchDto[]> {
    const rawQuery = `
      SELECT id, ticker, name, type
      FROM instruments
      WHERE type != 'MONEDA'
        AND (unaccent(ticker) ILIKE unaccent('%' || $1 || '%')
         OR unaccent(name) ILIKE unaccent('%' || $1 || '%'));
    `;

    const results = await this.instrumentRepo.query(rawQuery, [term]);

    return results.map((r) => ({
      id: r.id,
      ticker: r.ticker,
      name: r.name,
      type: r.type,
    }));
  }
}
