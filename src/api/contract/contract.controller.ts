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

@UseGuards(KeycloakAuthGuard)
@Controller('api/contract')
export class ContractController {
  constructor(private contractService: ContractService) {}

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
            ref: { $regex: new RegExp(searchValue), $options: 'i' },
          },
        ],
      });
    }
    return this.contractService.findAll(filters, pagination, sortFilters);
  }

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
      queryFilters,
      pagination,
      sortFilters,
    );
  }

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
