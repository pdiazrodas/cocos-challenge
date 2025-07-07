import { Controller, Get, Query } from '@nestjs/common';
import { InstrumentsService } from './instruments.service';

@Controller('instruments')
export class InstrumentsController {
  constructor(private readonly instrumentsService: InstrumentsService) {}

  @Get('search')
  search(@Query('term') term: string) {
    return this.instrumentsService.searchByTerm(term);
  }
}
