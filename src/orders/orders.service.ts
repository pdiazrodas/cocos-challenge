import { Injectable } from '@nestjs/common';

@Injectable()
export class OrdersService {
  findAll() {
    return `This action returns all orders`;
  }
}
