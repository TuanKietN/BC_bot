import { ChannelMessage } from 'mezon-sdk';

export interface CommandBaseInterface {
  execute: (
    commandName: string,
    args: string[],
    message: ChannelMessage,
  ) => null[];
}
