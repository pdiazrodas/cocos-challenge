import { CreateOrderDto } from '../dto/create-order.dto';
import { Order } from '../entities/order.entity';

export interface OrderStrategy {
  execute(dto: CreateOrderDto): Promise<Order>;
}
