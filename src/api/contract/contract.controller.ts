import {
  ConflictException,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  KeycloakAuthGuard,
  KeycloakAvailableRoles,
  KeycloakRoles,
  KeycloakRolesMongoQueryFilters,
} from '../../keycloak/keycloak/keycloak-auth.guard';
import { Paginated, Pagination } from 'src/lib/decorators/pagination.decorator';
import {
  SortFiltered,
  SortFilters,
} from 'src/lib/decorators/sort-filters.decorators';
import { ContractService } from 'src/contract/contract/contract.service';
import {
  RectrictForRoleAndResourceGuard,
  RestrictForRoleAndResource,
} from 'src/lib/guards/restrict-for-roles.guards';
import { ResourceType } from 'src/lib/interfaces/resource-type.enum';
import { ContractDocument } from 'src/contract/contract/contract.schemas';
import { SearchValue } from 'src/lib/decorators/search-value.decorators';
import { ContractStatus } from 'src/lib/interfaces/contract-status.enum';
import {
  StatusFiltered,
  StatusFilters,
} from 'src/lib/decorators/status-filters.decorators';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

@UseGuards(KeycloakAuthGuard)
@ApiTags('contract')
@Controller('api/contract')
export class ContractController {
  constructor(private contractService: ContractService) {}

  @ApiOperation({
    summary: 'Get a paginated list of contracts',
    description:
      'Result is scoped to the user owned contracts if user has a user role',
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
    enum: ContractStatus,
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
    KeycloakAvailableRoles.INSURER,
    KeycloakAvailableRoles.SUPERADMIN,
    KeycloakAvailableRoles.USER,
  ])
  @Get('')
  findAll(
    @SearchValue() searchValue: string,
    @Paginated() pagination: Pagination,
    @StatusFiltered(ContractStatus.ACTIVE)
    statusFilters: StatusFilters<ContractStatus>,
    @SortFiltered() sortFilters: SortFilters,
    @KeycloakRolesMongoQueryFilters() queryFilters: Record<string, any>,
  ) {
    const filters = {
      ...queryFilters,
      ...statusFilters,
    };
    if (searchValue) {
      Object.assign(filters, {
        $or: [
          {
            ref: { $regex: `.*${searchValue}.*`, $options: 'i' },
          },
        ],
      });
    }
    return this.contractService.findAll(filters, pagination, sortFilters);
  }

  @ApiOperation({
    summary: 'Cancel a contract',
    description:
      'Result is scoped to the user owned contracts if user has a user role, contract status must be ACTIVE',
  })
  @ApiBearerAuth('Any Role RBAC JWT access token')
  @RestrictForRoleAndResource({
    [KeycloakAvailableRoles.USER]: {
      [ResourceType.CONTRACT]: async (model, request) =>
        await model
          .findOne({
            _id: request.params.id,
          })
          .then((data: ContractDocument) => {
            const check =
              data.customer === request.user._id &&
              data.status === ContractStatus.ACTIVE;
            if (!check) {
              throw new ConflictException(
                `contract user must be authenticated user and contract status must be ${ContractStatus.ACTIVE}`,
              );
            }
            return check;
          }),
    },
    [KeycloakAvailableRoles.INSURER]: {
      [ResourceType.CONTRACT]: async (model, request) =>
        await model
          .findOne({
            _id: request.params.id,
          })
          .then((data: ContractDocument) => {
            const check = data.status === ContractStatus.ACTIVE;
            if (!check) {
              throw new ConflictException(
                `contract user must be authenticated user and contract status must be ${ContractStatus.ACTIVE}`,
              );
            }
            return check;
          }),
    },
  })
  @UseGuards(RectrictForRoleAndResourceGuard)
  @KeycloakRoles([
    KeycloakAvailableRoles.INSURER,
    KeycloakAvailableRoles.SUPERADMIN,
    KeycloakAvailableRoles.USER,
  ])
  @Patch(':id/cancel')
  cancel(@Param('id') contractId: string) {
    return this.contractService.cancel(
      {
        _id: contractId,
      },
      ContractStatus.CANCELED,
    );
  }

  @ApiOperation({
    summary: 'Update contract payments informations',
    description:
      'Result is scoped to the user owned contracts if user has a user role, the contract status must be PAYMENT_RENEWAL_ERROR',
  })
  @ApiBearerAuth('Any Role RBAC JWT access token')
  @RestrictForRoleAndResource({
    [KeycloakAvailableRoles.USER]: {
      [ResourceType.CONTRACT]: async (model, request) =>
        await model
          .findOne({
            _id: request.params.id,
          })
          .then((data: ContractDocument) => {
            const check =
              data.customer === request.user._id &&
              data.status === ContractStatus.PAYMENT_RENEWAL_ERROR;
            if (!check) {
              throw new ConflictException(
                `contract user must be authenticated user and contract status must be ${ContractStatus.PAYMENT_RENEWAL_ERROR}`,
              );
            }
            return check;
          }),
    },
    [KeycloakAvailableRoles.INSURER]: {
      [ResourceType.CONTRACT]: async (model, request) =>
        await model
          .findOne({
            _id: request.params.id,
          })
          .then((data: ContractDocument) => {
            const check = data.status === ContractStatus.PAYMENT_RENEWAL_ERROR;
            if (!check) {
              throw new ConflictException(
                `contract status must be ${ContractStatus.PAYMENT_RENEWAL_ERROR}`,
              );
            }
            return check;
          }),
    },
  })
  @KeycloakRoles([
    KeycloakAvailableRoles.INSURER,
    KeycloakAvailableRoles.SUPERADMIN,
    KeycloakAvailableRoles.USER,
  ])
  @Patch(':id/payment-informations')
  updatePaymentInformations(@Param('id') contractId: string) {
    return this.contractService.updatePaymentInformations({
      _id: contractId,
    });
  }

  @ApiOperation({
    summary: 'Get contract details',
    description:
      'Result is scoped to the user owned contracts if user has a user role',
  })
  @ApiBearerAuth('Any Role RBAC JWT access token')
  @RestrictForRoleAndResource({
    [KeycloakAvailableRoles.USER]: {
      [ResourceType.CONTRACT]: async (model, request) =>
        await model
          .findOne({
            _id: request.params.id,
          })
          .then((data: ContractDocument) => {
            const check = data.customer === request.user._id;
            if (!check) {
              throw new ConflictException(
                `contract user must be authenticated user`,
              );
            }
            return check;
          }),
    },
  })
  @UseGuards(RectrictForRoleAndResourceGuard)
  @KeycloakRoles([
    KeycloakAvailableRoles.INSURER,
    KeycloakAvailableRoles.SUPERADMIN,
    KeycloakAvailableRoles.USER,
  ])
  @Get(':id')
  findOne(@Param('id') contractId: string) {
    return this.contractService.findOne({
      _id: contractId,
    });
  }

  @ApiOperation({
    summary: 'Get a paginated list of vehicles linked to a contract',
    description:
      'Result is scoped to the user owned contracts if user has a user role',
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
  @RestrictForRoleAndResource({
    [KeycloakAvailableRoles.USER]: {
      [ResourceType.CONTRACT]: async (model, request) =>
        await model
          .findOne({
            _id: request.params.id,
          })
          .then((data: ContractDocument) => {
            const check = data.customer === request.user._id;
            if (!check) {
              throw new ConflictException(
                `contract user must be authenticated user`,
              );
            }
            return check;
          }),
    },
  })
  @UseGuards(RectrictForRoleAndResourceGuard)
  @KeycloakRoles([
    KeycloakAvailableRoles.INSURER,
    KeycloakAvailableRoles.SUPERADMIN,
    KeycloakAvailableRoles.USER,
  ])
  @Get(':id/vehicle')
  findOneVehicles(
    @Param('id') contractId: string,
    @KeycloakRolesMongoQueryFilters() queryFilters: Record<string, any>,
    @Paginated() pagination: Pagination,
    @SortFiltered() sortFilters: SortFilters,
  ) {
    return this.contractService.findOneVehicles(
      contractId,
      { ...queryFilters, contract: contractId },
      pagination,
      sortFilters,
    );
  }

  @ApiOperation({
    summary: 'Get a paginated list of devices linked to a contract',
    description:
      'Result is scoped to the user owned contracts if user has a user role',
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
  @RestrictForRoleAndResource({
    [KeycloakAvailableRoles.USER]: {
      [ResourceType.CONTRACT]: async (model, request) =>
        await model
          .findOne({
            _id: request.params.id,
          })
          .then((data: ContractDocument) => {
            const check = data.customer === request.user._id;
            if (!check) {
              throw new ConflictException(
                `contract user must be authenticated user`,
              );
            }
            return check;
          }),
    },
  })
  @UseGuards(RectrictForRoleAndResourceGuard)
  @KeycloakRoles([
    KeycloakAvailableRoles.INSURER,
    KeycloakAvailableRoles.SUPERADMIN,
    KeycloakAvailableRoles.USER,
  ])
  @Get(':id/device')
  findOneDevices(
    @Param('id') contractId: string,
    @KeycloakRolesMongoQueryFilters() queryFilters: Record<string, any>,
    @Paginated() pagination: Pagination,
    @SortFiltered() sortFilters: SortFilters,
  ) {
    return this.contractService.findOneDevices(
      contractId,
      { ...queryFilters, contract: contractId },
      pagination,
      sortFilters,
    );
  }
}
