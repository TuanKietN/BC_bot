import { Injectable } from '@nestjs/common';
import { TopupService } from './topup.service';
import { OnEvent } from '@nestjs/event-emitter';
import { ChannelMessage, Events, TokenSentEvent } from 'mezon-sdk';
import { MessageButtonClickedEvent, TokenSentEventI } from './types';
import { MezonService } from '../../../mezon/mezon.service';
import { EMessageMode } from '../../../common/enums/mezon.enum';
@Injectable()
export class TopupEvent {
  constructor(
    private readonly topupService: TopupService,
    private readonly mezon: MezonService,
  ) {}

  @OnEvent(Events.TokenSend)
  async handleTokenCreated(data: TokenSentEvent) {
    await this.topupService.createToken(data as any);
  }

  @OnEvent(Events.ChannelMessage)
  async handleChannelMessage(data: ChannelMessage) {
    if (data.content.t === '*kttk') {
      await this.topupService.checkBalance(data);
    }
  }

  @OnEvent(Events.ChannelMessage)
  async handleChannelMessageButtonClicked(data: ChannelMessage) {
    if (data.content.t?.startsWith('*rut')) {
      const numberInString = data.content.t.match(/\d+/);
      if (numberInString) {
        const number = parseInt(numberInString[0]);
        if (number) {
          await this.topupService.withdraw(data, number);
        }
      }
    }
  }
}
