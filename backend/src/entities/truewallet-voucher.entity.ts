import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('truewallet_vouchers')
export class TrueWalletVoucher {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: string;

  @Column()
  voucher_code: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column()
  owner_full_name: string;

  @Column({ default: 'redeemed' })
  status: string;

  @CreateDateColumn()
  redeemed_at: Date;
}