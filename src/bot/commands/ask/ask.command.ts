// src/bot/commands/ask.command.ts
import { ChannelMessage } from 'mezon-sdk';
import { Command } from 'src/bot/base/commandRegister.decorator';
import { CommandMessage } from 'src/bot/base/command.abstract';
import { MezonClientService } from 'src/mezon/services/mezon-client.service';
import { Injectable } from '@nestjs/common';
import {
  safeReply,
  createReplyOptions,
  createPreMarkdown,
} from 'src/bot/utils/reply-helpers';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Command('ask') // Tên lệnh sẽ gọi: !ask <câu hỏi>
@Injectable()
export class AskCommand extends CommandMessage {
  private gemini: GoogleGenerativeAI;

  constructor(clientService: MezonClientService) {
    super(clientService);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined in environment variables.');
    }

    this.gemini = new GoogleGenerativeAI(apiKey);
  }

  async execute(args: string[], message: ChannelMessage): Promise<any> {
    const messageChannel = await this.getChannelMessage(message);
    if (!messageChannel) return;

    // Kiểm tra câu hỏi
    if (args.length === 0) {
      return safeReply(
        messageChannel,
        createReplyOptions(
          '❌ Vui lòng nhập câu hỏi!',
          createPreMarkdown('Ví dụ: !ask Cách tạo bot AI?'),
        ),
      );
    }

    const question = args.join(' ');

    try {
      const model = this.gemini.getGenerativeModel({ model: 'gemini-2.5-flash' });

      // Gọi API Gemini
      const result = await model.generateContent(question);
      const response = await result.response;

      const answer =
        response.text()?.trim() || 'Không có phản hồi';

      // Trả lời người dùng
      return safeReply(
        messageChannel,
        createReplyOptions(`🤖 ${answer}`, createPreMarkdown(answer)),
      );
    } catch (error) {
      console.error('Gemini Error:', error);
      return safeReply(
        messageChannel,
        createReplyOptions(
          '❌ Lỗi kết nối AI',
          createPreMarkdown(`Lỗi: ${error.message || 'Không xác định'}`),
        ),
      );
    }
  }
}