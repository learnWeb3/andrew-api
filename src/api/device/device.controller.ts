import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
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
@ApiTags('device')
@Controller('api/device')
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @ApiOperation({
    summary: 'Get a paginated list of devices',
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
    name: 'status',
    enum: DeviceStatus,
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
    @StatusFiltered(DeviceStatus.PAIRED)
    statusFilters: StatusFilters<DeviceStatus>,
    @SortFiltered() sortFilters: SortFilters,
    @KeycloakRolesMongoQueryFilters() queryFilters: Record<string, any>,
  ) {
    return this.deviceService.findAll(
      {
        ...queryFilters,
        ...statusFilters,
        serialNumber: { $regex: `^.*${searchValue}.*$`, $options: 'i' },
      },
      pagination,
      sortFilters,
    );
  }

  @ApiOperation({
    summary: 'Get device detail',
    description:
      'Result is scoped to the user owned devices if user has a user role',
  })
  @ApiBearerAuth('Any Role RBAC JWT access token')
  @KeycloakRoles([
    KeycloakAvailableRoles.INSURER,
    KeycloakAvailableRoles.SUPERADMIN,
    KeycloakAvailableRoles.USER,
  ])
  @Get(':id')
  findOne(@Param('id') deviceId: string) {
    return this.deviceService.findOne(
      {
        _id: deviceId,
      },
      ['customer', 'vehicle'],
    );
  }

  @ApiOperation({
    summary: 'Create a device',
    description: 'Only superadmin can create new devices',
  })
  @ApiBearerAuth('Superadmin Role RBAC JWT access token')
  @KeycloakRoles([KeycloakAvailableRoles.SUPERADMIN])
  @Post('')
  create(@Body() createDeviceDto: CreateDeviceDto) {
    return this.deviceService.create(createDeviceDto);
  }

  @ApiOperation({
    summary: 'Disable a device',
    description: 'Only superadmin and insurer can disable a device',
  })
  @ApiBearerAuth('Supervisor or Superadmin Role RBAC JWT access token')
  @KeycloakRoles([
    KeycloakAvailableRoles.INSURER,
    KeycloakAvailableRoles.SUPERADMIN,
  ])
  @Post(':id/disable')
  dissable(@Param('id') deviceId: string) {
    return this.deviceService.disable(deviceId);
  }

  @ApiOperation({
    summary: 'Update a device attributes',
    description: 'Only superadmin and insurer can update a device attributes',
  })
  @ApiBearerAuth('Supervisor or Superadmin Role RBAC JWT access token')
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
