import {
   Entity,
   PrimaryGeneratedColumn,
   Column,
   CreateDateColumn,
   UpdateDateColumn,
} from 'typeorm';

@Entity('transaction_send_logs')
export class TransactionSendLog {
   @PrimaryGeneratedColumn()
   id: number;

   @Column({ name: 'user_id' })
   userId: string;

   @Column()
   amount: number;

   @Column({ name: 'to_user_id' })
   toUserId: string;

   @Column({ default: 'bj' })
   note: string;

   @CreateDateColumn({ name: 'created_at' })
   createdAt: Date;

   @UpdateDateColumn({ name: 'updated_at' })
   updatedAt: Date;
}
