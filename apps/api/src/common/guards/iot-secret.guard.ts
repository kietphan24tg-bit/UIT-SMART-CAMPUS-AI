import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class IotSecretGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const incomingSecret = request.headers['x-iot-secret'];
    const expectedSecret =
      this.configService.get<string>('IOT_SHARED_SECRET') || 'change-me';

    if (!incomingSecret || incomingSecret !== expectedSecret) {
      throw new UnauthorizedException('Invalid IoT secret');
    }

    return true;
  }
}
