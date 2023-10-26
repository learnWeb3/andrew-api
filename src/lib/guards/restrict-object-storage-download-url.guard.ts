import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import {
  Customer,
  CustomerDocument,
} from 'src/customer/customer/customer.schemas';
import { GeneratePresignedDownloadUrlDto } from '../dto/generate-presigned-download-url.dto';
import { DocumentType } from '../interfaces/document-type.enum';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { join } from 'path';
import { KeycloakAvailableRoles } from 'src/keycloak/keycloak/keycloak-auth.guard';
import { SubscriptionApplication } from 'src/subscription-application/subscription-application/subscription-application.schemas';

@Injectable()
export class RectrictObjectStorageDownloadUrlGuard implements CanActivate {
  constructor(
    @InjectModel(Customer.name)
    private customerModel: Model<Customer>,

    @InjectModel(SubscriptionApplication.name)
    private subscriptionApplicationModel: Model<SubscriptionApplication>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: CustomerDocument; roles: string[] }>();

    if (
      request.roles.includes(KeycloakAvailableRoles.INSURER) ||
      request.roles.includes(KeycloakAvailableRoles.SUPERADMIN)
    ) {
      return true;
    }

    const requestBody: GeneratePresignedDownloadUrlDto =
      request.body as unknown as GeneratePresignedDownloadUrlDto;

    let filters: Record<string, any> = {};

    switch (requestBody.fileKey) {
      case DocumentType.CONTRACT:
        filters = {
          'contract.contractDocURL': join(
            requestBody.fileKey,
            requestBody.fileName,
          ),
        };

        filters = this.assignRoleFilters(request, filters);

        return (await this.subscriptionApplicationModel.exists(filters))
          ? true
          : false;

      case DocumentType.DRIVER_LICENSE:
        filters = {
          'vehicles.driverLicenceDocURL': join(
            requestBody.fileKey,
            requestBody.fileName,
          ),
        };
        filters = this.assignRoleFilters(request, filters);

        return (await this.subscriptionApplicationModel.exists(filters))
          ? true
          : false;

      case DocumentType.ID_CARD:
        filters = {
          'identityDocs.idCardDocURL': join(
            requestBody.fileKey,
            requestBody.fileName,
          ),
        };

        filters = this.assignRoleFilters(request, filters, '_id');

        console.log(filters, '===> FILTERS');

        return (await this.customerModel.exists(filters)) ? true : false;

      case DocumentType.RESIDENCY_PROOF:
        filters = {
          'identityDocs.residencyProofDocURL': join(
            requestBody.fileKey,
            requestBody.fileName,
          ),
        };

        filters = this.assignRoleFilters(request, filters, '_id');

        return (await this.customerModel.exists(filters)) ? true : false;

      case DocumentType.TERMS_OF_SALE:
        filters = {
          'paymentDocs.termsOfSaleDocURL': join(
            requestBody.fileKey,
            requestBody.fileName,
          ),
        };

        filters = this.assignRoleFilters(request, filters, '_id');

        return (await this.customerModel.exists(filters)) ? true : false;

      case DocumentType.VEHICLE_REGISTRATION_CARD:
        filters = {
          'vehicles.vehicleRegistrationCardDocURL': join(
            requestBody.fileKey,
            requestBody.fileName,
          ),
        };
        filters = this.assignRoleFilters(request, filters);
        return (await this.subscriptionApplicationModel.exists(filters))
          ? true
          : false;
      default:
        return false;
    }
  }

  private assignRoleFilters(
    request,
    filters: Record<string, any>,
    customerKey: string = 'customer',
  ): Record<string, any> {
    if (
      !request.roles.includes(KeycloakAvailableRoles.INSURER) &&
      !request.roles.includes(KeycloakAvailableRoles.SUPERADMIN)
    ) {
      Object.assign(filters, {
        [customerKey]: request.user.id,
      });
    }

    return filters;
  }
}
