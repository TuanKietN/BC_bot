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
  ) { }

  @OnEvent(Events.TokenSend)
  async handleTokenCreated(data: TokenSentEvent) {
    await this.topupService.createToken(data as any);
  }

  @OnEvent(Events.ChannelMessage)
  async handleChannelMessage(data: ChannelMessage) {
    const text = data.content.t?.trim();

    if (text === '*kttk') {
      await this.topupService.checkBalance(data);
    }

    if (data.content.t?.startsWith('*rut')) {
      const numberInString = data.content.t.replace(/\D/g, '');
      const number = parseInt(numberInString, 10);

      if (Number.isFinite(number) && number > 0) {
        try {
          await this.topupService.withdraw(data, number);
        } catch (err) {
          console.error('TopupEvent withdraw error:', err);
        }
      }
    }
  }
}
