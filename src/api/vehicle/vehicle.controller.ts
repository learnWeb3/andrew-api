import {
  ConflictException,
  Controller,
  Get,
  Inject,
  Param,
  UseGuards,
  forwardRef,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
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
  RectrictForRoleAndResourceGuard,
  RestrictForRoleAndResource,
} from 'src/lib/guards/restrict-for-roles.guards';
import { ResourceType } from 'src/lib/interfaces/resource-type.enum';
import { VehicleDocument } from 'src/vehicle/vehicle/vehicle.schema';
import { VehicleService } from 'src/vehicle/vehicle/vehicle.service';

@UseGuards(KeycloakAuthGuard)
@ApiTags('vehicle')
@Controller('api/vehicle')
export class VehicleController {
  constructor(
    @Inject(forwardRef(() => VehicleService))
    private vehicleService: VehicleService,
  ) {}

  @ApiOperation({
    summary: 'Get a paginated list of vehicles',
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
  @KeycloakRoles([
    KeycloakAvailableRoles.INSURER,
    KeycloakAvailableRoles.SUPERADMIN,
    KeycloakAvailableRoles.USER,
  ])
  @Get('')
  findAll(
    @KeycloakRolesMongoQueryFilters() queryFilters: Record<string, any>,
    @Paginated() pagination: Pagination,
    @SortFiltered() sortFilters: SortFilters,
  ) {
    const filters = {
      ...queryFilters,
    };
    return this.vehicleService.findAll(filters, pagination, sortFilters);
  }

  @ApiOperation({
    summary: 'Get a vehicle details',
    description:
      'Result is scoped to the user owned vehicles if user has a user role',
  })
  @ApiBearerAuth('Any Role RBAC JWT access token')
  @KeycloakRoles([
    KeycloakAvailableRoles.INSURER,
    KeycloakAvailableRoles.SUPERADMIN,
    KeycloakAvailableRoles.USER,
  ])
  @RestrictForRoleAndResource({
    [KeycloakAvailableRoles.USER]: {
      [ResourceType.VEHICLE]: async (model, request) =>
        await model
          .findOne({
            _id: request.params.id,
          })
          .then((data: VehicleDocument) => {
            const check = data.customer === request.user._id;
            if (!check) {
              throw new ConflictException(
                `vehicle must be linked to the currently authenticated user`,
              );
            }
            return check;
          }),
    },
  })
  @UseGuards(RectrictForRoleAndResourceGuard)
  @Get(':id')
  findOne(@Param('id') vehicleId: string) {
    return this.vehicleService.findOne({
      _id: vehicleId,
    });
  }
  @ApiOperation({
    summary: 'Get a paginated list of devices for a vehicle',
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
  @KeycloakRoles([
    KeycloakAvailableRoles.INSURER,
    KeycloakAvailableRoles.SUPERADMIN,
    KeycloakAvailableRoles.USER,
  ])
  @RestrictForRoleAndResource({
    [KeycloakAvailableRoles.USER]: {
      [ResourceType.VEHICLE]: async (model, request) =>
        await model
          .findOne({
            _id: request.params.id,
          })
          .then((data: VehicleDocument) => {
            const check = data.customer === request.user._id;
            if (!check) {
              throw new ConflictException(
                `vehicle must be linked to the currently authenticated user`,
              );
            }
            return check;
          }),
    },
  })
  @UseGuards(RectrictForRoleAndResourceGuard)
  @Get(':id/device')
  findOneDevices(
    @Param('id') vehicleId: string,
    @KeycloakRolesMongoQueryFilters() queryFilters: Record<string, any>,
    @Paginated() pagination: Pagination,
    @SortFiltered() sortFilters: SortFilters,
  ) {
    return this.vehicleService.findOneDevices(
      vehicleId,
      {
        vehicle: vehicleId,
        ...queryFilters,
      },
      pagination,
      sortFilters,
    );
  }
}
