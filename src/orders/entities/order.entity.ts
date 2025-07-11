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
  @JoinColumn({ name: 'instrumentid' })
  instrument: Instrument;

  @Column({ name: 'instrumentid' })
  instrumentId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userid' })
  user: User;

  @Column({ name: 'userid' })
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
