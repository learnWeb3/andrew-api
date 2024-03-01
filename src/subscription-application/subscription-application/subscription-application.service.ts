import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { FilterQuery, Model } from 'mongoose';
import {
  SubscriptionApplication,
  SubscriptionApplicationDocument,
} from './subscription-application.schemas';
import {
  PaginatedResults,
  Pagination,
} from 'src/lib/decorators/pagination.decorator';
import { SortFilters } from 'src/lib/decorators/sort-filters.decorators';
import { CreateSubscriptionApplicationDto } from 'src/lib/dto/create-subscription-application.dto';
import {
  FinalizeSubscriptionApplicationDto,
  UpdateSubscriptionApplicationDto,
  UpdateSubscriptionApplicationStatusDto,
} from '../../lib/dto/update-subscription-application.dto';
import { CustomerDocument } from 'src/customer/customer/customer.schemas';
import { SubscriptionApplicationStatus } from 'src/lib/interfaces/subscription-application-status.enum';
import { CustomerService } from 'src/customer/customer/customer.service';
import { ContractService } from 'src/contract/contract/contract.service';
import { VehicleService } from 'src/vehicle/vehicle/vehicle.service';
import { InjectModel } from '@nestjs/mongoose';
import { EcommerceService } from 'src/ecommerce/ecommerce/ecommerce.service';
import { ContractStatus } from 'src/lib/interfaces/contract-status.enum';
import { EcommerceGateway } from 'src/lib/interfaces/ecommerce-gateway.enum';
import { generateSequentialReference } from 'src/lib/helpers/generate-sequential-reference.helper';
import { NotificationService } from 'src/notification/notification/notification.service';
import { NotificationType } from 'src/lib/interfaces/notification-type.enum';

@Injectable()
export class SubscriptionApplicationService {
  constructor(
    @InjectModel(SubscriptionApplication.name)
    private readonly subscriptionApplicationModel: Model<SubscriptionApplication>,
    @Inject(forwardRef(() => CustomerService))
    private readonly customerService: CustomerService,
    @Inject(forwardRef(() => ContractService))
    private readonly contractService: ContractService,
    @Inject(forwardRef(() => VehicleService))
    private readonly vehicleService: VehicleService,
    @Inject(forwardRef(() => EcommerceService))
    private readonly ecommerceService: EcommerceService,
    @Inject(forwardRef(() => NotificationService))
    private readonly notificationService: NotificationService,
  ) {}

  exists(filters: FilterQuery<SubscriptionApplicationDocument>) {
    return this.subscriptionApplicationModel.exists(filters);
  }

  async findLastCreated() {
    return this.subscriptionApplicationModel.findOne().limit(1).sort({
      createdAt: -1,
    });
  }

  async create(
    createSubscriptionApplicationDto: CreateSubscriptionApplicationDto,
  ) {
    const errors = [];
    const customerEntity = await this.customerService.findOne({
      _id: createSubscriptionApplicationDto.customer,
    });

    if (!customerEntity) {
      errors.push(
        `customer with id ${createSubscriptionApplicationDto.customer} deos not exists`,
      );
    }

    // customer documents validation
    if (createSubscriptionApplicationDto?.identityDocs?.idCardDocURL) {
      const { errors: identityDocsErrors } =
        await this.customerService.validateDocExists({
          idCardDocURL:
            createSubscriptionApplicationDto.identityDocs.idCardDocURL,
        });
      errors.push(...identityDocsErrors);
    }

    if (createSubscriptionApplicationDto?.identityDocs?.residencyProofDocURL) {
      const { errors: identityDocsErrors } =
        await this.customerService.validateDocExists({
          residencyProofDocURL:
            createSubscriptionApplicationDto.identityDocs.residencyProofDocURL,
        });
      errors.push(...identityDocsErrors);
    }

    if (createSubscriptionApplicationDto?.paymentDocs?.termsOfSaleDocURL) {
      const { errors: paymentsDocsErrors } =
        await this.customerService.validateDocExists({
          termsOfSaleDocURL:
            createSubscriptionApplicationDto.paymentDocs.termsOfSaleDocURL,
        });
      errors.push(...paymentsDocsErrors);
    }

    // vehicles documents validation
    if (createSubscriptionApplicationDto?.vehicles) {
      for (const vehicle of createSubscriptionApplicationDto.vehicles) {
        const { errors: vehicleDocsErrors } =
          await this.vehicleService.validateDocExists({
            vehicleRegistrationCardDocURL:
              vehicle?.vehicleRegistrationCardDocURL || null,
            driverLicenceDocURL: vehicle?.driverLicenceDocURL || null,
          });

        const vehicleExists = await this.vehicleService.exists({
          vin: vehicle.vin,
        });
        const vehicleExistsErrors: string[] = vehicleExists
          ? [`vehicle exists with VIN ${vehicle.vin}`]
          : [];

        errors.push(...vehicleDocsErrors, ...vehicleExistsErrors);
      }
    }

    // contract documents validation
    if (createSubscriptionApplicationDto?.contract?.contractDocURL) {
      const { errors: contractDocsErrors } =
        await this.contractService.validateDocExists({
          contractDocURL:
            createSubscriptionApplicationDto.contract.contractDocURL,
        });

      errors.push(...contractDocsErrors);
    }
    if (errors.length) {
      throw new BadRequestException(errors.join(', '));
    }

    if (createSubscriptionApplicationDto?.identityDocs) {
      customerEntity.identityDocs =
        createSubscriptionApplicationDto.identityDocs;
    }
    if (createSubscriptionApplicationDto?.paymentDocs) {
      customerEntity.paymentDocs = createSubscriptionApplicationDto.paymentDocs;
    }
    if (createSubscriptionApplicationDto?.contactInformations) {
      customerEntity.contactInformations =
        createSubscriptionApplicationDto.contactInformations;
    }
    if (createSubscriptionApplicationDto.billingInformations) {
      customerEntity.billingInformations =
        createSubscriptionApplicationDto.billingInformations;
    }

    const lastCreatedApplication = await this.findLastCreated();

    const newSubscriptionApplication = new this.subscriptionApplicationModel({
      customer: customerEntity._id,
      status: SubscriptionApplicationStatus.PENDING,
      ref: generateSequentialReference(lastCreatedApplication?.ref || null),
    });

    if (createSubscriptionApplicationDto?.vehicles) {
      newSubscriptionApplication.vehicles =
        createSubscriptionApplicationDto.vehicles;
    }

    if (createSubscriptionApplicationDto?.contract) {
      newSubscriptionApplication.contract = {
        ...createSubscriptionApplicationDto.contract,
        ecommerceGateway: EcommerceGateway.STRIPE,
      };
    }

    const data = await newSubscriptionApplication.save();

    await this.notificationService.createSupervisorNotification({
      type: NotificationType.SUBSCRIPTION_APPLICATION_STATUS_PENDING,
      data,
    });

    return data;
  }

  async update(
    id: string,
    updateSubscriptionApplicationDto: UpdateSubscriptionApplicationDto,
  ): Promise<SubscriptionApplicationDocument & { customer: CustomerDocument }> {
    const errors = [];

    const subscriptionApplication =
      await this.subscriptionApplicationModel.findOne({
        _id: id,
      });

    if (!subscriptionApplication) {
      errors.push(`subscription application with ${id} does not exists`);
    }

    if (updateSubscriptionApplicationDto?.customer) {
      const newCustomerEntity = await this.customerService.findOne({
        _id: updateSubscriptionApplicationDto.customer,
      });

      if (!newCustomerEntity) {
        errors.push(
          `customer with id ${updateSubscriptionApplicationDto.customer} deos not exists`,
        );
      }

      if (!errors.length) {
        subscriptionApplication.customer =
          updateSubscriptionApplicationDto.customer;
      }
    }

    const customerEntity = await this.customerService.findOne({
      _id: subscriptionApplication.customer,
    });

    if (updateSubscriptionApplicationDto?.identityDocs) {
      const { errors: identityDocsErrors } =
        await this.customerService.validateDocExists({
          idCardDocURL:
            updateSubscriptionApplicationDto?.identityDocs?.idCardDocURL ||
            null,
          residencyProofDocURL:
            updateSubscriptionApplicationDto?.identityDocs
              ?.residencyProofDocURL || null,
        });
      errors.push(...identityDocsErrors);
      if (!errors.length) {
        customerEntity.identityDocs =
          updateSubscriptionApplicationDto.identityDocs;
      }
    }
    if (updateSubscriptionApplicationDto?.paymentDocs) {
      const { errors: paymentsDocsErrors } =
        await this.customerService.validateDocExists({
          termsOfSaleDocURL:
            updateSubscriptionApplicationDto?.paymentDocs?.termsOfSaleDocURL ||
            null,
        });
      errors.push(...paymentsDocsErrors);
      if (!errors.length) {
        customerEntity.paymentDocs =
          updateSubscriptionApplicationDto.paymentDocs;
      }
    }

    if (updateSubscriptionApplicationDto?.vehicles?.length) {
      for (const vehicle of updateSubscriptionApplicationDto.vehicles) {
        const { errors: vehicleDocsErrors } =
          await this.vehicleService.validateDocExists({
            vehicleRegistrationCardDocURL:
              vehicle?.vehicleRegistrationCardDocURL || null,
            driverLicenceDocURL: vehicle?.driverLicenceDocURL || null,
          });

        const vehicleExists = await this.vehicleService.exists({
          vin: vehicle.vin,
        });
        const vehicleExistsErrors: string[] = vehicleExists
          ? [`vehicle exists with VIN ${vehicle.vin}`]
          : [];

        errors.push(...vehicleDocsErrors, ...vehicleExistsErrors);
      }
      if (!errors.length) {
        subscriptionApplication.vehicles =
          updateSubscriptionApplicationDto.vehicles;
      }
    }

    // contract documents validation
    if (updateSubscriptionApplicationDto?.contract) {
      const { errors: contractDocsErrors } =
        await this.contractService.validateDocExists({
          contractDocURL:
            updateSubscriptionApplicationDto?.contract?.contractDocURL || null,
        });
      errors.push(...contractDocsErrors);
      if (!errors.length) {
        subscriptionApplication.contract = {
          ...updateSubscriptionApplicationDto.contract,
          ecommerceGateway: EcommerceGateway.STRIPE,
        };
      }
    }

    if (errors.length) {
      throw new BadRequestException(errors.join(', '));
    }

    if (updateSubscriptionApplicationDto.contactInformations) {
      customerEntity.contactInformations =
        updateSubscriptionApplicationDto.contactInformations;
    }

    if (updateSubscriptionApplicationDto.billingInformations) {
      customerEntity.billingInformations =
        updateSubscriptionApplicationDto.billingInformations;
    }

    await customerEntity.save();
    await subscriptionApplication.save();

    return await this.subscriptionApplicationModel
      .findOne({
        _id: id,
      })
      .populate('customer');
  }

  async review(id: string) {
    const errors = [];

    const subscriptionApplication =
      await this.subscriptionApplicationModel.findOne({
        _id: id,
      });

    if (!subscriptionApplication) {
      errors.push(`subscription application with ${id} does not exists`);
    }

    if (errors.length) {
      throw new BadRequestException(errors.join(', '));
    }

    subscriptionApplication.status = SubscriptionApplicationStatus.REVIEWING;

    subscriptionApplication.statusHistory = [
      ...subscriptionApplication.statusHistory,
      {
        status: SubscriptionApplicationStatus.REVIEWING,
        comment: '',
      },
    ];

    const data = await subscriptionApplication.save();

    await this.notificationService.createSupervisorNotification({
      type: NotificationType.SUBSCRIPTION_APPLICATION_STATUS_REVIEWING,
      data,
    });

    return data;
  }

  async updateStatus(
    filters: FilterQuery<SubscriptionApplication>,
    updateSubscriptionApplicationStatusDto:
      | UpdateSubscriptionApplicationStatusDto
      | FinalizeSubscriptionApplicationDto,
  ): Promise<{ id: string; url?: string }> {
    const errors = [];

    const subscriptionApplication =
      await this.subscriptionApplicationModel.findOne(filters);

    if (!subscriptionApplication) {
      errors.push(
        `subscription application with filters ${JSON.stringify(
          filters,
          null,
          4,
        )} does not exists`,
      );
    }

    if (errors.length) {
      throw new BadRequestException(errors.join(', '));
    }

    switch (updateSubscriptionApplicationStatusDto.status) {
      case SubscriptionApplicationStatus.PAYMENT_CONFIRMED:
        try {
          // save subscription application
          subscriptionApplication.status =
            updateSubscriptionApplicationStatusDto.status;
          subscriptionApplication.statusHistory = [
            ...subscriptionApplication.statusHistory,
            {
              status: SubscriptionApplicationStatus.PAYMENT_CONFIRMED,
              comment: updateSubscriptionApplicationStatusDto.comment || '',
            },
          ];
          const data = await subscriptionApplication.save();
          // update contract status
          const contractEntity = await this.contractService.findOne({
            _id: subscriptionApplication.contract.contract,
          });

          contractEntity.status = ContractStatus.ACTIVE;
          await contractEntity.save();

          await this.notificationService.createSupervisorNotification({
            type: NotificationType.SUBSCRIPTION_APPLICATION_STATUS_PAYMENT_CONFIRMED,
            data,
          });

          await this.notificationService.createCustomerNotification({
            type: NotificationType.SUBSCRIPTION_APPLICATION_STATUS_PAYMENT_CONFIRMED,
            receivers: [subscriptionApplication.customer],
            data,
          });

          return { id: subscriptionApplication._id };
        } catch (error) {
          console.log(error);
        }
        break;
      case SubscriptionApplicationStatus.PAYMENT_CANCELED:
        try {
          // save subscription application
          subscriptionApplication.status =
            updateSubscriptionApplicationStatusDto.status;
          subscriptionApplication.statusHistory = [
            ...subscriptionApplication.statusHistory,
            {
              status: SubscriptionApplicationStatus.PAYMENT_CANCELED,
              comment: updateSubscriptionApplicationStatusDto.comment || '',
            },
          ];
          const data = await subscriptionApplication.save();
          // update contract status
          const contractEntity = await this.contractService.findOne({
            _id: subscriptionApplication.contract.contract,
          });

          contractEntity.status = ContractStatus.CANCELED;
          await contractEntity.save();

          await this.notificationService.createSupervisorNotification({
            type: NotificationType.SUBSCRIPTION_APPLICATION_STATUS_PAYMENT_CANCELED,
            data,
          });

          await this.notificationService.createCustomerNotification({
            type: NotificationType.SUBSCRIPTION_APPLICATION_STATUS_PAYMENT_CANCELED,
            receivers: [subscriptionApplication.customer],
            data,
          });

          return { id: subscriptionApplication._id };
        } catch (error) {
          console.log(error);
        }
        break;
      case SubscriptionApplicationStatus.PAYMENT_PENDING:
        try {
          const customer = await this.customerService.findOne({
            _id: subscriptionApplication.customer,
          });
          const { errors: productErrors } =
            await this.contractService.validateProductExists(
              subscriptionApplication.contract.ecommerceProduct,
              subscriptionApplication.contract.ecommerceGateway,
            );
          errors.push(...productErrors);
          if (errors.length) {
            throw new BadRequestException(errors.join(', '));
          }
          // contract creation
          const contract = await this.contractService.create({
            customer: subscriptionApplication.customer,
            ecommerceProduct: subscriptionApplication.contract.ecommerceProduct,
            ecommerceGateway: subscriptionApplication.contract.ecommerceGateway,
          });

          // vehicles creation
          for (const vehicle of subscriptionApplication.vehicles) {
            await this.vehicleService.create({
              customer: subscriptionApplication.customer,
              contract: contract._id,
              vin: vehicle.vin,
              brand: vehicle.brand,
              model: vehicle.model,
              year: vehicle.year,
              registrationNumber: vehicle.registrationNumber,
              originalInServiceDate: vehicle.originalInServiceDate,
              contractSubscriptionKm: vehicle.contractSubscriptionKm,
              driverLicenceDocURL: vehicle.driverLicenceDocURL,
              vehicleRegistrationCardDocURL:
                vehicle.vehicleRegistrationCardDocURL,
            });
          }

          // create payment checkout url
          const { url } = await this.ecommerceService.createPaymentCheckoutUrl(
            customer.contactInformations.email,
            subscriptionApplication.contract.ecommerceProduct,
            subscriptionApplication.vehicles.length,
            {
              contract: contract._id,
            },
            subscriptionApplication.contract.ecommerceGateway,
          );

          // save subscription application
          subscriptionApplication.contract.contract = contract._id;
          subscriptionApplication.status =
            updateSubscriptionApplicationStatusDto.status;

          subscriptionApplication.statusHistory = [
            ...subscriptionApplication.statusHistory,
            {
              status: SubscriptionApplicationStatus.PAYMENT_PENDING,
              comment: updateSubscriptionApplicationStatusDto.comment || '',
            },
          ];

          const data = await subscriptionApplication.save();

          // update contract status and checkout url
          const contractEntity = await this.contractService.findOne({
            _id: contract._id,
          });

          contractEntity.status = ContractStatus.PAYMENT_PENDING;
          contractEntity.ecommerceCheckoutURL = url;

          await contractEntity.save();

          await this.notificationService.createCustomerNotification({
            type: NotificationType.SUBSCRIPTION_APPLICATION_STATUS_PAYMENT_PENDING,
            receivers: [subscriptionApplication.customer],
            data,
          });

          return { id: subscriptionApplication._id, url };
        } catch (error) {
          console.log(error);
        }
        break;
      default:
        subscriptionApplication.status =
          updateSubscriptionApplicationStatusDto.status;
        subscriptionApplication.statusHistory = [
          ...subscriptionApplication.statusHistory,
          {
            status: updateSubscriptionApplicationStatusDto.status,
            comment: updateSubscriptionApplicationStatusDto.comment || '',
          },
        ];
        const data = await subscriptionApplication.save();

        switch (updateSubscriptionApplicationStatusDto.status) {
          case SubscriptionApplicationStatus.REJECTED:
            await this.notificationService.createCustomerNotification({
              type: NotificationType.SUBSCRIPTION_APPLICATION_STATUS_REJECTED,
              receivers: [subscriptionApplication.customer],
              data,
            });
          case SubscriptionApplicationStatus.TO_AMMEND:
            await this.notificationService.createCustomerNotification({
              type: NotificationType.SUBSCRIPTION_APPLICATION_STATUS_TO_AMMEND,
              receivers: [subscriptionApplication.customer],
              data,
            });
          default:
            console.log(
              `notification not handled for status ${updateSubscriptionApplicationStatusDto.status}`,
            );
        }
        return { id: subscriptionApplication._id };
    }
  }

  async findAll(
    filters: FilterQuery<SubscriptionApplication>,
    pagination: Pagination,
    sortFilters: SortFilters,
  ): Promise<
    PaginatedResults<
      SubscriptionApplicationDocument & { customer: CustomerDocument }
    >
  > {
    const results = await this.subscriptionApplicationModel
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
          $addFields: {
            customer: { $arrayElemAt: ['$customers', 0] },
          },
        },
        {
          $project: {
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

    const count = await this.subscriptionApplicationModel.aggregate([
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

  async findOne(
    filters: FilterQuery<SubscriptionApplicationDocument>,
  ): Promise<SubscriptionApplicationDocument> {
    const contractExists = await this.exists(filters);
    if (!contractExists) {
      throw new NotFoundException(`subscription application does not exists`);
    }
    return this.subscriptionApplicationModel
      .findOne(filters)
      .populate('customer');
  }
}
