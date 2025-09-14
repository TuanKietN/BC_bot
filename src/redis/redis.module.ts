import { redisClientFactory } from './redis';
import { RedisCacheService } from './redis-cache.service';
import { RedisRepository } from './redis.repo';
import { Module } from '@nestjs/common';
import { Global } from '@nestjs/common';

@Global()
@Module({
  imports: [],
  providers: [redisClientFactory, RedisRepository, RedisCacheService],
  exports: [RedisRepository],
})
export class RedisModule {}
