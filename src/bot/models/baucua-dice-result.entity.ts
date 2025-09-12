import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index } from 'typeorm';
import { BaucuaGame } from './baucua-game.entity';
import { DiceSymbol } from '../../common/enums/bot.enum';

@Entity('BaucuaDiceResult')
@Index(['gameId'])
export class BaucuaDiceResult {
   @PrimaryGeneratedColumn('uuid')
   id: string;

   @Column()
   gameId: string;

   @Column({ type: 'enum', enum: DiceSymbol })
   symbol: DiceSymbol;

   @Column()
   position: number;

   @CreateDateColumn()
   createdAt: Date;

   @ManyToOne(() => BaucuaGame, (game) => game.diceResults)
   game: BaucuaGame;
}
