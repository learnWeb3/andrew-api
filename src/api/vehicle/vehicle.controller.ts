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
@Controller('api/vehicle')
export class VehicleController {
  constructor(
    @Inject(forwardRef(() => VehicleService))
    private vehicleService: VehicleService,
  ) {}

  @KeycloakRoles([
    KeycloakAvailableRoles.INSURER,
    KeycloakAvailableRoles.SUPERADMIN,
  ])
  @Get('')
  findAll(
    @Paginated() pagination: Pagination,
    @SortFiltered() sortFilters: SortFilters,
  ) {
    return this.vehicleService.findAll({}, pagination, sortFilters);
  }
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
