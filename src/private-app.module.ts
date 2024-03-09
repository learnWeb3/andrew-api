import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PrivateApiModule } from './private-api/private-api.module';
import { MqttModule } from './mqtt/mqtt.module';
import { hostname } from 'os';

@Module({
  imports: [
    ...(process.env.NODE_ENV !== 'production'
      ? [ConfigModule.forRoot({ envFilePath: '.env.development' })]
      : []),
    MongooseModule.forRoot(process.env.MONGO_URI),
    PrivateApiModule,
    MqttModule.register({
      clientId:
        process.env.NODE_ENV !== 'production'
          ? 'private-andrew-api' + '_' + hostname()
          : 'private-andrew-api',
    }),
  ],
  controllers: [],
  providers: [],
})
export class PrivateAppModule {}
