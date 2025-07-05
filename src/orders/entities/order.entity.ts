import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Instrument } from '../../instruments/entities/instrument.entity';
import { User } from '../../users/entities/user.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Instrument)
  @JoinColumn({ name: 'instrumentId' })
  instrument: Instrument;

  @Column()
  instrumentId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @Column()
  side: string; // 'BUY', 'SELL', 'CASH_IN', 'CASH_OUT'

  @Column('int')
  size: number;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  price: number;

  @Column()
  type: string; // 'MARKET' o 'LIMIT'

  @Column()
  status: string; // 'NEW', 'FILLED', 'REJECTED', 'CANCELLED'

  @CreateDateColumn()
  datetime: Date;
}
