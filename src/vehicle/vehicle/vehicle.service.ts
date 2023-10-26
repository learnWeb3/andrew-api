import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { FilterQuery, Model } from 'mongoose';
import { Vehicle } from './vehicle.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Pagination } from 'src/lib/decorators/pagination.decorator';
import { SortFilters } from 'src/lib/decorators/sort-filters.decorators';
import { paginateMongooseQuery } from 'src/lib/helpers/paginate-mongoose-query.helper';
import { PaginatedResults } from '../../lib/decorators/pagination.decorator';
import { VehicleDocument } from 'src/vehicle/vehicle/vehicle.schema';
import { CreateVehicleDto } from 'src/lib/dto/create-vehicle.dto';
import { UpdateVehicleDto } from 'src/lib/dto/update-vehicle.dto';
import { CustomerService } from 'src/customer/customer/customer.service';
import { ContractService } from 'src/contract/contract/contract.service';
import { DeviceService } from 'src/device/device/device.service';
import { OpensearchService } from 'src/opensearch/opensearch/opensearch.service';
import { Device, DeviceDocument } from 'src/device/device/device.schemas';
import { MongooseJoinable } from 'src/lib/interfaces/mongoose-joinable.interface';
import { ObjectStorageService } from 'src/object-storage/object-storage/object-storage.service';

@Injectable()
export class VehicleService implements MongooseJoinable {
  constructor(
    @InjectModel(Vehicle.name)
    private readonly vehicleModel: Model<Vehicle>,
    @Inject(forwardRef(() => CustomerService))
    private readonly customerService: CustomerService,
    @Inject(forwardRef(() => ContractService))
    private readonly contractService: ContractService,
    @Inject(forwardRef(() => DeviceService))
    private readonly deviceService: DeviceService,
    @Inject(forwardRef(() => OpensearchService))
    private readonly opensearchService: OpensearchService,
    @Inject(forwardRef(() => ObjectStorageService))
    private readonly objectStorageService: ObjectStorageService,
  ) {}

  getCollectionName(): string {
    return this.vehicleModel.collection.name;
  }

  exists(filters: FilterQuery<Vehicle>) {
    return this.vehicleModel.exists(filters);
  }

  async findOne(filters: FilterQuery<Vehicle>): Promise<VehicleDocument> {
    const vehicleExists = await this.exists(filters);
    if (!vehicleExists) {
      throw new NotFoundException(`vehicle does not exists`);
    }
    return this.vehicleModel.findOne(filters);
  }

  findAll(
    filters: FilterQuery<Vehicle>,
    pagination: Pagination,
    sortFilters: SortFilters,
  ): Promise<PaginatedResults<VehicleDocument>> {
    return paginateMongooseQuery<Vehicle>(
      this.vehicleModel,
      filters,
      pagination,
      sortFilters,
    );
  }

  async findOneDevices(
    vehicleId: string,
    filters: FilterQuery<Device>,
    pagination: Pagination,
    sortFilters: SortFilters,
  ): Promise<PaginatedResults<DeviceDocument>> {
    const contractExists = await this.exists({
      _id: vehicleId,
    });
    if (!contractExists) {
      throw new BadRequestException(`vehicle ${vehicleId} must exists`);
    }
    return this.deviceService.findAll(filters, pagination, sortFilters);
  }

  async create(createVehicleDto: CreateVehicleDto): Promise<{ _id: string }> {
    const errors = [];
    const customerExists = await this.customerService.exists({
      _id: createVehicleDto.customer,
    });
    const contractExists = await this.contractService.exists({
      _id: createVehicleDto.contract,
    });
    if (!customerExists) {
      errors.push(`customer ${createVehicleDto.customer} must exists`);
    }
    if (!contractExists) {
      errors.push(`contract ${createVehicleDto.contract} must exists`);
    }
    if (errors.length) {
      throw new BadRequestException(errors.join(', '));
    }
    const newVehicle = new this.vehicleModel(createVehicleDto);
    const savedVehicle = await newVehicle.save();
    const customer = await this.customerService.findOne({
      _id: savedVehicle.customer,
    });
    await this.opensearchService.updateACLRights(savedVehicle.vin, [
      customer.authorizationServerUserId,
    ]);
    await this.opensearchService.updateACLReportsRights(savedVehicle.vin, [
      customer.authorizationServerUserId,
    ]);
    return { _id: savedVehicle._id };
  }

  async validateDocExists(options: {
    vehicleRegistrationCardDocURL?: string;
    driverLicenceDocURL?: string;
  }): Promise<{ errors: string[] }> {
    const errors = [];

    if (options.vehicleRegistrationCardDocURL) {
      const exists = await this.objectStorageService.checkExists(
        options.vehicleRegistrationCardDocURL,
      );
      if (!exists) {
        errors.push(
          `object-storage file vehicleRegistrationCardDocURL must exists, must have been uploaded through presigned url`,
        );
      }
    }

    if (options.driverLicenceDocURL) {
      const exists = await this.objectStorageService.checkExists(
        options.driverLicenceDocURL,
      );
      if (!exists) {
        errors.push(
          `object-storage file driverLicenceDocURL must exists, must have been uploaded through presigned url`,
        );
      }
    }

    return { errors };
  }

  async update(
    vehicleId: string,
    updateVehicleDto: UpdateVehicleDto,
  ): Promise<VehicleDocument> {
    const errors = [];
    const vehicle = await this.findOne({ _id: vehicleId });
    if (!vehicle) {
      errors.push(`vehicle ${vehicleId} must exists`);
    }

    const { errors: documentErrors } = await this.validateDocExists({
      vehicleRegistrationCardDocURL:
        updateVehicleDto?.vehicleRegistrationCardDocURL || null,
      driverLicenceDocURL: updateVehicleDto?.driverLicenceDocURL || null,
    });

    errors.push(...documentErrors);

    if (updateVehicleDto.customer) {
      const customerExists = await this.customerService.exists({
        _id: updateVehicleDto.customer,
      });
      if (!customerExists) {
        errors.push(`customer ${updateVehicleDto.customer} must exists`);
      }
    }
    if (updateVehicleDto.contract) {
      const contractExists = await this.contractService.exists({
        _id: updateVehicleDto.contract,
      });
      if (!contractExists) {
        errors.push(`contract ${updateVehicleDto.contract} must exists`);
      }
    }
    if (errors.length) {
      throw new BadRequestException(errors.join(', '));
    }

    Object.assign(vehicle, updateVehicleDto);
    const data = await vehicle.save();

    const customer = await this.customerService.findOne({
      _id: data.customer,
    });

    if (updateVehicleDto.customer) {
      await this.opensearchService.updateACLRights(vehicle.vin, [
        customer.authorizationServerUserId,
      ]);
      await this.opensearchService.updateACLReportsRights(vehicle.vin, [
        customer.authorizationServerUserId,
      ]);
    }

    return data;
  }

  async delete(vehicleId: string): Promise<void> {
    const vehicleExists = await this.exists({
      _id: vehicleId,
    });
    if (!vehicleExists) {
      throw new BadRequestException(`vehicle ${vehicleId} must exists`);
    }
    await this.deleteRelated(vehicleId);
    await this.deleteBy({
      _id: vehicleId,
    });
  }

  async deleteRelated(vehicleId: string) {
    const relatedDevicesIds = await this.deviceService
      .findAll(
        {
          vehicle: vehicleId,
        },
        { start: 0, limit: Infinity },
        { sort: 'createdAt', order: -1 },
      )
      .then(({ results }) => results.map(({ _id }) => _id));

    for (const relatedDeviceId of relatedDevicesIds) {
      await this.deviceService.delete(relatedDeviceId);
    }
  }

  async deleteBy(filters: FilterQuery<Vehicle>) {
    await this.vehicleModel.deleteMany(filters);
  }
}
