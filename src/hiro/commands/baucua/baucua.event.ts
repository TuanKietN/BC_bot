import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ChannelMessage, Events } from 'mezon-sdk';
import { BaucuaService } from './baucua.service';
import { MezonService } from '../../../mezon/mezon.service';
import { MessageButtonClickedEvent } from '../topup/types';

@Injectable()
export class BaucuaEvent {
  private readonly logger = new Logger(BaucuaEvent.name);

  constructor(
    private readonly baucuaService: BaucuaService,
    private readonly mezon: MezonService,
  ) { }

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
    // Nếu là dropdown chọn cửa
    if (data.button_id === "BauCuaSelect") {
      this.logger.debug(
        `📥 Dropdown chọn cửa: user=${data.user_id}, channel=${data.channel_id}, value=${data.extra_data}`
      );
      await this.baucuaService.handleSelectChoice(
        data.user_id,
        data.extra_data,
        data.channel_id
      );
      return;
    }

    // Nếu là button số tiền
    this.logger.debug(
      `📥 Button tiền: user=${data.user_id}, channel=${data.channel_id}, money=${data.button_id}`
    );
    await this.baucuaService.handleButtonClicked(data);
  }
}
