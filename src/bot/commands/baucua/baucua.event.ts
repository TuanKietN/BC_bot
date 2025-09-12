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

  /** Lắng nghe tin nhắn trong channel */
  @OnEvent(Events.ChannelMessage)
  async handleChannelMessage(data: ChannelMessage) {
    try {
      await this.baucuaService.ensureUserBalance(
        data.sender_id,
        data.username,
        data.display_name,
      );

      const text = data.content?.t?.trim() ?? '';

      if (text.startsWith('*bchistory')) {
        await this.baucuaService.handleGameHistory(data);
      } else if (text.startsWith('*bcbet')) {
        await this.baucuaService.handleBetResult(data);
      } else if (text.startsWith('*bc')) {
        await this.baucuaService.createBaucua(data);
      }
    } catch (error) {
      this.logger.error(`❌ Error handleChannelMessage: ${error.message}`, error.stack);
    }
  }

  /** Lắng nghe event khi user click button */
  @OnEvent(Events.MessageButtonClicked)
  async handleMessageButtonClicked(data: MessageButtonClickedEvent) {
    try {
      // Dropdown chọn cửa
      if (data.button_id === 'BauCuaSelect') {
        this.logger.debug(
          `📥 Dropdown chọn cửa: user=${data.user_id}, channel=${data.channel_id}, value=${data.extra_data}`,
        );
        await this.baucuaService.handleSelectChoice(
          data.user_id,
          data.extra_data,
          data.channel_id,
        );
        return;
      }

      // Button chọn tiền
      this.logger.debug(
        `📥 Button tiền: user=${data.user_id}, channel=${data.channel_id}, money=${data.button_id}`,
      );
      await this.baucuaService.handleButtonClicked(data);
    } catch (error) {
      this.logger.error(`❌ Error handleMessageButtonClicked: ${error.message}`, error.stack);
    }
  }
}
