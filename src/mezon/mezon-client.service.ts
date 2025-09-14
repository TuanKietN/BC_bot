import { Inject, Injectable, Logger } from '@nestjs/common';
import { MezonClient } from 'mezon-sdk';

@Injectable()
export class MezonClientService {
   private readonly logger = new Logger(MezonClientService.name);

   constructor(@Inject('MEZON') private readonly client: MezonClient) { }

   getClient() {
      return this.client;
   }
}
