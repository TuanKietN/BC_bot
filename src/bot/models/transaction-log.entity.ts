import {
   Entity,
   PrimaryGeneratedColumn,
   Column,
   CreateDateColumn,
   UpdateDateColumn,
} from 'typeorm';

export enum ETransactionType {
   DEPOSIT = 'DEPOSIT',
   WITHDRAW = 'WITHDRAW',
}

@Entity('transaction_logs')
export class TransactionLog {
   @PrimaryGeneratedColumn()
   id: number;

   @Column({ name: 'user_id' })
   userId: string;

   @Column()
   amount: number;

   @Column({ type: 'uuid', default: () => "gen_random_uuid()" })
   transactionId: string;

   @Column({
      type: 'enum',
      enum: ETransactionType,
      default: ETransactionType.DEPOSIT,
   })
   type: ETransactionType;

   @CreateDateColumn({ name: 'created_at' })
   createdAt: Date;

   @UpdateDateColumn({ name: 'updated_at' })
   updatedAt: Date;
}
