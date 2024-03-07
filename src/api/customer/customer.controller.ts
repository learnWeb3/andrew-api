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
import { CustomerService } from 'src/customer/customer/customer.service';
import { Pagination, Paginated } from 'src/lib/decorators/pagination.decorator';
import {
  AuthenticatedUser,
  AuthenticatedUserRoles,
  KeycloakAuthGuard,
  KeycloakAvailableRoles,
  KeycloakRoles,
  KeycloakRolesMongoQueryFilters,
  KeycloakTokenGuard,
  TokenPayload,
} from 'src/keycloak/keycloak/keycloak-auth.guard';
import {
  SortFiltered,
  SortFilters,
} from 'src/lib/decorators/sort-filters.decorators';
import {
  RectrictForRoleAndResourceGuard,
  RestrictForRoleAndResource,
} from 'src/lib/guards/restrict-for-roles.guards';
import { ResourceType } from 'src/lib/interfaces/resource-type.enum';
import { UpdateCustomerDto } from 'src/lib/dto/update-customer.dto';
import { CreateThirdPartyAccountDto } from 'src/lib/dto/create-third-party-account.dto';
import { SearchValue } from 'src/lib/decorators/search-value.decorators';
import { CustomerDocument } from 'src/customer/customer/customer.schemas';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('customer')
@Controller('api/customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @KeycloakRoles([KeycloakAvailableRoles.SUPERADMIN])
  @UseGuards(KeycloakAuthGuard)
  @Get('insurer')
  findAllInsurers(
    @SearchValue() searchValue: string,
    @Paginated() pagination: Pagination,
    @SortFiltered() sortFilters: SortFilters,
  ) {
    const filters = {
      insurer: true,
    };

    if (searchValue) {
      Object.assign(filters, {
        $or: [
          {
            fullName: { $regex: `^.*${searchValue}.*$`, $options: 'i' },
          },
          {
            'contactInformations.email': {
              $regex: `^.*${searchValue}.*$`,
              $options: 'i',
            },
          },
        ],
      });
    }

    return this.customerService.findAll(filters, pagination, sortFilters);
  }
  @KeycloakRoles([
    KeycloakAvailableRoles.INSURER,
    KeycloakAvailableRoles.SUPERADMIN,
  ])
  @UseGuards(KeycloakAuthGuard)
  @Get('')
  findAllCustomers(
    @SearchValue() searchValue: string,
    @Paginated() pagination: Pagination,
    @SortFiltered() sortFilters: SortFilters,
  ) {
    const filters = {
      insurer: false,
    };

    if (searchValue) {
      Object.assign(filters, {
        $or: [
          {
            fullName: { $regex: `.*${searchValue}.*`, $options: 'i' },
          },
          {
            'contactInformations.email': {
              $regex: `.*${searchValue}.*`,
              $options: 'i',
            },
          },
        ],
      });
    }

    console.log('===> filters', filters);

    return this.customerService.findAll(filters, pagination, sortFilters);
  }

  @RestrictForRoleAndResource({
    [KeycloakAvailableRoles.USER]: {
      [ResourceType.CUSTOMER]: async (_model, request) => {
        const check = request.params.id === request.user._id;
        if (!check) {
          throw new ConflictException(
            `user account must be authenticated user`,
          );
        }
        return check;
      },
    },
  })
  @UseGuards(RectrictForRoleAndResourceGuard)
  @KeycloakRoles([
    KeycloakAvailableRoles.INSURER,
    KeycloakAvailableRoles.SUPERADMIN,
    KeycloakAvailableRoles.USER,
  ])
  @UseGuards(KeycloakAuthGuard)
  @Get(':id')
  findOne(@Param('id') customerId: string) {
    return this.customerService.findOne({ _id: customerId });
  }

  @RestrictForRoleAndResource({
    [KeycloakAvailableRoles.USER]: {
      [ResourceType.CUSTOMER]: async (_model, request) => {
        const check = request.params.id === request.user._id;
        if (!check) {
          throw new ConflictException(
            `user account must be authenticated user`,
          );
        }
        return check;
      },
    },
  })
  @UseGuards(RectrictForRoleAndResourceGuard)
  @KeycloakRoles([
    KeycloakAvailableRoles.INSURER,
    KeycloakAvailableRoles.SUPERADMIN,
    KeycloakAvailableRoles.USER,
  ])
  @UseGuards(KeycloakAuthGuard)
  @Get(':id/contract')
  findOneContracts(
    @Param('id') customerId: string,
    @SearchValue() searchValue: string,
    @KeycloakRolesMongoQueryFilters() queryFilters: Record<string, any>,
    @Paginated() pagination: Pagination,
    @SortFiltered() sortFilters: SortFilters,
  ) {
    const filters = { ...queryFilters, customer: customerId };
    if (searchValue) {
      Object.assign(filters, {
        $or: [
          {
            ref: { $regex: `.*${searchValue}.*`, $options: 'i' },
          },
        ],
      });
    }
    return this.customerService.findOneContracts(
      customerId,
      filters,
      pagination,
      sortFilters,
    );
  }

  @RestrictForRoleAndResource({
    [KeycloakAvailableRoles.USER]: {
      [ResourceType.CUSTOMER]: async (_model, request) => {
        const check = request.params.id === request.user._id;
        if (!check) {
          throw new ConflictException(
            `user account must be authenticated user`,
          );
        }
        return check;
      },
    },
  })
  @UseGuards(RectrictForRoleAndResourceGuard)
  @KeycloakRoles([
    KeycloakAvailableRoles.INSURER,
    KeycloakAvailableRoles.SUPERADMIN,
    KeycloakAvailableRoles.USER,
  ])
  @UseGuards(KeycloakAuthGuard)
  @Get(':id/vehicle')
  findOneVehicles(
    @Param('id') customerId: string,
    @SearchValue() searchValue: string,
    @KeycloakRolesMongoQueryFilters() queryFilters: Record<string, any>,
    @Paginated() pagination: Pagination,
    @SortFiltered() sortFilters: SortFilters,
  ) {
    return this.customerService.findOneVehicles(
      customerId,
      { ...queryFilters, customer: customerId },
      pagination,
      sortFilters,
    );
  }

  @RestrictForRoleAndResource({
    [KeycloakAvailableRoles.USER]: {
      [ResourceType.CUSTOMER]: async (_model, request) => {
        const check = request.params.id === request.user._id;
        if (!check) {
          throw new ConflictException(
            `user account must be authenticated user`,
          );
        }
        return check;
      },
    },
  })
  @UseGuards(RectrictForRoleAndResourceGuard)
  @KeycloakRoles([
    KeycloakAvailableRoles.INSURER,
    KeycloakAvailableRoles.SUPERADMIN,
    KeycloakAvailableRoles.USER,
  ])
  @UseGuards(KeycloakAuthGuard)
  @Get(':id/device')
  findOneDevices(
    @Param('id') customerId: string,
    @SearchValue() searchValue: string,
    @KeycloakRolesMongoQueryFilters() queryFilters: Record<string, any>,
    @Paginated() pagination: Pagination,
    @SortFiltered() sortFilters: SortFilters,
  ) {
    const filters = {
      ...queryFilters,
      customer: customerId,
      serialNumber: { $regex: `^.*${searchValue}.*$`, $options: 'i' },
    };
    return this.customerService.findOneDevices(
      customerId,
      filters,
      pagination,
      sortFilters,
    );
  }

  @RestrictForRoleAndResource({
    [KeycloakAvailableRoles.USER]: {
      [ResourceType.CUSTOMER]: async (_model, request) => {
        const check = request.params.id === request.user._id;
        if (!check) {
          throw new ConflictException(
            `user account must be authenticated user`,
          );
        }
        return check;
      },
    },
  })
  @UseGuards(RectrictForRoleAndResourceGuard)
  @KeycloakRoles([
    KeycloakAvailableRoles.INSURER,
    KeycloakAvailableRoles.SUPERADMIN,
    KeycloakAvailableRoles.USER,
  ])
  @UseGuards(KeycloakAuthGuard)
  @Get(':id/subscription-application')
  findOneSubscriptionApplications(
    @Param('id') customerId: string,
    @KeycloakRolesMongoQueryFilters() queryFilters: Record<string, any>,
    @Paginated() pagination: Pagination,
    @SearchValue() searchValue: string,
    @SortFiltered() sortFilters: SortFilters,
  ) {
    const filters = { ...queryFilters, customer: customerId };
    if (searchValue) {
      Object.assign(filters, {
        ref: { $regex: `.*${searchValue}.*`, $options: 'i' },
      });
    }
    return this.customerService.findOneSubscriptionApplications(
      customerId,
      filters,
      pagination,
      sortFilters,
    );
  }

  @RestrictForRoleAndResource({
    [KeycloakAvailableRoles.USER]: {
      [ResourceType.CUSTOMER]: async (_model, request) => {
        const check = request.params.id === request.user._id;
        if (!check) {
          throw new ConflictException(
            `user account must be authenticated user`,
          );
        }
        return check;
      },
    },
  })
  @UseGuards(RectrictForRoleAndResourceGuard)
  @KeycloakRoles([
    KeycloakAvailableRoles.INSURER,
    KeycloakAvailableRoles.SUPERADMIN,
    KeycloakAvailableRoles.USER,
  ])
  @UseGuards(KeycloakAuthGuard)
  @Get(':id/notifications')
  findOneNotifications(
    @AuthenticatedUser() user: CustomerDocument,
    @AuthenticatedUserRoles() roles: string[],
    @Param('id') customerId: string,
    @Paginated() pagination: Pagination,
    @SortFiltered() sortFilters: SortFilters,
  ) {
    const filters = roles.includes(KeycloakAvailableRoles.INSURER)
      ? { accessibleBy: KeycloakAvailableRoles.INSURER }
      : roles.includes(KeycloakAvailableRoles.SUPERADMIN)
      ? { accessibleBy: KeycloakAvailableRoles.INSURER }
      : {
          accessibleBy: KeycloakAvailableRoles.USER,
          receivers: user._id,
        };

    return this.customerService.findOneNotifications(
      customerId,
      filters,
      pagination,
      sortFilters,
    );
  }

  @KeycloakRoles([
    KeycloakAvailableRoles.USER,
    KeycloakAvailableRoles.INSURER,
    KeycloakAvailableRoles.SUPERADMIN,
  ])
  @UseGuards(KeycloakTokenGuard)
  @Post('')
  create(@TokenPayload() tokenPayload: Record<string, any>) {
    return this.customerService.create({
      authorizationServerUserId: tokenPayload.sub,
      email: tokenPayload.email,
      firstName: tokenPayload.given_name,
      lastName: tokenPayload.family_name,
      fullName: `${tokenPayload.given_name} ${tokenPayload.family_name}`,
    });
  }

  @KeycloakRoles([
    KeycloakAvailableRoles.INSURER,
    KeycloakAvailableRoles.SUPERADMIN,
  ])
  @UseGuards(KeycloakTokenGuard)
  @Post('account')
  createInsurer(
    @Body() createThirdPartyAccountDto: CreateThirdPartyAccountDto,
  ) {
    return this.customerService.createThirdPartyAccount(
      createThirdPartyAccountDto,
    );
  }

  @KeycloakRoles([
    KeycloakAvailableRoles.INSURER,
    KeycloakAvailableRoles.SUPERADMIN,
  ])
  @Patch(':id')
  update(
    @Param('id') customerId: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customerService.update(customerId, updateCustomerDto);
  }
}
