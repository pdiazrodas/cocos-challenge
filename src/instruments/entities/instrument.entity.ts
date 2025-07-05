import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('instruments')
export class Instrument {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ticker: string;

  @Column()
  name: string;

  @Column()
  type: string; // ej: 'ACCIONES', 'MONEDA', etc.
}
