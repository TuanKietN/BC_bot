import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ChannelMessage, Events } from 'mezon-sdk';
import { BaucuaService } from './baucua.service';
import { MezonService } from '../../../mezon/mezon.service';
import { MessageButtonClickedEvent } from '../topup/types';
@Injectable()
export class BaucuaEvent {
  constructor(
    private readonly baucuaService: BaucuaService,
    private readonly mezon: MezonService,
  ) {}

  @OnEvent(Events.ChannelMessage)
  async handleChannelMessage(data: ChannelMessage) {
    if (data.content.t?.startsWith('*bchistory')) {
      await this.baucuaService.handleGameHistory(data);
    }
    else if (data.content.t?.startsWith('*bcbet')) {
      await this.baucuaService.handleBetResult(data);
    }
    else if (data.content.t?.startsWith('*bc')) {
        await this.baucuaService.createBaucua(data);
    }
  }

  @OnEvent(Events.MessageButtonClicked)
  async handleMessageButtonClicked(data: MessageButtonClickedEvent) {
    await this.baucuaService.handleButtonClicked(data);
  }
}
