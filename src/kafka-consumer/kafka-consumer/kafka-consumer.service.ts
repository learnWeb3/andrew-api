import { Inject, Injectable, forwardRef } from '@nestjs/common';
import {
  AndrewDeviceActivationStatusRequestEvent,
  AndrewDeviceConnectEvent,
  AndrewDeviceConnectEventData,
  AndrewDeviceDisconnectEvent,
  AndrewDeviceDisconnectEventData,
  AndrewDeviceDrivingSessionEndEvent,
  AndrewDeviceDrivingSessionStartEvent,
  AndrewDeviceEvent,
  AndrewDeviceEventType,
  AndrewDeviceMetricEvent,
  AndrewDeviceMetricEventData,
} from 'andrew-events-schema/andrew-device-events';
import {
  AndrewEcommerceCheckoutCanceledEvent,
  AndrewEcommerceCheckoutCanceledEventData,
  AndrewEcommerceCheckoutCompletedEvent,
  AndrewEcommerceCheckoutCompletedEventData,
  AndrewEcommerceEvent,
  AndrewEcommerceEventType,
  AndrewEcommerceSubscriptionCanceledEvent,
  AndrewEcommerceSubscriptionErrorEvent,
} from 'andrew-events-schema/andrew-ecommerce-events';
import { Kafka, Consumer } from 'kafkajs';
import { DeviceSessionService } from 'src/device-session/device-session/device-session.service';
import { DeviceService } from 'src/device/device/device.service';
import { DrivingSessionService } from 'src/driving-session/driving-session/driving-session.service';
import { MqttService } from 'src/mqtt/mqtt/mqtt.service';
import { OpensearchService } from 'src/opensearch/opensearch/opensearch.service';
import { DeviceDocument } from 'src/device/device/device.schemas';
import { hostname } from 'os';
import { VehicleDocument } from 'src/vehicle/vehicle/vehicle.schema';
import { EventCategory } from 'src/device/device/event-category.enum';
import { EventLevel } from 'src/device/device/event-level.enum';
import { SubscriptionApplicationService } from 'src/subscription-application/subscription-application/subscription-application.service';
import { SubscriptionApplicationStatus } from 'src/lib/interfaces/subscription-application-status.enum';
import { ContractService } from 'src/contract/contract/contract.service';
import { ContractStatus } from 'src/lib/interfaces/contract-status.enum';
import { DriverBehaviourClassInt } from 'src/lib/interfaces/driver-behaviour-class-int.enum';
import { NotificationService } from 'src/notification/notification/notification.service';
import { NotificationType } from 'src/lib/interfaces/notification-type.enum';

@Injectable()
export class KafkaConsumerService {
  private readonly client: Kafka;
  private readonly ecommerceClient: Kafka;
  private readonly consumer: Consumer;
  private readonly ecommerceConsumer: Consumer;
  private readonly topic: string = process.env.KAFKA_TOPIC;
  private readonly ecommerceTopic: string = process.env.KAFKA_ECOMMERCE_TOPIC;
  constructor(
    @Inject(forwardRef(() => SubscriptionApplicationService))
    private subscriptionApplicationService: SubscriptionApplicationService,
    @Inject(forwardRef(() => ContractService))
    private contractService: ContractService,
    @Inject(forwardRef(() => DeviceService))
    private deviceService: DeviceService,
    @Inject(forwardRef(() => OpensearchService))
    private opensearchService: OpensearchService,
    @Inject(forwardRef(() => DeviceSessionService))
    private deviceSessionService: DeviceSessionService,
    @Inject(forwardRef(() => DrivingSessionService))
    private drivingSessionService: DrivingSessionService,
    @Inject(forwardRef(() => MqttService))
    private mqttService: MqttService,
    @Inject(forwardRef(() => NotificationService))
    private notificationService: NotificationService,
  ) {
    this.ecommerceClient = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID + '_' + hostname(),
      brokers: process.env.KAFKA_BROKERS.split(','),
      sasl: {
        mechanism: 'scram-sha-512',
        username: process.env.KAFKA_ECOMMERCE_SASL_USERNAME,
        password: process.env.KAFKA_ECOMMERCE_SASL_PASSWORD,
      },
    });
    this.client = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID + '_' + hostname(),
      brokers: process.env.KAFKA_BROKERS.split(','),
      sasl: {
        mechanism: 'scram-sha-512',
        username: process.env.KAFKA_SASL_USERNAME,
        password: process.env.KAFKA_SASL_PASSWORD,
      },
    });
    this.consumer = this.client.consumer({
      groupId: process.env.KAFKA_GROUP_ID_PREFIX + '_' + hostname(),
    });
    this.ecommerceConsumer = this.ecommerceClient.consumer({
      groupId: process.env.KAFKA_ECOMMERCE_GROUP_ID_PREFIX + '_' + hostname(),
    });
  }

  onModuleInit() {
    this.ecommerceConsumer
      .connect()
      .then(async () => {
        console.log(
          `kafka consumer successfully subscribed to kafka topic ${this.ecommerceTopic}`,
        );
        await this.ecommerceConsumer.subscribe({
          topic: this.ecommerceTopic,
          fromBeginning: false,
        });
      })
      .then(() => {
        this.ecommerceConsumer.run({
          eachMessage: async ({ message, pause }) => {
            const resume = pause();

            try {
              const andrewEcommerceEvent: AndrewEcommerceEvent<
                | AndrewEcommerceCheckoutCanceledEventData
                | AndrewEcommerceCheckoutCompletedEventData
                | AndrewEcommerceSubscriptionCanceledEvent
                | AndrewEcommerceSubscriptionErrorEvent
              > = JSON.parse(message.value.toString());

              console.log(
                `received ecommerce event ${JSON.stringify(
                  andrewEcommerceEvent,
                  null,
                  4,
                )}`,
              );

              switch (andrewEcommerceEvent.type) {
                case AndrewEcommerceEventType.CHECKOUT_CANCELED:
                  const andrewEcommerceCheckoutCanceledEvent: AndrewEcommerceCheckoutCanceledEvent =
                    andrewEcommerceEvent as AndrewEcommerceCheckoutCanceledEvent;

                  await this.subscriptionApplicationService.updateStatus(
                    {
                      'contract.contract':
                        andrewEcommerceCheckoutCanceledEvent.data.contract,
                      'contract.ecommerceGateway':
                        andrewEcommerceCheckoutCanceledEvent.data.gateway,
                    },
                    {
                      status: SubscriptionApplicationStatus.PAYMENT_CANCELED,
                    },
                  );

                  break;
                case AndrewEcommerceEventType.CHECKOUT_COMPLETED:
                  const andrewEcommerceCheckoutCompletedEvent: AndrewEcommerceCheckoutCompletedEvent =
                    andrewEcommerceEvent as AndrewEcommerceCheckoutCompletedEvent;

                  await this.subscriptionApplicationService.updateStatus(
                    {
                      'contract.contract':
                        andrewEcommerceCheckoutCompletedEvent.data.contract,
                      'contract.ecommerceGateway':
                        andrewEcommerceCheckoutCompletedEvent.data.gateway,
                    },
                    {
                      status: SubscriptionApplicationStatus.PAYMENT_CONFIRMED,
                    },
                  );

                  break;

                case AndrewEcommerceEventType.SUBSCRIPTION_CANCELED:
                  const andrewEcommerceSubscriptionCanceledEvent: AndrewEcommerceSubscriptionCanceledEvent =
                    andrewEcommerceEvent as AndrewEcommerceSubscriptionCanceledEvent;

                  await this.contractService.cancel(
                    {
                      _id: andrewEcommerceSubscriptionCanceledEvent.data
                        .contract,
                    },
                    ContractStatus.CANCELED,
                  );

                  break;

                case AndrewEcommerceEventType.SUBSCRIPTION_ERROR:
                  const andrewEcommerceSubscriptionErrorEvent: AndrewEcommerceSubscriptionErrorEvent =
                    andrewEcommerceEvent as AndrewEcommerceSubscriptionErrorEvent;

                  await this.contractService.handlePaymentError(
                    andrewEcommerceSubscriptionErrorEvent.data.contract,
                  );

                  break;
                default:
                  console.log(
                    `handlers for event ${andrewEcommerceEvent.type} is not implemented`,
                  );
                  break;
              }
            } catch (error) {
              console.log(error);
            } finally {
              resume();
            }
          },
        });
      });
    this.consumer
      .connect()
      .then(async () => {
        console.log(
          `kafka consumer successfully subscribed to kafka topic ${this.topic}`,
        );
        await this.consumer.subscribe({
          topic: this.topic,
          fromBeginning: false,
        });
      })
      .then(() => {
        this.consumer.run({
          eachMessage: async ({ message, pause }) => {
            const resume = pause();

            try {
              const andrewDeviceEvent: AndrewDeviceEvent<
                | AndrewDeviceConnectEventData
                | AndrewDeviceDisconnectEventData
                | AndrewDeviceMetricEventData
              > = JSON.parse(message.value.toString());

              console.log(
                `received device event ${JSON.stringify(
                  andrewDeviceEvent,
                  null,
                  4,
                )}`,
              );

              switch (andrewDeviceEvent.type) {
                case AndrewDeviceEventType.CONNECT:
                  const andrewDeviceConnectEvent: AndrewDeviceConnectEvent =
                    andrewDeviceEvent as AndrewDeviceConnectEvent;
                  await this.deviceSessionService.handleSessionStart(
                    andrewDeviceConnectEvent.subject,
                  );
                  break;
                case AndrewDeviceEventType.DISCONNECT:
                  const andrewDeviceDisconnectEvent: AndrewDeviceDisconnectEvent =
                    andrewDeviceEvent as AndrewDeviceDisconnectEvent;
                  await this.deviceService.logDeviceEvent(
                    andrewDeviceDisconnectEvent.subject,
                    EventCategory.CONNECTION_LOST,
                    EventLevel.LOW,
                  );
                  await this.deviceSessionService.handleSessionEnd(
                    andrewDeviceDisconnectEvent.subject,
                  );
                  break;
                case AndrewDeviceEventType.ACTIVATION_STATUS_REQUEST:
                  const andrewDeviceActivationStatusRequestEvent: AndrewDeviceActivationStatusRequestEvent =
                    andrewDeviceEvent as AndrewDeviceActivationStatusRequestEvent;
                  // lookup the device activation  status in database
                  const device = (await this.deviceService.findOne(
                    {
                      _id: andrewDeviceActivationStatusRequestEvent.data.device,
                    },
                    ['vehicle'],
                  )) as DeviceDocument & { vehicle: VehicleDocument };
                  if (device && device?.vehicle?.vin) {
                    // send status of the device through mqtt
                    this.mqttService.emitActivationStatusEvent(
                      device._id,
                      device.vehicle.vin,
                      device.status,
                    );
                  }
                  break;
                case AndrewDeviceEventType.DRIVING_SESSION_START:
                  const andrewDeviceDrivingSessionStartEvent: AndrewDeviceDrivingSessionStartEvent =
                    andrewDeviceEvent as AndrewDeviceDrivingSessionStartEvent;
                  await this.drivingSessionService.handleSessionStart(
                    andrewDeviceDrivingSessionStartEvent.subject,
                  );
                  break;
                case AndrewDeviceEventType.DRIVING_SESSION_END:
                  const andrewDeviceDrivingSessionEndEvent: AndrewDeviceDrivingSessionEndEvent =
                    andrewDeviceEvent as AndrewDeviceDrivingSessionEndEvent;
                  const drivingSessionEndDevice =
                    (await this.deviceService.findOne(
                      {
                        _id: andrewDeviceDrivingSessionEndEvent.data.device,
                      },
                      ['vehicle'],
                    )) as DeviceDocument & { vehicle: VehicleDocument };
                  await this.drivingSessionService.handleSessionEnd(
                    andrewDeviceDrivingSessionEndEvent.subject,
                  );
                  const drivingSession =
                    await this.drivingSessionService.findLastSession(
                      andrewDeviceDrivingSessionEndEvent.subject,
                    );
                  // call opensearch to gather data for last driving session
                  const drivingSessionData =
                    await this.opensearchService.getLastReportData(
                      andrewDeviceDrivingSessionEndEvent.data.vehicle,
                      drivingSession.start.getTime(),
                      drivingSession.end.getTime(),
                    );

                  // call AI model to qualify data for last driving session
                  // TO DO
                  const driverBehaviourClassMock = [
                    'A',
                    'B',
                    'C',
                    'D',
                    'E',
                    'F',
                    'G',
                    'H',
                    'I',
                    'J',
                    'K',
                  ][Math.floor(Math.random() * 11)];
                  const driverBehaviourClassInt =
                    DriverBehaviourClassInt[driverBehaviourClassMock];
                  const reportDocument: {
                    device: string;
                    vehicle: string;
                    report: {
                      driving_session: {
                        start: number;
                        end: number;
                        driver_behaviour_class: string;
                        driver_behaviour_class_int: number;
                      };
                    };
                  } = {
                    device: andrewDeviceDrivingSessionEndEvent.data.device,
                    vehicle: andrewDeviceDrivingSessionEndEvent.data.vehicle,
                    report: {
                      driving_session: {
                        start: drivingSession.start.getTime(),
                        end: drivingSession.end.getTime(),
                        driver_behaviour_class: driverBehaviourClassMock,
                        driver_behaviour_class_int: driverBehaviourClassInt,
                      },
                    },
                  };
                  // register report for session in opensearch
                  await this.opensearchService.registerDeviceReportData(
                    andrewDeviceDrivingSessionEndEvent.data.vehicle,
                    reportDocument,
                  );
                  // dispatch new report notification

                  await this.notificationService.createCustomerNotification({
                    type: NotificationType.NEW_DEVICE_METRICS_REPORT_AVAILABLE,
                    receivers: [drivingSessionEndDevice.customer],
                    data: reportDocument,
                  });
                  break;
                case AndrewDeviceEventType.VEHICLE_VIN:
                  break;
                case AndrewDeviceEventType.METRIC:
                  const andrewDeviceMetricEvent: AndrewDeviceMetricEvent =
                    andrewDeviceEvent as AndrewDeviceMetricEvent;
                  // qualify data using ai model
                  // write to opensearch
                  await this.opensearchService.registerDeviceData(
                    andrewDeviceMetricEvent.data.vehicle,
                    andrewDeviceMetricEvent.data,
                  );
                  break;
                default:
                  console.log(
                    `handlers for event ${andrewDeviceEvent.type} is not implemented`,
                  );
                  break;
              }
            } catch (error) {
              console.log(error);
            } finally {
              resume();
            }
          },
        });
      });
  }
}
