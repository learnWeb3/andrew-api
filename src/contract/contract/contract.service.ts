import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { FilterQuery, Model } from 'mongoose';
import { Contract, ContractDocument } from './contract.schemas';
import { InjectModel } from '@nestjs/mongoose';
import {
  PaginatedResults,
  Pagination,
} from 'src/lib/decorators/pagination.decorator';
import { SortFilters } from 'src/lib/decorators/sort-filters.decorators';
import { DeviceService } from 'src/device/device/device.service';
import { VehicleService } from 'src/vehicle/vehicle/vehicle.service';
import { CreateContractDto } from 'src/lib/dto/create-contract.dto';
import { VehicleDocument } from 'src/vehicle/vehicle/vehicle.schema';
import { DeviceDocument } from 'src/device/device/device.schemas';
import { CustomerService } from 'src/customer/customer/customer.service';
import { UpdateContractDto } from 'src/lib/dto/update-contract.dto';
import { MongooseJoinable } from 'src/lib/interfaces/mongoose-joinable.interface';
import { ObjectStorageService } from 'src/object-storage/object-storage/object-storage.service';
import { generateSequentialReference } from 'src/lib/helpers/generate-sequential-reference.helper';
import { EcommerceService } from 'src/ecommerce/ecommerce/ecommerce.service';
import { EcommerceGateway } from 'src/lib/interfaces/ecommerce-gateway.enum';
import { ContractStatus } from 'src/lib/interfaces/contract-status.enum';
import { OpensearchService } from 'src/opensearch/opensearch/opensearch.service';

@Injectable()
export class ContractService implements MongooseJoinable {
  constructor(
    @InjectModel(Contract.name)
    private readonly contractModel: Model<Contract>,
    @Inject(forwardRef(() => CustomerService))
    private readonly customerService: CustomerService,
    @Inject(forwardRef(() => VehicleService))
    private readonly vehicleService: VehicleService,
    @Inject(forwardRef(() => DeviceService))
    private readonly deviceService: DeviceService,
    @Inject(forwardRef(() => EcommerceService))
    private readonly ecommerceService: EcommerceService,
    @Inject(forwardRef(() => ObjectStorageService))
    private readonly objectStorageService: ObjectStorageService,
    @Inject(forwardRef(() => OpensearchService))
    private readonly opensearchService: OpensearchService,
  ) {}

  getCollectionName() {
    return this.contractModel.collection.name;
  }

  exists(filters: FilterQuery<Contract>) {
    return this.contractModel.exists(filters);
  }

  async handleDiscounts(periodStart: number, periodEnd: number) {
    const limit = 10;
    let start = 0;
    let data = await this.findAll(
      {
        status: ContractStatus.ACTIVE,
      },
      { start, limit },
      {
        order: -1,
        sort: 'createdAt',
      },
    );

    // fetch active contracts in batch of ten to avoid loading everything into memory
    while (data.results.length) {
      data = await this.findAll(
        {
          status: ContractStatus.ACTIVE,
        },
        { start: start + limit, limit },
        {
          order: -1,
          sort: 'createdAt',
        },
      );

      // loop through paginated contracts
      for (const contract of data.results) {
        // get customer
        const customer = await this.customerService.findOne({
          _id: contract.customer,
        });

        // check ecommerceCustomer is set
        if (customer?.paymentInformations?.ecommerceCustomer) {
          const contractVehicles = await this.findOneVehicles(
            contract._id,
            {},
            { start: 0, limit: Number.MAX_SAFE_INTEGER },
            {
              order: -1,
              sort: 'createdAt',
            },
          ).then(({ results }) => results);

          // get the avg driver behaviour class
          const contractVehiclesAvgDriverBehaviourClassInt: number[] =
            await Promise.all(
              contractVehicles.map(async (vehicle) => {
                return await this.opensearchService.getAverageDriverBehaviourClassInt(
                  vehicle.vin,
                  periodStart,
                  periodEnd,
                );
              }),
            );

          // sum all the avgDriverBehaviourClassInt of each contract vehicles to have a global discount for the contract
          const avgDriverBehaviourClassInt =
            contractVehiclesAvgDriverBehaviourClassInt.reduce(
              (sum, _avgDriverBehaviourClassInt) =>
                (sum += _avgDriverBehaviourClassInt),
              0,
            ) / contractVehiclesAvgDriverBehaviourClassInt.length;

          // avgDriverBehaviourClassInt is a number between 50 (worst scoring aka K class) and 100(best scoring aka A class)
          const discountPercent = avgDriverBehaviourClassInt - 50;
          if (discountPercent > 0) {
            // apply subscription in ecommerce service
            await this.ecommerceService.applySubscriptionDiscount(
              customer.paymentInformations.ecommerceCustomer,
              contract._id,
              discountPercent,
              EcommerceGateway.STRIPE,
            );
          }
        }
      }

      start = start + limit;
    }
  }

  async handlePaymentError(contractId: string) {
    const contract = await this.contractModel.findOne({ _id: contractId });
    if (!contract) {
      throw new BadRequestException(`contract does not exists`);
    }
    return await this.cancel(
      { _id: contractId },
      ContractStatus.PAYMENT_RENEWAL_ERROR,
    );
  }

  async updatePaymentInformations(
    filters: FilterQuery<Contract>,
  ): Promise<{ id: string; url: string }> {
    const contract = await this.contractModel.findOne(filters);
    if (!contract) {
      throw new BadRequestException(`contract does not exists`);
    }
    const customer = await this.customerService.findOne({
      _id: contract.customer,
    });

    if (!customer) {
      throw new BadRequestException(`customer does not exists`);
    }

    const vehicles = await this.findOneVehicles(
      contract._id,
      {},
      { start: 0, limit: Number.MAX_SAFE_INTEGER },
      {
        order: -1,
        sort: 'createdAt',
      },
    ).then(({ results }) => results);

    const { url } = await this.ecommerceService.createPaymentCheckoutUrl(
      customer.contactInformations.email,
      contract.ecommerceProduct,
      vehicles.length,
      {
        contract: contract._id,
      },
      EcommerceGateway.STRIPE,
    );

    contract.status = ContractStatus.PAYMENT_PENDING;
    contract.ecommerceCheckoutURL = url;
    const updatedContract = await contract.save();
    return {
      id: updatedContract._id,
      url,
    };
  }

  async cancel(
    filters: FilterQuery<Contract>,
    cancelationStatus: ContractStatus,
  ) {
    const contract = await this.contractModel.findOne(filters);
    if (!contract) {
      throw new BadRequestException(`contract does not exists`);
    }
    const customer = await this.customerService.findOne({
      _id: contract.customer,
    });

    if (!customer) {
      throw new BadRequestException(`customer does not exists`);
    }

    await this.ecommerceService.cancelSubscription(
      customer.paymentInformations.ecommerceCustomer,
      contract._id,
      EcommerceGateway.STRIPE,
    );

    contract.status = cancelationStatus;
    return await contract.save();
  }

  async findOne(filters: FilterQuery<Contract>): Promise<ContractDocument> {
    const contractExists = await this.exists(filters);
    if (!contractExists) {
      throw new NotFoundException(`contract does not exists`);
    }
    return this.contractModel.findOne(filters);
  }

  async findAll(
    filters: FilterQuery<Contract>,
    pagination: Pagination,
    sortFilters: SortFilters,
  ): Promise<PaginatedResults<ContractDocument>> {
    const results = await this.contractModel
      .aggregate([
        {
          $match: filters,
        },
        {
          $lookup: {
            from: this.vehicleService.getCollectionName(),
            localField: '_id',
            foreignField: 'vehicle',
            as: 'vehicles',
            pipeline: [
              {
                $count: 'count',
              },
            ],
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

    const count = await this.contractModel.aggregate([
      {
        $match: filters,
      },
      {
        $count: 'count',
      },
    ]);

    return {
      results,
      count: count?.[0]?.count || 0,
      start: pagination.start,
      limit: pagination.limit,
    };
  }

  async findOneVehicles(
    contractId: string,
    filters: FilterQuery<Contract>,
    pagination: Pagination,
    sortFilters: SortFilters,
  ): Promise<PaginatedResults<VehicleDocument>> {
    const contractExists = await this.exists({
      _id: contractId,
    });
    if (!contractExists) {
      throw new BadRequestException(`contract ${contractId} must exists`);
    }
    return this.vehicleService.findAll(filters, pagination, sortFilters);
  }

  async findOneDevices(
    contractId: string,
    filters: FilterQuery<Contract>,
    pagination: Pagination,
    sortFilters: SortFilters,
  ): Promise<PaginatedResults<DeviceDocument>> {
    const contractExists = await this.exists({
      _id: contractId,
    });
    if (!contractExists) {
      throw new BadRequestException(`contract ${contractId} must exists`);
    }
    return this.deviceService.findAll(filters, pagination, sortFilters);
  }

  async findLastCreated() {
    return this.contractModel.findOne().limit(1).sort({
      createdAt: -1,
    });
  }

  async updateSubscription(
    contractId: string,
    subscriptionId: string,
  ): Promise<ContractDocument> {
    const errors = [];

    const contract = await this.findOne({ _id: contractId });
    if (!contract) {
      errors.push(`contract ${contractId} must exists`);
    }
    if (errors.length) {
      throw new BadRequestException(errors.join(', '));
    }
    contract.ecommerceSubscription = subscriptionId;

    return await contract.save();
  }

  async create(createContractDto: CreateContractDto): Promise<{ _id: string }> {
    const errors = [];
    const customerExists = await this.customerService.exists({
      _id: createContractDto.customer,
    });
    if (!customerExists) {
      errors.push(`customer ${createContractDto.customer} must exists`);
    }
    const { errors: productErrors } = await this.validateProductExists(
      createContractDto.ecommerceProduct,
      createContractDto.ecommerceGateway,
    );
    errors.push(...productErrors);
    if (errors.length) {
      throw new BadRequestException(errors.join(', '));
    }
    const lastCreatedContract = await this.findLastCreated();
    const newContract = new this.contractModel({
      ...createContractDto,
      ref: generateSequentialReference(lastCreatedContract?.ref || null),
    });
    const savedContract = await newContract.save();
    return { _id: savedContract._id };
  }

  async validateProductExists(
    ecommerceProduct: string,
    ecommerceGateway: EcommerceGateway,
  ): Promise<{ errors: string[] }> {
    const errors = [];
    const data = await this.ecommerceService.findOneProduct(
      ecommerceProduct,
      ecommerceGateway,
    );
    if (!data) {
      errors.push(
        `product with ${ecommerceProduct} for gateway ${ecommerceGateway} does not exists`,
      );
    }
    return { errors };
  }

  async validateDocExists(options: {
    contractDocURL?: string;
  }): Promise<{ errors: string[] }> {
    const errors = [];

    if (options.contractDocURL) {
      const exists = await this.objectStorageService.checkExists(
        options.contractDocURL,
      );
      if (!exists) {
        errors.push(
          `object-storage file contractDocURL must exists, must have been uploaded through presigned url`,
        );
      }
    }

    return { errors };
  }

  async update(
    contractId: string,
    updateContractDto: UpdateContractDto,
  ): Promise<ContractDocument> {
    const errors = [];
    const customerExists = await this.customerService.exists({
      _id: updateContractDto.customer,
    });
    if (!customerExists) {
      errors.push(`customer ${updateContractDto.customer} must exists`);
    }
    const contract = await this.findOne({ _id: contractId });
    if (!contract) {
      errors.push(`contract ${contractId} must exists`);
    }

    const { errors: documentErrors } = await this.validateDocExists({
      contractDocURL: updateContractDto?.contractDocURL || null,
    });

    errors.push(...documentErrors);

    if (errors.length) {
      throw new BadRequestException(errors.join(', '));
    }

    Object.assign(contract, updateContractDto);

    return await contract.save();
  }

  async delete(contractId: string): Promise<void> {
    const contractExists = await this.exists({
      _id: contractId,
    });
    if (!contractExists) {
      throw new BadRequestException(`contract ${contractId} must exists`);
    }

    await this.deleteRelated(contractId);

    await this.deleteBy({
      _id: contractId,
    });
  }

  async deleteRelated(contractId: string) {
    const relatedVehiclesIds = await this.vehicleService
      .findAll(
        {
          contract: contractId,
        },
        { start: 0, limit: Infinity },
        { sort: 'createdAt', order: -1 },
      )
      .then(({ results }) => results.map(({ _id }) => _id));
    const relatedDevicesIds = await this.deviceService
      .findAll(
        {
          vehicle: { $in: relatedVehiclesIds },
        },
        { start: 0, limit: Infinity },
        { sort: 'createdAt', order: -1 },
      )
      .then(({ results }) => results.map(({ _id }) => _id));

    for (const relatedDeviceId of relatedDevicesIds) {
      await this.deviceService.delete(relatedDeviceId);
    }
    await this.vehicleService.deleteBy({
      contract: contractId,
    });
  }

  async deleteBy(filters: FilterQuery<Contract>) {
    await this.contractModel.deleteMany(filters);
  }
}
