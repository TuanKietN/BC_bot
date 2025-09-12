import {
   Entity,
   PrimaryGeneratedColumn,
   Column,
   CreateDateColumn,
   UpdateDateColumn,
   Unique,
   Index,
} from 'typeorm';

@Entity('user_balance')
@Unique(['user_id'])
@Index('idx_user_balance_user_id', ['user_id'])
export class UserBalance {
   @PrimaryGeneratedColumn()
   id: number;

   @Column({ type: 'varchar', length: 191 })
   user_id: string;

   @Column({ type: 'varchar', length: 255 })
   username: string;

   @Column({ type: 'int', default: 0 })
   balance: number;

   @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
   created_at: Date;

   @UpdateDateColumn({
      name: 'updated_at',
      type: 'timestamp',
      default: () => 'CURRENT_TIMESTAMP',
      onUpdate: 'CURRENT_TIMESTAMP',
   })
   updated_at: Date;
}
