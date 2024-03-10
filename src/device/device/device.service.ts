import {
  BadRequestException,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Device, DeviceDocument } from './device.schemas';
import { FilterQuery, Model } from 'mongoose';
import { Event } from './event.schemas';
import { Pagination } from 'src/lib/decorators/pagination.decorator';
import { SortFilters } from 'src/lib/decorators/sort-filters.decorators';
import { PaginatedResults } from '../../lib/decorators/pagination.decorator';
import { KeycloakAdminService } from 'src/keycloak/keycloak-admin/keycloak-admin.service';
import CredentialRepresentation from '@keycloak/keycloak-admin-client/lib/defs/credentialRepresentation';
import { UpdateDeviceDto } from 'src/lib/dto/update-device.dto';
import { CustomerService } from 'src/customer/customer/customer.service';
import { VehicleService } from 'src/vehicle/vehicle/vehicle.service';
import { v4 as uuid } from 'uuid';
import { CreateDeviceDto } from 'src/lib/dto/create-device.dto';
import { DeviceStatus } from 'src/lib/interfaces/device-status.enum';
import { MongooseJoinable } from 'src/lib/interfaces/mongoose-joinable.interface';
import { DataTransmission } from './data-transmission';
import { DataScoring } from './data-scoring';
import { DeviceSession } from 'src/device-session/device-session/device-session.schemas';
import { EventCategory } from './event-category.enum';
import { EventLevel } from './event-level.enum';
import { ContractService } from 'src/contract/contract/contract.service';

@Injectable()
export class DeviceService implements MongooseJoinable {
  constructor(
    @InjectModel(Device.name)
    private readonly deviceModel: Model<Device>,
    @InjectModel(Event.name)
    private readonly eventModel: Model<Event>,
    @InjectModel(DataTransmission.name)
    private readonly dataTransmissionModel: Model<DataTransmission>,
    @InjectModel(DataScoring.name)
    private readonly dataScoringModel: Model<DataScoring>,
    @InjectModel(DeviceSession.name)
    private readonly deviceSessionModel: Model<DeviceSession>,
    @Inject(forwardRef(() => KeycloakAdminService))
    private keycloakAdminService: KeycloakAdminService,
    @Inject(forwardRef(() => CustomerService))
    private readonly customerService: CustomerService,
    @Inject(forwardRef(() => VehicleService))
    private readonly vehicleService: VehicleService,
    @Inject(forwardRef(() => ContractService))
    private readonly contractService: ContractService,
  ) {}

  getCollectionName(): string {
    return this.deviceModel.collection.name;
  }

  exists(filters: FilterQuery<Device>) {
    return this.deviceModel.exists(filters);
  }

  async findLastCreated() {
    return this.deviceModel.findOne().limit(1).sort({
      createdAt: -1,
    });
  }

  findOne(
    filters: FilterQuery<Device>,
    populate: string[] = [],
  ): Promise<DeviceDocument> {
    if (populate.length) {
      return this.deviceModel.findOne(filters).populate(populate);
    } else {
      return this.deviceModel.findOne(filters);
    }
  }

  async findAll(
    filters: FilterQuery<Device>,
    pagination: Pagination,
    sortFilters: SortFilters,
  ): Promise<PaginatedResults<DeviceDocument>> {
    const results = await this.deviceModel
      .aggregate([
        {
          $match: filters,
        },
        {
          $lookup: {
            from: this.customerService.getCollectionName(),
            localField: 'customer',
            foreignField: '_id',
            as: 'customers',
          },
        },
        {
          $lookup: {
            from: this.vehicleService.getCollectionName(),
            localField: 'vehicle',
            foreignField: '_id',
            as: 'vehicles',
          },
        },
        {
          $lookup: {
            from: this.dataScoringModel.collection.name,
            localField: '_id',
            foreignField: 'device',
            as: 'dataScorings',
            pipeline: [
              {
                $count: 'count',
              },
            ],
          },
        },
        {
          $lookup: {
            from: this.eventModel.collection.name,
            localField: '_id',
            foreignField: 'device',
            as: 'events',
            pipeline: [
              {
                $count: 'count',
              },
            ],
          },
        },
        {
          $lookup: {
            from: this.deviceSessionModel.collection.name,
            localField: '_id',
            foreignField: 'device',
            as: 'lastSessions',
            pipeline: [
              {
                $sort: { createdAt: -1 },
              },
              {
                $limit: 1,
              },
            ],
          },
        },
        {
          $lookup: {
            from: this.dataTransmissionModel.collection.name,
            localField: '_id',
            foreignField: 'device',
            as: 'dataTransmissions',
            pipeline: [
              {
                $count: 'count',
              },
            ],
          },
        },
        {
          $addFields: {
            vehicle: { $arrayElemAt: ['$vehicles', 0] },
            customer: { $arrayElemAt: ['$customers', 0] },
            dataTransmissionStat: { $arrayElemAt: ['$dataTransmissions', 0] },
            dataScoringStat: { $arrayElemAt: ['$dataScorings', 0] },
            eventStat: { $arrayElemAt: ['$events', 0] },
          },
        },
        {
          $project: {
            vehicles: 0,
            dataTransmissions: 0,
            dataScorings: 0,
            customers: 0,
          },
        },
        {
          $sort: {
            [sortFilters.sort]: sortFilters.order,
          },
        } as any,
        {
          $skip: pagination.start,
        },
        {
          $limit: pagination.limit,
        },
      ])
      .exec();

    const count = await this.deviceModel.aggregate([
      {
        $match: filters,
      },
      {
        $count: 'count',
      },
    ]);

    return {
      results,
      count: count[0]?.count || 0,
      start: pagination.start,
      limit: pagination.limit,
    };
  }

  async create(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _createDeviceDto: CreateDeviceDto,
  ): Promise<{
    credentials: CredentialRepresentation;
    device: DeviceDocument;
  }> {
    const deviceId = uuid();
    const credentials =
      await this.keycloakAdminService.createDeviceClientWithRole(
        process.env.KEYCLOAK_REALM_NAME,
        deviceId,
        process.env.KEYCLOAK_DEVICE_ROLE_NAME,
      );
    const newDevice = new this.deviceModel({
      _id: deviceId,
      authorizationServerClientId: credentials.id,
      serialNumber: _createDeviceDto.serialNumber,
    });
    await newDevice.save();
    return { device: newDevice, credentials };
  }

  async logDeviceEvent(
    deviceId: string,
    category: EventCategory,
    level: EventLevel,
    metadata: any = {},
  ) {
    const newDeviceEvent = new this.eventModel({
      category,
      device: deviceId,
      level,
      metadata,
    });
    await newDeviceEvent.save();
  }

  async update(deviceId: string, updateDeviceDto: UpdateDeviceDto) {
    const errors = [];
    const device = await this.findOne({ _id: deviceId });
    if (updateDeviceDto.customer) {
      const customerExists = await this.customerService.exists({
        _id: updateDeviceDto.customer,
      });
      if (!customerExists) {
        errors.push(`customer ${updateDeviceDto.customer} must exists`);
      }
    }

    if (updateDeviceDto.vehicle) {
      const vehicleExists = await this.vehicleService.exists({
        _id: updateDeviceDto.vehicle,
      });
      if (!vehicleExists) {
        errors.push(`vehicle ${updateDeviceDto.vehicle} must exists`);
      }
    }

    if (updateDeviceDto.contract) {
      const contractExists = await this.contractService.exists({
        _id: updateDeviceDto.contract,
      });
      if (!contractExists) {
        errors.push(`contract ${updateDeviceDto.contract} must exists`);
      }
    }

    if (!device) {
      errors.push(`device ${deviceId} must exists`);
    }
    if (errors.length) {
      throw new BadRequestException(errors.join(', '));
    }

    Object.assign(device, updateDeviceDto);
    let updatedDevice = await device.save();

    if (
      updatedDevice.vehicle &&
      updateDeviceDto.customer &&
      updateDeviceDto.contract
    ) {
      updatedDevice.status = DeviceStatus.PAIRED;
      updatedDevice.pairingDate = new Date();
      updatedDevice = await updatedDevice.save();
    }
    return updatedDevice;
  }

  async disable(deviceId: string): Promise<DeviceDocument> {
    const errors = [];
    const device = await this.findOne({ _id: deviceId });
    if (!device) {
      errors.push(`device ${deviceId} must exists`);
    }
    if (errors.length) {
      throw new BadRequestException(errors.join(', '));
    }
    await this.keycloakAdminService.disableDeviceClient(
      device.authorizationServerClientId,
      process.env.KEYCLOAK_DEVICE_ROLE_NAME,
    );
    device.status = DeviceStatus.DISABLED;
    device.pairingDate = null;
    return await device.save();
  }

  async enable(deviceId: string): Promise<DeviceDocument> {
    const errors = [];
    const device = await this.findOne({ _id: deviceId });
    if (!device) {
      errors.push(`device ${deviceId} must exists`);
    }
    if (errors.length) {
      throw new BadRequestException(errors.join(', '));
    }
    await this.keycloakAdminService.enableDeviceClient(
      device.authorizationServerClientId,
      process.env.KEYCLOAK_DEVICE_ROLE_NAME,
    );
    if (device.vehicle && device.customer) {
      device.status = DeviceStatus.PAIRED;
      device.pairingDate = new Date();
    } else {
      device.status = DeviceStatus.INACTIVE;
    }
    return await device.save();
  }

  async delete(deviceId: string): Promise<void> {
    const device = await this.findOne({ _id: deviceId });
    if (!device) {
      throw new BadRequestException(`device ${deviceId} must exists`);
    }
    await this.keycloakAdminService.deleteDeviceClient(
      device.authorizationServerClientId,
    );
    await this.deleteBy({
      _id: deviceId,
    });
  }

  async deleteBy(filters: FilterQuery<Device>) {
    await this.deviceModel.deleteMany(filters);
  }
}
