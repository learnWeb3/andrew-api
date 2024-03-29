import { Inject, Injectable } from '@nestjs/common';
import { AndrewDeviceActivationStatusResponseEvent } from 'andrew-events-schema/andrew-device-events';
import * as mqtt from 'mqtt';
import { hostname } from 'os';
import { Subject, Subscription } from 'rxjs';
import { DeviceStatus } from 'src/lib/interfaces/device-status.enum';
import { NotificationDocument } from 'src/notification/notification/notification.schemas';

export interface MqttServiceOptions {
  clientId: string;
}

@Injectable()
export class MqttService {
  private readonly subject: Subject<any>;
  private clientId: string;
  private subscription: Subscription = null;
  constructor(@Inject('CONFIG_OPTIONS') private options: MqttServiceOptions) {
    this.clientId = options.clientId || hostname();
    this.subject = new Subject();
  }

  onModuleInit() {
    this.initClient();
  }

  private emit(message: { topic: string; payload: string | Buffer }) {
    console.log(`===> sending message through mqtt topic ${message.topic}`);
    this.subject.next(message);
  }

  public async emitSupervisorNotification(message: NotificationDocument) {
    this.emit({
      topic: `source/frontend/supervisor/notification`,
      payload: JSON.stringify(message),
    });
  }

  public async emitAdminNotification(message: NotificationDocument) {
    this.emit({
      topic: `source/frontend/admin/notification`,
      payload: JSON.stringify(message),
    });
  }

  public async emitCustomerNotification(
    oauthId: string,
    message: NotificationDocument,
  ) {
    this.emit({
      topic: `source/frontend/users/${oauthId}/notification`,
      payload: JSON.stringify(message),
    });
  }

  public emitActivationStatusEvent(
    device: string,
    vehicleVIN: string,
    status: DeviceStatus,
  ) {
    const event = new AndrewDeviceActivationStatusResponseEvent(device, {
      device,
      vehicle: vehicleVIN,
      status,
    });

    this.emit({
      topic: `source/andrew-api/vehicles/${vehicleVIN}/devices/${device}/cmd/activation-status`,
      payload: JSON.stringify(event),
    });
  }

  private initClient() {
    try {
      const client = mqtt.connect(
        `${process.env.MQTT_BROKER_PROTOCOL}://${process.env.MQTT_BROKER_HOST}`,
        {
          username: process.env.MQTT_AUTH_USERNAME,
          password: process.env.MQTT_AUTH_PASSWORD,
          rejectUnauthorized: true,
          clientId: this.clientId,
        },
      );

      console.log(`attempting connection to host`);

      client.on('connect', () => {
        console.log('mqtt broker connection opened.');

        if (this.subscription) {
          console.log(`removing existsing subscription`);
          this.subscription.unsubscribe();
        }

        this.subscription = this.subject.subscribe(
          (value: { topic: string; payload: string | Buffer }) => {
            console.log(
              `sending message to mqtt topic ${value.topic}`,
              value.payload,
            );
            client.publish(value.topic, value.payload);
          },
        );
      });

      client.on('error', (err) => {
        console.error(err);
        this.initClient();
      });
    } catch (error) {
      console.log(error);
    }
  }
}
