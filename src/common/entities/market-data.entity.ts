import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Instrument } from '../../instruments/entities/instrument.entity';

@Entity('marketdata')
export class MarketData {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Instrument)
  @JoinColumn({ name: 'instrumentId' })
  instrument: Instrument;

  @Column({ name: 'instrumentid' })
  instrumentId: number;

  @Column('decimal', { precision: 12, scale: 2 })
  high: number;

  @Column('decimal', { precision: 12, scale: 2 })
  low: number;

  @Column('decimal', { precision: 12, scale: 2 })
  open: number;

  @Column('decimal', { precision: 12, scale: 2 })
  close: number;

  @Column('decimal', { precision: 12, scale: 2, name: 'previousclose' })
  previousClose: number;

  @Column({ type: 'date' })
  date: Date;
}
