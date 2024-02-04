import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { FilterQuery, Model } from 'mongoose';
import { Customer, CustomerDocument } from './customer.schemas';
import { InjectModel } from '@nestjs/mongoose';
import {
  PaginatedResults,
  Pagination,
} from 'src/lib/decorators/pagination.decorator';
import { SortFilters } from 'src/lib/decorators/sort-filters.decorators';
import { ContractService } from 'src/contract/contract/contract.service';
import { VehicleService } from 'src/vehicle/vehicle/vehicle.service';
import { DeviceService } from 'src/device/device/device.service';
import { CreateCustomerDto } from 'src/lib/dto/create-customer.dto';
import {
  Contract,
  ContractDocument,
} from 'src/contract/contract/contract.schemas';
import { Vehicle, VehicleDocument } from 'src/vehicle/vehicle/vehicle.schema';
import { Device, DeviceDocument } from 'src/device/device/device.schemas';
import { UpdateCustomerDto } from 'src/lib/dto/update-customer.dto';
import { KeycloakAdminService } from 'src/keycloak/keycloak-admin/keycloak-admin.service';
import { CreateThirdPartyAccountDto } from 'src/lib/dto/create-third-party-account.dto';
import { MongooseJoinable } from 'src/lib/interfaces/mongoose-joinable.interface';
import { ObjectStorageService } from 'src/object-storage/object-storage/object-storage.service';
import { EcommerceService } from 'src/ecommerce/ecommerce/ecommerce.service';
import { EcommerceGateway } from 'src/lib/interfaces/ecommerce-gateway.enum';
import { SubscriptionApplicationDocument } from 'src/subscription-application/subscription-application/subscription-application.schemas';
import { SubscriptionApplicationService } from 'src/subscription-application/subscription-application/subscription-application.service';

@Injectable()
export class CustomerService implements MongooseJoinable {
  constructor(
    @InjectModel(Customer.name)
    private readonly customerModel: Model<Customer>,
    @Inject(forwardRef(() => ContractService))
    private readonly contractService: ContractService,
    @Inject(forwardRef(() => VehicleService))
    private readonly vehicleService: VehicleService,
    @Inject(forwardRef(() => DeviceService))
    private readonly deviceService: DeviceService,
    @Inject(forwardRef(() => SubscriptionApplicationService))
    private readonly subscriptionApplicationService: SubscriptionApplicationService,
    @Inject(forwardRef(() => KeycloakAdminService))
    private readonly keycloakAdminService: KeycloakAdminService,
    @Inject(forwardRef(() => ObjectStorageService))
    private readonly objectStorageService: ObjectStorageService,
    @Inject(forwardRef(() => EcommerceService))
    private readonly ecommerceService: EcommerceService,
  ) {}

  exists(filters: FilterQuery<Customer>) {
    return this.customerModel.exists(filters);
  }

  findOne(filters: FilterQuery<Customer>): Promise<CustomerDocument> {
    return this.customerModel.findOne(filters);
  }

  getCollectionName(): string {
    return this.customerModel.collection.name;
  }

  async findAll(
    filters: FilterQuery<Customer>,
    pagination: Pagination,
    sortFilters: SortFilters,
  ): Promise<PaginatedResults<CustomerDocument>> {
    const results = await this.customerModel
      .aggregate([
        {
          $match: filters,
        },
        {
          $lookup: {
            from: this.contractService.getCollectionName(),
            localField: '_id',
            foreignField: 'customer',
            as: 'contracts',
            pipeline: [
              {
                $count: 'count',
              },
            ],
          },
        },
        {
          $addFields: {
            discount: { $arrayElemAt: ['$discounts', 0] },
          },
        },
        {
          $project: {
            discounts: 0,
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

    const count = await this.customerModel.aggregate([
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

  async findOneContracts(
    customerId: string,
    filters: FilterQuery<Contract>,
    pagination: Pagination,
    sortFilters: SortFilters,
  ): Promise<PaginatedResults<ContractDocument>> {
    const customerExists = await this.exists({ _id: customerId });
    if (!customerExists) {
      throw new BadRequestException(`customer ${customerId} must exists`);
    }
    return this.contractService.findAll(filters, pagination, sortFilters);
  }

  async findOneSubscriptionApplications(
    customerId: string,
    filters: FilterQuery<Vehicle>,
    pagination: Pagination,
    sortFilters: SortFilters,
  ): Promise<PaginatedResults<SubscriptionApplicationDocument>> {
    const customerExists = await this.exists({ _id: customerId });
    if (!customerExists) {
      throw new BadRequestException(`customer ${customerId} must exists`);
    }
    return this.subscriptionApplicationService.findAll(
      filters,
      pagination,
      sortFilters,
    );
  }

  async findOneVehicles(
    customerId: string,
    filters: FilterQuery<Vehicle>,
    pagination: Pagination,
    sortFilters: SortFilters,
  ): Promise<PaginatedResults<VehicleDocument>> {
    const customerExists = await this.exists({ _id: customerId });
    if (!customerExists) {
      throw new BadRequestException(`customer ${customerId} must exists`);
    }
    return this.vehicleService.findAll(filters, pagination, sortFilters);
  }

  async findOneDevices(
    customerId: string,
    filters: FilterQuery<Device>,
    pagination: Pagination,
    sortFilters: SortFilters,
  ): Promise<PaginatedResults<DeviceDocument>> {
    const customerExists = await this.exists({ _id: customerId });
    if (!customerExists) {
      throw new BadRequestException(`customer ${customerId} must exists`);
    }
    return this.deviceService.findAll(filters, pagination, sortFilters);
  }

  async create(createCustomerDto: CreateCustomerDto): Promise<{ _id: string }> {
    const user = await this.findOne({
      authorizationServerUserId: createCustomerDto.authorizationServerUserId,
    });
    if (user) {
      return { _id: user._id };
    }
    const ecommerceCustomer = await this.ecommerceService.createCustomer(
      createCustomerDto.email,
      createCustomerDto.fullName,
      EcommerceGateway.STRIPE,
    );
    const newCustomer = new this.customerModel({
      authorizationServerUserId: createCustomerDto.authorizationServerUserId,
      contactInformations: {
        email: createCustomerDto.email,
      },
      paymentInformations: {
        ecommerceCustomer: ecommerceCustomer.id,
      },
      insurer: false,
      firstName: createCustomerDto.firstName,
      lastName: createCustomerDto.lastName,
      fullName: createCustomerDto.fullName,
    });
    const savedCustomer = await newCustomer.save();
    return { _id: savedCustomer._id };
  }

  async createThirdPartyAccount(
    createThirdPartyAccountDto: CreateThirdPartyAccountDto,
  ) {
    const exists = await this.exists({
      email: createThirdPartyAccountDto.email,
    });
    if (exists) {
      throw new ConflictException(`account already exists`);
    }

    const { id: authorizationServerUserId, password } =
      await this.keycloakAdminService.createUser(
        {
          firstName: createThirdPartyAccountDto.firstName,
          lastName: createThirdPartyAccountDto.lastName,
          email: createThirdPartyAccountDto.email,
        },
        createThirdPartyAccountDto.insurer,
      );

    const ecommerceCustomer = await this.ecommerceService.createCustomer(
      createThirdPartyAccountDto.email,
      `${createThirdPartyAccountDto.firstName} ${createThirdPartyAccountDto.lastName}`,
      EcommerceGateway.STRIPE,
    );

    const newCustomer = new this.customerModel({
      authorizationServerUserId,
      contactInformations: {
        email: createThirdPartyAccountDto.email,
      },
      paymentInformations: {
        ecommerceCustomer: ecommerceCustomer.id,
      },
      insurer: createThirdPartyAccountDto.insurer,
      firstName: createThirdPartyAccountDto.firstName,
      lastName: createThirdPartyAccountDto.lastName,
      fullName: `${createThirdPartyAccountDto.firstName} ${createThirdPartyAccountDto.lastName}`,
    });

    const savedCustomer = await newCustomer.save();
    return { _id: savedCustomer._id, password };
  }

  async validateDocExists(options: {
    termsOfSaleDocURL?: string;
    idCardDocURL?: string;
    residencyProofDocURL?: string;
  }): Promise<{ errors: string[] }> {
    const errors = [];

    if (options?.termsOfSaleDocURL) {
      const exists = await this.objectStorageService.checkExists(
        options.termsOfSaleDocURL,
      );
      if (!exists) {
        errors.push(
          `object-storage file termsOfSaleDocURL must exists, must have been uploaded through presigned url`,
        );
      }
    }
    if (options?.idCardDocURL) {
      const exists = await this.objectStorageService.checkExists(
        options.idCardDocURL,
      );
      if (!exists) {
        errors.push(
          `object-storage file idCardDocURL must exists, must have been uploaded through presigned url`,
        );
      }
    }
    if (options?.residencyProofDocURL) {
      const exists = await this.objectStorageService.checkExists(
        options.residencyProofDocURL,
      );
      if (!exists) {
        errors.push(
          `object-storage file residencyProofDocURL must exists, must have been uploaded through presigned url`,
        );
      }
    }

    return { errors };
  }

  async update(customerId: string, updateCustomerDto: UpdateCustomerDto) {
    const errors = [];
    const customer = await this.findOne({ _id: customerId });
    if (!customer) {
      throw new BadRequestException(`customer ${customerId} must exists`);
    }

    const {
      contactInformations,
      billingInformations,
      paymentInformations,
      identityDocs,
      paymentDocs,
      ...rest
    } = updateCustomerDto;

    const { errors: documentErrors } = await this.validateDocExists({
      idCardDocURL: identityDocs?.idCardDocURL || null,
      termsOfSaleDocURL: paymentDocs?.termsOfSaleDocURL || null,
      residencyProofDocURL: identityDocs?.residencyProofDocURL || null,
    });

    errors.push(...documentErrors);

    if (errors.length) {
      throw new BadRequestException(errors.join(', '));
    }

    Object.assign(customer, rest);

    if (customer.contactInformations && contactInformations) {
      Object.assign(customer.contactInformations, contactInformations);
    } else if (!customer.contactInformations && contactInformations) {
      customer.contactInformations = {
        ...contactInformations,
      };
    }
    if (customer.billingInformations && billingInformations) {
      Object.assign(customer.billingInformations, billingInformations);
    } else if (!customer.billingInformations && billingInformations) {
      customer.billingInformations = {
        ...billingInformations,
      };
    }
    if (customer.paymentInformations && paymentInformations) {
      Object.assign(customer.paymentInformations, paymentInformations);
    } else if (!customer.paymentInformations && paymentInformations) {
      customer.paymentInformations = {
        ...paymentInformations,
      };
    }

    if (customer.identityDocs && identityDocs) {
      Object.assign(customer.identityDocs, identityDocs);
    } else if (!customer.identityDocs && identityDocs) {
      customer.identityDocs = {
        ...identityDocs,
      };
    }
    if (customer.paymentDocs && paymentDocs) {
      Object.assign(customer.paymentDocs, paymentDocs);
    } else if (!customer.paymentDocs && paymentDocs) {
      customer.paymentDocs = {
        ...paymentDocs,
      };
    }

    return await customer.save();
  }

  async delete(customerId: string): Promise<void> {
    const customer = await this.findOne({ _id: customerId });
    if (!customer) {
      throw new BadRequestException(`customer ${customerId} must exists`);
    }

    await this.deleteRelated(customerId);

    await this.deleteBy({
      _id: customerId,
    });
  }

  async deleteRelated(customerId: string) {
    const relatedDevicesIds = await this.deviceService
      .findAll(
        {
          customer: customerId,
        },
        { start: 0, limit: Infinity },
        { sort: 'createdAt', order: -1 },
      )
      .then(({ results }) => results.map(({ _id }) => _id));

    for (const relatedDeviceId of relatedDevicesIds) {
      await this.deviceService.delete(relatedDeviceId);
    }
    await this.vehicleService.deleteBy({
      customer: customerId,
    });

    await this.contractService.deleteBy({
      customer: customerId,
    });
  }

  async deleteBy(filters: FilterQuery<Customer>) {
    await this.customerModel.deleteMany(filters);
  }
}
