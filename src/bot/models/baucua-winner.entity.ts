import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index, JoinColumn } from 'typeorm';
import { BaucuaGame } from './baucua-game.entity';
import { v4 as uuidv4 } from 'uuid';

@Entity('BaucuaWinner')
@Index(['gameId'])
@Index(['userId'])
export class BaucuaWinner {
   @PrimaryGeneratedColumn('uuid')
   id: string = uuidv4();

   @Column()
   gameId: string;

   @Column()
   userId: string;

   @Column()
   amount: number;

   @CreateDateColumn()
   createdAt: Date;

   @ManyToOne(() => BaucuaGame, (game) => game.winners, { onDelete: 'CASCADE' })
   @JoinColumn({ name: 'gameId' })
   game: BaucuaGame;
}