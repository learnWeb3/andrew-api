import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import {
  Customer,
  CustomerDocument,
} from 'src/customer/customer/customer.schemas';
import { KeycloakAvailableRoles } from 'src/keycloak/keycloak/keycloak-auth.guard';
import { ResourceType } from '../interfaces/resource-type.enum';
import { Device } from 'src/device/device/device.schemas';
import { Contract } from 'src/contract/contract/contract.schemas';
import { Model } from 'mongoose';
import { Vehicle } from 'src/vehicle/vehicle/vehicle.schema';
import { InjectModel } from '@nestjs/mongoose';
import { SubscriptionApplication } from 'src/subscription-application/subscription-application/subscription-application.schemas';

export type ResourceRestrictionRule = (
  resourceModel: Model<
    Device | Customer | Contract | Vehicle | SubscriptionApplication
  >,
  request: Request & { user: CustomerDocument; roles: string[] },
) => Promise<boolean>;

export type ResourceRestriction = Partial<
  Record<ResourceType, ResourceRestrictionRule>
>;

export type RoleResourceRestriction = Partial<
  Record<KeycloakAvailableRoles, ResourceRestriction>
>;

export const RestrictForRoleAndResource =
  Reflector.createDecorator<RoleResourceRestriction>();

@Injectable()
export class RectrictForRoleAndResourceGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectModel(Device.name)
    private deviceModel: Model<Device>,
    @InjectModel(Customer.name)
    private customerModel: Model<Customer>,
    @InjectModel(Contract.name)
    private contractModel: Model<Contract>,
    @InjectModel(Vehicle.name)
    private vehicleModel: Model<Vehicle>,
    @InjectModel(SubscriptionApplication.name)
    private subscribtionApplicationModel: Model<SubscriptionApplication>,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const restrictionsRules = this.reflector.get(
        RestrictForRoleAndResource,
        context.getHandler(),
      );
      const request = context
        .switchToHttp()
        .getRequest<Request & { user: CustomerDocument; roles: string[] }>();

      for (const role of request.roles) {
        if (restrictionsRules[role]) {
          for (const resourceType in restrictionsRules[role]) {
            const resourceRetrictionRule: ResourceRestrictionRule | null =
              restrictionsRules[role][resourceType] || null;
            const check = await resourceRetrictionRule(
              this.getModelFromResourceType(resourceType as ResourceType),
              request,
            );
            if (!check) {
              return false;
            }
          }
        }
      }
    } catch (error) {
      console.log(error);
      throw error;
    }

    return true;
  }

  getModelFromResourceType(resourceType: ResourceType) {
    const mapping = {
      [ResourceType.CONTRACT]: this.contractModel,
      [ResourceType.CUSTOMER]: this.customerModel,
      [ResourceType.DEVICE]: this.deviceModel,
      [ResourceType.VEHICLE]: this.vehicleModel,
      [ResourceType.SUBSCRIPTION_APPLICATION]:
        this.subscribtionApplicationModel,
    };

    return mapping[resourceType];
  }
}
