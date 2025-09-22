import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  transaction_id: string;

  @Column()
  user_id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ default: 'pending' })
  status: string;

  @Column({ default: 'incoming' })
  type: string; // 'incoming' หรือ 'outgoing'

  @Column({ type: 'text', nullable: true })
  qr_code_url: string;

  @Column({ type: 'datetime', nullable: true })
  expires_at: Date;

  @Column({ type: 'text', nullable: true })
  payment_ref: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}