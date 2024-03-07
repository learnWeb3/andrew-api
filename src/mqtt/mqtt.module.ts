import { DynamicModule, Global, Module } from '@nestjs/common';
import { MqttService, MqttServiceOptions } from './mqtt/mqtt.service';

@Global()
@Module({})
export class MqttModule {
  static register(options: MqttServiceOptions): DynamicModule {
    return {
      module: MqttModule,
      providers: [
        {
          provide: 'CONFIG_OPTIONS',
          useValue: options,
        },
        MqttService,
      ],
      exports: [MqttService],
    };
  }
}
