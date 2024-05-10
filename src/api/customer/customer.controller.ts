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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('customer')
@Controller('api/customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @ApiOperation({
    summary: 'Get a paginated list of insurers',
    description: 'Only superadmin can access this endpoint',
  })
  @ApiBearerAuth('Superadmin Role RBAC JWT access token')
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
    name: 'value',
    type: String,
    required: false,
    description: 'search value',
  })
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

  @ApiOperation({
    summary: 'Get a paginated list of customers',
    description: 'Only superadmin and insurers can access this endpoint',
  })
  @ApiBearerAuth('Supervisor or Superadmin Role RBAC JWT access token')
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
    name: 'value',
    type: String,
    required: false,
    description: 'search value',
  })
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

    return this.customerService.findAll(filters, pagination, sortFilters);
  }

  @ApiOperation({
    summary: 'Get a customer details',
    description:
      'Result is scoped to the user own account if user has a user role',
  })
  @ApiBearerAuth('Any Role RBAC JWT access token')
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

  @ApiOperation({
    summary: 'Get a paginated list of contracts for a customer',
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
    name: 'value',
    type: String,
    required: false,
    description: 'search value',
  })
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
  @ApiOperation({
    summary: 'Get a paginated list of contracts for a customer',
    description:
      'Result is scoped to user owned contracts if user has a user role',
  })
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
    name: 'value',
    type: String,
    required: false,
    description: 'search value',
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

  @ApiOperation({
    summary: 'Get a paginated list of vehicles for a customer',
    description:
      'Result is scoped to the user owned vehicles if user has a user role',
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
    name: 'value',
    type: String,
    required: false,
    description: 'search value',
  })
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

  @ApiOperation({
    summary: 'Get a paginated list of devices for a customer',
    description:
      'Result is scoped to the user owned devices if user has a user role',
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
    name: 'value',
    type: String,
    required: false,
    description: 'search value',
  })
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

  @ApiOperation({
    summary: 'Get a paginated list of subscription applications for a customer',
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
    name: 'value',
    type: String,
    required: false,
    description: 'search value',
  })
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

  @ApiOperation({
    summary: 'Get a paginated list of notifications for a customer',
    description:
      'Result is scoped to the user owned notifications if user has a user role',
  })
  @ApiBearerAuth('Any Role RBAC JWT access token')
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
    name: 'value',
    type: String,
    required: false,
    description: 'search value',
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

  @ApiOperation({
    summary: 'Register a customer in the microservice local database',
  })
  @ApiBearerAuth('Any Role RBAC JWT access token')
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

  @ApiOperation({
    summary: 'Register an third party user in the microservice local database',
    description: 'endpoint can be accessed by insurer or superadmin users only',
  })
  @ApiBearerAuth('Supervisor or Superadmin Role RBAC JWT access token')
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

  @ApiOperation({
    summary: 'Update a customer/insurer fields',
    description: 'endpoint can be accessed by insurer or superadmin users only',
  })
  @ApiBearerAuth('Supervisor or Superadmin Role RBAC JWT access token')
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
