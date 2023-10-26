import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrganizationModule } from './organization/organization.module';
import { CustomerModule } from './customer/customer.module';
import { ContractModule } from './contract/contract.module';
import { DeviceModule } from './device/device.module';
import { VehicleModule } from './vehicle/vehicle.module';
import { ApiModule } from './api/api.module';
import { KeycloakModule } from './keycloak/keycloak.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ...(process.env.NODE_ENV !== 'production'
      ? [ConfigModule.forRoot({ envFilePath: '.env.development' })]
      : []),
    OrganizationModule,
    CustomerModule,
    ContractModule,
    DeviceModule,
    VehicleModule,
    ApiModule,
    KeycloakModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
