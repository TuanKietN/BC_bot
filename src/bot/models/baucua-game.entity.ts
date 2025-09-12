import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { BaucuaBet } from './baucua-bet.entity';
import { BaucuaDiceResult } from './baucua-dice-result.entity';
import { BaucuaWinner } from './baucua-winner.entity';
import { GameStatus } from '../../common/enums/bot.enum';

@Entity('baucuaGame')
@Index(['channelId'])
@Index(['status'])
export class BaucuaGame {
   @PrimaryGeneratedColumn('uuid')
   id: string;

   @Column()
   channelId: string;

   @Column()
   messageId: string;

   @Column({ type: 'enum', enum: GameStatus, default: GameStatus.WAITING })
   status: GameStatus;

   @CreateDateColumn()
   createdAt: Date;

   @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
   updatedAt: Date;

   @Column({ type: 'timestamp', nullable: true })
   startedAt: Date | null;

   @Column({ type: 'timestamp', nullable: true })
   endedAt: Date | null;

   @Column()
   creatorId: string;

   @OneToMany(() => BaucuaDiceResult, (dice) => dice.game)
   diceResults: BaucuaDiceResult[];

   @OneToMany(() => BaucuaBet, (bet) => bet.game)
   bets: BaucuaBet[];

   @OneToMany(() => BaucuaWinner, (winner) => winner.game)
   winners: BaucuaWinner[];
}
