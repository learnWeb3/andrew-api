import { Module } from '@nestjs/common';
import { KeycloakService } from './keycloak/keycloak.service';
import { KeycloakAdminService } from './keycloak-admin/keycloak-admin.service';

@Module({
  providers: [KeycloakService, KeycloakAdminService],
  exports: [KeycloakService, KeycloakAdminService],
})
export class KeycloakModule {}
