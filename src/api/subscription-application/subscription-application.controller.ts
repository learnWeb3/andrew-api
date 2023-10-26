import {
  Body,
  ConflictException,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CustomerDocument } from 'src/customer/customer/customer.schemas';
import {
  AuthenticatedUser,
  KeycloakAuthGuard,
  KeycloakAvailableRoles,
  KeycloakRoles,
  KeycloakRolesMongoQueryFilters,
} from 'src/keycloak/keycloak/keycloak-auth.guard';
import { Paginated, Pagination } from 'src/lib/decorators/pagination.decorator';
import {
  SortFiltered,
  SortFilters,
} from 'src/lib/decorators/sort-filters.decorators';
import {
  CreateSubscriptionApplicationDto,
  UserCreateSubscriptionApplicationDto,
} from 'src/lib/dto/create-subscription-application.dto';
import {
  RectrictForRoleAndResourceGuard,
  RestrictForRoleAndResource,
} from 'src/lib/guards/restrict-for-roles.guards';
import { ResourceType } from 'src/lib/interfaces/resource-type.enum';
import { SubscriptionApplicationDocument } from 'src/subscription-application/subscription-application/subscription-application.schemas';
import { SubscriptionApplicationService } from 'src/subscription-application/subscription-application/subscription-application.service';
import {
  FinalizeSubscriptionApplicationDto,
  UpdateSubscriptionApplicationDto,
} from '../../lib/dto/update-subscription-application.dto';
import { SubscriptionApplicationStatus } from 'src/lib/interfaces/subscription-application-status.enum';
import {
  StatusFiltered,
  StatusFilters,
} from 'src/lib/decorators/status-filters.decorators';

@UseGuards(KeycloakAuthGuard)
@Controller('api/subscription-application')
export class SubscriptionApplicationController {
  constructor(
    private readonly subscriptionApplicationService: SubscriptionApplicationService,
  ) {}

  @KeycloakRoles([KeycloakAvailableRoles.USER])
  @Post('')
  register(
    @AuthenticatedUser() user: CustomerDocument,
    @Body()
    userCreateSubscriptionApplicationDto: UserCreateSubscriptionApplicationDto,
  ) {
    return this.subscriptionApplicationService.create({
      ...userCreateSubscriptionApplicationDto,
      customer: user._id,
    });
  }

  @KeycloakRoles([
    KeycloakAvailableRoles.SUPERADMIN,
    KeycloakAvailableRoles.INSURER,
  ])
  @Post('register')
  create(
    @Body() createSubscriptionApplicationDto: CreateSubscriptionApplicationDto,
  ) {
    return this.subscriptionApplicationService.create(
      createSubscriptionApplicationDto,
    );
  }

  @RestrictForRoleAndResource({
    [KeycloakAvailableRoles.SUPERADMIN]: {
      [ResourceType.SUBSCRIPTION_APPLICATION]: async (model, request) =>
        await model
          .findOne({
            _id: request.params.id,
          })
          .then((data: SubscriptionApplicationDocument) => {
            const check = [
              SubscriptionApplicationStatus.PENDING,
              SubscriptionApplicationStatus.TO_AMMEND,
            ].includes(data.status);
            if (!check) {
              throw new ConflictException(
                `subscription application must have a status of ${[
                  SubscriptionApplicationStatus.PENDING,
                  SubscriptionApplicationStatus.TO_AMMEND,
                ].join(', ')}, current is ${data.status}`,
              );
            }
            return check;
          }),
    },
    [KeycloakAvailableRoles.INSURER]: {
      [ResourceType.SUBSCRIPTION_APPLICATION]: async (model, request) =>
        await model
          .findOne({
            _id: request.params.id,
          })
          .then((data: SubscriptionApplicationDocument) => {
            const check = [
              SubscriptionApplicationStatus.PENDING,
              SubscriptionApplicationStatus.TO_AMMEND,
            ].includes(data.status);
            if (!check) {
              throw new ConflictException(
                `subscription application must have a status of ${[
                  SubscriptionApplicationStatus.PENDING,
                  SubscriptionApplicationStatus.TO_AMMEND,
                ].join(', ')}, current is ${data.status}`,
              );
            }
            return check;
          }),
    },
    [KeycloakAvailableRoles.USER]: {
      [ResourceType.SUBSCRIPTION_APPLICATION]: async (model, request) =>
        await model
          .findOne({
            _id: request.params.id,
          })
          .then((data: SubscriptionApplicationDocument) => {
            const check =
              data.customer === request.user._id &&
              [
                SubscriptionApplicationStatus.PENDING,
                SubscriptionApplicationStatus.TO_AMMEND,
              ].includes(data.status);
            if (!check) {
              throw new ConflictException(
                `subscription application must have a status of ${[
                  SubscriptionApplicationStatus.PENDING,
                  SubscriptionApplicationStatus.TO_AMMEND,
                ].join(', ')}, current is ${
                  data.status
                } and be linked to the currently authenticated customer`,
              );
            }
            return check;
          }),
    },
  })
  @UseGuards(RectrictForRoleAndResourceGuard)
  @KeycloakRoles([
    KeycloakAvailableRoles.SUPERADMIN,
    KeycloakAvailableRoles.INSURER,
    KeycloakAvailableRoles.USER,
  ])
  @Patch(':id/review')
  review(@Param('id') id: string) {
    return this.subscriptionApplicationService.review(id);
  }

  @RestrictForRoleAndResource({
    [KeycloakAvailableRoles.SUPERADMIN]: {
      [ResourceType.SUBSCRIPTION_APPLICATION]: async (model, request) =>
        await model
          .findOne({
            _id: request.params.id,
          })
          .then((data: SubscriptionApplicationDocument) => {
            const check = [SubscriptionApplicationStatus.REVIEWING].includes(
              data.status,
            );
            if (!check) {
              throw new ConflictException(
                `subscription application must have a ${SubscriptionApplicationStatus.REVIEWING} status, current is ${data.status}`,
              );
            }
            return check;
          }),
    },
    [KeycloakAvailableRoles.INSURER]: {
      [ResourceType.SUBSCRIPTION_APPLICATION]: async (model, request) =>
        await model
          .findOne({
            _id: request.params.id,
          })
          .then((data: SubscriptionApplicationDocument) => {
            const check = [SubscriptionApplicationStatus.REVIEWING].includes(
              data.status,
            );
            if (!check) {
              throw new ConflictException(
                `subscription application must have a ${SubscriptionApplicationStatus.REVIEWING} status, current is ${data.status}`,
              );
            }
            return check;
          }),
    },
    [KeycloakAvailableRoles.USER]: {
      [ResourceType.SUBSCRIPTION_APPLICATION]: async (model, request) =>
        await model
          .findOne({
            _id: request.params.id,
          })
          .then((data: SubscriptionApplicationDocument) => {
            const check =
              data.customer === request.user._id &&
              [
                SubscriptionApplicationStatus.PENDING,
                SubscriptionApplicationStatus.TO_AMMEND,
              ].includes(data.status);
            if (!check) {
              throw new ConflictException(
                `subscription application must have a ${[
                  SubscriptionApplicationStatus.PENDING,
                  SubscriptionApplicationStatus.TO_AMMEND,
                ].join(', ')} status, current is ${data.status}`,
              );
            }
            return check;
          }),
    },
  })
  @UseGuards(RectrictForRoleAndResourceGuard)
  @KeycloakRoles([
    KeycloakAvailableRoles.SUPERADMIN,
    KeycloakAvailableRoles.INSURER,
    KeycloakAvailableRoles.USER,
  ])
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateubscriptionApplicationDto: UpdateSubscriptionApplicationDto,
  ) {
    return this.subscriptionApplicationService.update(
      id,
      updateubscriptionApplicationDto,
    );
  }

  @RestrictForRoleAndResource({
    [KeycloakAvailableRoles.INSURER]: {
      [ResourceType.SUBSCRIPTION_APPLICATION]: async (model, request) =>
        await model
          .findOne({
            _id: request.params.id,
          })
          .then((data: SubscriptionApplicationDocument) => {
            const check = [SubscriptionApplicationStatus.REVIEWING].includes(
              data.status,
            );
            if (!check) {
              throw new ConflictException(
                `subscription application must have a ${SubscriptionApplicationStatus.REVIEWING} status, current is ${data.status}`,
              );
            }
            return check;
          }),
    },
    [KeycloakAvailableRoles.SUPERADMIN]: {
      [ResourceType.SUBSCRIPTION_APPLICATION]: async (model, request) =>
        await model
          .findOne({
            _id: request.params.id,
          })
          .then((data: SubscriptionApplicationDocument) => {
            const check = [SubscriptionApplicationStatus.REVIEWING].includes(
              data.status,
            );
            if (!check) {
              throw new ConflictException(
                `subscription application must have a ${SubscriptionApplicationStatus.REVIEWING} status, current is ${data.status}`,
              );
            }
            return check;
          }),
    },
  })
  @UseGuards(RectrictForRoleAndResourceGuard)
  @KeycloakRoles([
    KeycloakAvailableRoles.SUPERADMIN,
    KeycloakAvailableRoles.INSURER,
  ])
  @Patch(':id/finalize')
  updateStatus(
    @Param('id') id: string,
    @Body()
    finalizeSubscriptionApplicationDto: FinalizeSubscriptionApplicationDto,
  ) {
    return this.subscriptionApplicationService.updateStatus(
      { _id: id },
      finalizeSubscriptionApplicationDto,
    );
  }

  @KeycloakRoles([
    KeycloakAvailableRoles.SUPERADMIN,
    KeycloakAvailableRoles.INSURER,
    KeycloakAvailableRoles.USER,
  ])
  @Get('')
  findAll(
    @KeycloakRolesMongoQueryFilters() queryFilters: Record<string, any>,
    @StatusFiltered(SubscriptionApplicationStatus.PENDING)
    status: StatusFilters<SubscriptionApplicationStatus>,
    @Paginated() pagination: Pagination,
    @SortFiltered() sortFilters: SortFilters,
  ) {
    const filters = {
      ...queryFilters,
      ...status,
    };
    return this.subscriptionApplicationService.findAll(
      filters,
      pagination,
      sortFilters,
    );
  }

  @RestrictForRoleAndResource({
    [KeycloakAvailableRoles.USER]: {
      [ResourceType.SUBSCRIPTION_APPLICATION]: async (model, request) =>
        await model
          .findOne({
            _id: request.params.id,
          })
          .then((data: SubscriptionApplicationDocument) => {
            const check = data.customer === request.user._id;
            if (!check) {
              throw new ConflictException(
                `subscription application must be linked to the currently authenticated user`,
              );
            }
            return check;
          }),
    },
  })
  @UseGuards(RectrictForRoleAndResourceGuard)
  @KeycloakRoles([
    KeycloakAvailableRoles.SUPERADMIN,
    KeycloakAvailableRoles.INSURER,
    KeycloakAvailableRoles.USER,
  ])
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subscriptionApplicationService.findOne({ _id: id });
  }
}
