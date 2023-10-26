import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { DeviceService } from 'src/device/device/device.service';
import {
  KeycloakAuthGuard,
  KeycloakAvailableRoles,
  KeycloakRoles,
  KeycloakRolesMongoQueryFilters,
} from 'src/keycloak/keycloak/keycloak-auth.guard';
import { Paginated, Pagination } from 'src/lib/decorators/pagination.decorator';
import { SearchValue } from 'src/lib/decorators/search-value.decorators';
import {
  SortFiltered,
  SortFilters,
} from 'src/lib/decorators/sort-filters.decorators';
import {
  StatusFiltered,
  StatusFilters,
} from 'src/lib/decorators/status-filters.decorators';
import { CreateDeviceDto } from 'src/lib/dto/create-device.dto';
import { UpdateDeviceDto } from 'src/lib/dto/update-device.dto';
import { DeviceStatus } from 'src/lib/interfaces/device-status.enum';

@UseGuards(KeycloakAuthGuard)
@Controller('api/device')
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @KeycloakRoles([
    KeycloakAvailableRoles.INSURER,
    KeycloakAvailableRoles.SUPERADMIN,
  ])
  @Get('')
  findAll(
    @SearchValue() searchValue: string,
    @Paginated() pagination: Pagination,
    @StatusFiltered(DeviceStatus.PAIRED)
    statusFilters: StatusFilters<DeviceStatus>,
    @SortFiltered() sortFilters: SortFilters,
    @KeycloakRolesMongoQueryFilters() queryFilters: Record<string, any>,
  ) {
    return this.deviceService.findAll(
      {
        ...queryFilters,
        ...statusFilters,
        serialNumber: { $regex: new RegExp(searchValue), $options: 'i' },
      },
      pagination,
      sortFilters,
    );
  }

  @KeycloakRoles([
    KeycloakAvailableRoles.INSURER,
    KeycloakAvailableRoles.SUPERADMIN,
  ])
  @Get(':id')
  findOne(@Param('id') deviceId: string) {
    return this.deviceService.findOne({
      _id: deviceId,
    });
  }

  @KeycloakRoles([KeycloakAvailableRoles.SUPERADMIN])
  @Post('')
  create(@Body() createDeviceDto: CreateDeviceDto) {
    return this.deviceService.create(createDeviceDto);
  }

  @KeycloakRoles([
    KeycloakAvailableRoles.INSURER,
    KeycloakAvailableRoles.SUPERADMIN,
  ])
  @Post(':id/disable')
  dissable(@Param('id') deviceId: string) {
    return this.deviceService.disable(deviceId);
  }

  @KeycloakRoles([
    KeycloakAvailableRoles.INSURER,
    KeycloakAvailableRoles.SUPERADMIN,
  ])
  @Patch(':id')
  update(
    @Param('id') deviceId: string,
    @Body() updateDeviceDto: UpdateDeviceDto,
  ) {
    return this.deviceService.update(deviceId, updateDeviceDto);
  }
}
