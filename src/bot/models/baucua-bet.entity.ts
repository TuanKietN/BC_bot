import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index } from 'typeorm';
import { BaucuaGame } from './baucua-game.entity';
import { DiceSymbol } from '../../common/enums/bot.enum';

@Entity('BaucuaBet')
@Index(['gameId'])
@Index(['userId'])
export class BaucuaBet {
   @PrimaryGeneratedColumn('uuid')
   id: string;

   @Column()
   gameId: string;

   @Column()
   userId: string;

   @Column({ type: 'enum', enum: DiceSymbol })
   symbol: DiceSymbol;

   @Column()
   amount: number;

   @CreateDateColumn()
   createdAt: Date;

   @ManyToOne(() => BaucuaGame, (game) => game.bets)
   game: BaucuaGame;
}
