import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import CredentialRepresentation from '@keycloak/keycloak-admin-client/lib/defs/credentialRepresentation';
import { RoleMappingPayload } from '@keycloak/keycloak-admin-client/lib/defs/roleRepresentation';
import { Injectable } from '@nestjs/common';
import { generate } from 'generate-password';

@Injectable()
export class KeycloakAdminService {
  private CLIENT_SECRET = process.env.KEYCLOAK_ADMIN_CLIENT_SECRET;
  private CLIENT_ID = process.env.KEYCLOAK_ADMIN_CLIENT_ID;
  private kcAdminClient: KeycloakAdminClient;
  constructor() {
    this.kcAdminClient = new KeycloakAdminClient({
      baseUrl: process.env.KEYCLOAK_BASE_URL,
      realmName: process.env.KEYCLOAK_REALM_NAME,
    });
  }

  async authenticate() {
    await this.kcAdminClient.auth({
      clientId: this.CLIENT_ID,
      clientSecret: this.CLIENT_SECRET,
      grantType: 'client_credentials',
    });
  }

  public async deleteDeviceClient(id: string) {
    await this.authenticate();
    return await this.kcAdminClient.clients.del({
      id,
    });
  }

  public async createUser(
    userData: {
      firstName: string;
      lastName: string;
      email: string;
    },
    insurer: boolean = false,
    keycloakOptions: {
      realm: string;
      defaultUserRoleName: string;
      inusurerRoleName: string;
    } = {
      realm: 'andrew',
      defaultUserRoleName: 'default-roles-andrew',
      inusurerRoleName: 'default-supervisor-roles',
    },
  ): Promise<{ id: string; password: string }> {
    try {
      await this.authenticate();
      const user = await this.kcAdminClient.users.create({
        username: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        emailVerified: true,
        enabled: true,
      });

      if (insurer) {
        await this.makeInsurer(
          user.id,
          keycloakOptions.realm,
          keycloakOptions.defaultUserRoleName,
          keycloakOptions.inusurerRoleName,
        );
      }

      const password = this.generatePassword();

      // console.log(`==> password ${password}`);

      await this.setUserPassword(user.id, password);

      await this.setUpdatePasswordAction(user.id).catch((error) =>
        console.log(error),
      );

      return { id: user.id, password };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  private generatePassword() {
    return generate({
      length: 24,
      numbers: true,
    });
  }

  private async setUserPassword(userId: string, password: string) {
    await this.kcAdminClient.users.resetPassword({
      id: userId,
      credential: {
        temporary: false,
        type: 'password',
        value: password,
      },
    });
  }

  private async makeInsurer(
    userId: string,
    realm: string,
    defaultUserRoleName: string,
    inusurerRoleName: string,
  ) {
    const insurerRole = await this.kcAdminClient.roles.findOneByName({
      realm: realm,
      name: inusurerRoleName,
    });

    const defaultRole = await this.kcAdminClient.roles.findOneByName({
      realm: realm,
      name: defaultUserRoleName,
    });

    await this.kcAdminClient.users.delRealmRoleMappings({
      id: userId,
      roles: [
        {
          id: defaultRole.id,
          name: defaultRole.name,
        } as RoleMappingPayload,
      ],
    });

    await this.kcAdminClient.users.addRealmRoleMappings({
      id: userId,
      roles: [
        { id: insurerRole.id, name: insurerRole.name } as RoleMappingPayload,
      ],
    });
  }

  private async setUpdatePasswordAction(userId: string) {
    const executeAction = {
      type: 'UPDATE_PASSWORD',
      clientId: 'andrew-app',
      id: userId,
      requiredAction: 'UPDATE_PASSWORD',
    };

    await this.kcAdminClient.users.executeActionsEmail(executeAction);
  }

  public async enableDeviceClient(deviceClientId: string, realm: string) {
    const client = await this.kcAdminClient.clients.findOne({
      id: deviceClientId,
      realm,
    });

    await this.kcAdminClient.clients.update(
      {
        id: client.id,
        realm,
      },
      {
        enabled: true,
      },
    );
  }

  public async disableDeviceClient(deviceClientId: string, realm: string) {
    const client = await this.kcAdminClient.clients.findOne({
      id: deviceClientId,
      realm,
    });

    await this.kcAdminClient.clients.update(
      {
        id: client.id,
        realm,
      },
      {
        enabled: false,
      },
    );
  }

  public async createDeviceClientWithRole(
    realm: string,
    clientId: string,
    roleName: string = 'device',
    defaultRoleName: string = 'default-roles-andrew',
  ): Promise<CredentialRepresentation> {
    try {
      await this.authenticate();

      const deviceRole = await this.kcAdminClient.roles.findOneByName({
        realm,
        name: roleName,
      });

      const defaultRole = await this.kcAdminClient.roles.findOneByName({
        realm,
        name: defaultRoleName,
      });

      const createdClient = await this.kcAdminClient.clients.create({
        realm,
        clientId,
        enabled: true,
        serviceAccountsEnabled: true,
        authorizationServicesEnabled: true,
      });

      const serviceAccountUser =
        await this.kcAdminClient.clients.getServiceAccountUser({
          id: createdClient.id,
        });

      await this.kcAdminClient.users.delRealmRoleMappings({
        id: serviceAccountUser.id,
        roles: [
          {
            id: defaultRole.id,
            name: defaultRole.name,
          },
        ],
      });

      await this.kcAdminClient.users.addRealmRoleMappings({
        id: serviceAccountUser.id,
        roles: [deviceRole as RoleMappingPayload],
      });

      const roleMapper = {
        name: 'device-role-mapper',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-usermodel-realm-role-mapper',
        config: {
          'claim.name': 'roles',
          fullGroupPath: true,
          addToIdToken: true,
          addToAccessToken: true,
          tokenClaimName: 'roles',
          'access.token.claim': true,
          multivalued: true,
        },
      };

      await this.kcAdminClient.clients.addMultipleProtocolMappers(
        { id: createdClient.id },
        [roleMapper],
      );

      const credential = await this.kcAdminClient.clients.getClientSecret({
        id: createdClient.id,
      });

      return credential;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
