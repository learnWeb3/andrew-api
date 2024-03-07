import { Module } from '@nestjs/common';
import { ApiModule } from './api/api.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { KafkaConsumerModule } from './kafka-consumer/kafka-consumer.module';
import { MqttModule } from './mqtt/mqtt.module';

@Module({
  imports: [
    ...(process.env.NODE_ENV !== 'production'
      ? [ConfigModule.forRoot({ envFilePath: '.env.development' })]
      : []),
    MongooseModule.forRoot(process.env.MONGO_URI),
    ApiModule,
    KafkaConsumerModule,
    MqttModule.register({
      clientId: 'public-andrew-api',
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
