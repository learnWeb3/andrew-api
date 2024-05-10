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
import { SearchValue } from 'src/lib/decorators/search-value.decorators';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

@UseGuards(KeycloakAuthGuard)
@ApiTags('subscription-application')
@Controller('api/subscription-application')
export class SubscriptionApplicationController {
  constructor(
    private readonly subscriptionApplicationService: SubscriptionApplicationService,
  ) {}

  @ApiOperation({
    summary: 'Create a subscription application',
  })
  @ApiBearerAuth('User Role RBAC JWT access token')
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

  @ApiOperation({
    summary: 'Create a subscription application',
    description: 'Endpoint is only accessible by suyperadmin and insurer users',
  })
  @ApiBearerAuth('Supervisor or Superadmin Role RBAC JWT access token')
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

  @ApiOperation({
    summary: 'Update the status of a subscription application',
    description: 'Status must be a valid next step according to the workflow',
  })
  @ApiBearerAuth('Any Role RBAC JWT access token')
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

  @ApiOperation({
    summary: 'Update a subscription application fields',
    description:
      'Result is scoped to the user owned devices if user has a user role, subscription application must be in REVIEWING status for an insurer or superadmin and in PENDING or TO_AMMEND status for a customer',
  })
  @ApiBearerAuth('Any Role RBAC JWT access token')
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

  @ApiOperation({
    summary:
      'Update the subscription application status (final state in the workflow)',
    description:
      'Endpoint is only accessible by superadmin and insurer user role, the subscription application status must be REVIEWING',
  })
  @ApiBearerAuth('Supervisor or Superadmin Role RBAC JWT access token')
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

  @ApiOperation({
    summary: 'Get a paginated list of subscription applications',
    description:
      'Result is scoped to the user owned subscription applications if user has a user role',
  })
  @ApiBearerAuth('Any Role RBAC JWT access token')
  @ApiQuery({
    name: 'start',
    type: String,
    required: false,
    description: 'pagination start query parameter',
  })
  @ApiQuery({
    name: 'end',
    type: String,
    required: false,
    description: 'pagination end query parameter',
  })
  @ApiQuery({
    name: 'sort',
    type: String,
    required: false,
    description: 'sort field',
  })
  @ApiQuery({
    name: 'order',
    enum: [-1, 1, 'asc', 'ascending', 'desc', 'descending'],
    required: false,
    description: 'sort order',
  })
  @ApiQuery({
    name: 'status',
    enum: SubscriptionApplicationStatus,
    required: false,
    description: 'resource status',
  })
  @ApiQuery({
    name: 'value',
    type: String,
    required: false,
    description: 'search value',
  })
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
    @SearchValue() searchValue: string,
    @Paginated() pagination: Pagination,
    @SortFiltered() sortFilters: SortFilters,
  ) {
    const filters = {
      ...queryFilters,
      ...status,
    };
    if (searchValue) {
      Object.assign(filters, {
        ref: { $regex: `.*${searchValue}.*`, $options: 'i' },
      });
    }
    return this.subscriptionApplicationService.findAll(
      filters,
      pagination,
      sortFilters,
    );
  }

  @ApiOperation({
    summary: 'Get a subscription applications details',
    description:
      'Result is scoped to the user owned subscription applications if user has a user role',
  })
  @ApiBearerAuth('Any Role RBAC JWT access token')
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
