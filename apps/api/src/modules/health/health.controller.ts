import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { PrismaService } from '../../database/prisma.service';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health')
  @ApiOperation({ summary: 'Basic health check' })
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness check with database connectivity' })
  async getReadiness() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        ready: true,
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException({
        ready: false,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
