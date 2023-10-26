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
      $or: [
        { insurer: true },
        {
          fullName: { $regex: new RegExp(searchValue), $options: 'i' },
        },
        {
          firstName: { $regex: new RegExp(searchValue), $options: 'i' },
        },
        {
          lastName: { $regex: new RegExp(searchValue), $options: 'i' },
        },
        {
          'contactInformations.email': {
            $regex: new RegExp(searchValue),
            $options: 'i',
          },
        },
      ],
    };

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
      $or: [
        { insurer: false },
        {
          fullName: { $regex: new RegExp(searchValue), $options: 'i' },
        },
        {
          firstName: { $regex: new RegExp(searchValue), $options: 'i' },
        },
        {
          lastName: { $regex: new RegExp(searchValue), $options: 'i' },
        },
        {
          'contactInformations.email': {
            $regex: new RegExp(searchValue),
            $options: 'i',
          },
        },
      ],
    };

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
    @KeycloakRolesMongoQueryFilters() queryFilters: Record<string, any>,
    @Paginated() pagination: Pagination,
    @SortFiltered() sortFilters: SortFilters,
  ) {
    return this.customerService.findOneContracts(
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
  @Get(':id/vehicle')
  findOneVehicles(
    @Param('id') customerId: string,
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
    @KeycloakRolesMongoQueryFilters() queryFilters: Record<string, any>,
    @Paginated() pagination: Pagination,
    @SortFiltered() sortFilters: SortFilters,
  ) {
    return this.customerService.findOneDevices(
      customerId,
      { ...queryFilters, customer: customerId },
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
