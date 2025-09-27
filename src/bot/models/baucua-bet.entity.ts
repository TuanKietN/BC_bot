import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index } from 'typeorm';
import { BaucuaGame } from './baucua-game.entity';
import { DiceSymbol } from '../../common/enums/bot.enum';
import { v4 as uuidv4 } from 'uuid';

@Entity('BaucuaBet')
@Index(['gameId', 'userId'])
export class BaucuaBet {
   @PrimaryGeneratedColumn('uuid')
   id: string = uuidv4();

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
