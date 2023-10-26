import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { KeycloakService } from './keycloak.service';

@Injectable()
export class KeycloakAuthGuard implements CanActivate {
  constructor(private keycloakService: KeycloakService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorizationHeader = request.headers?.['authorization'] || null;
    if (!authorizationHeader) {
      throw new ForbiddenException(`missing authorization headers`);
    }
    const match = /^Bearer\s.+/.test(authorizationHeader);
    if (!match) {
      throw new UnauthorizedException(`Authorization header was malformed, ex`);
    }
    const accessToken = authorizationHeader.replaceAll('Bearer ', '');

    await this.keycloakService.verify(accessToken, {
      issuer: 'https://login.students-epitech.ovh/realms/andrew',
      audience: 'andrew-app',
    });

    return;
  }
}
