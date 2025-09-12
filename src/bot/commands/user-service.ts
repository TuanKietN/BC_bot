import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChannelMessage } from 'mezon-sdk';
import { UserBalance } from '../models/user-balance.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserBalance)
    private readonly userBalanceRepo: Repository<UserBalance>,
  ) { }

  async getUserBalance(data: ChannelMessage) {
    return await this.userBalanceRepo.findOne({
      where: { user_id: data.sender_id },
    });
  }
}