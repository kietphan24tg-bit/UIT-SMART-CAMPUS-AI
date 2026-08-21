import { Logger } from '@nestjs/common';
import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { connect, type IClientOptions, type MqttClient } from 'mqtt';

import { TelemetryDto } from './dto/telemetry.dto';
import { IotService } from './iot.service';

const DEFAULT_MQTT_TELEMETRY_TOPIC = 'uit/parking/telemetry';
const DEFAULT_MQTT_CLIENT_ID = 'smart-campus-api';

function normalizeString(value: unknown) {
  return String(value ?? '').trim();
}

@Injectable()
export class MqttTelemetrySubscriber implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttTelemetrySubscriber.name);
  private client?: MqttClient;

  constructor(
    private readonly configService: ConfigService,
    private readonly iotService: IotService,
  ) {}

  onModuleInit() {
    const enabled = this.configService.get<boolean>('IOT_MQTT_ENABLED', false);
    const brokerUrl = normalizeString(
      this.configService.get<string>('IOT_MQTT_BROKER_URL'),
    );

    if (!enabled || !brokerUrl) {
      this.logger.log('MQTT telemetry subscriber disabled.');
      return;
    }

    const clientId =
      normalizeString(this.configService.get<string>('IOT_MQTT_CLIENT_ID')) ||
      DEFAULT_MQTT_CLIENT_ID;
    const username = normalizeString(
      this.configService.get<string>('IOT_MQTT_USERNAME'),
    );
    const password = normalizeString(
      this.configService.get<string>('IOT_MQTT_PASSWORD'),
    );

    const options: IClientOptions = {
      clientId,
      reconnectPeriod: 5_000,
      connectTimeout: 10_000,
      keepalive: 30,
      clean: true,
      ...(username ? { username } : {}),
      ...(password ? { password } : {}),
    };

    this.client = connect(brokerUrl, options);
    this.client.on('connect', () => this.handleConnect());
    this.client.on('message', (topic, payload) => {
      void this.handleMessage(topic, payload);
    });
    this.client.on('reconnect', () => {
      this.logger.warn('Reconnecting to MQTT broker...');
    });
    this.client.on('error', (error) => {
      this.logger.error(`MQTT client error: ${error.message}`);
    });
    this.client.on('offline', () => {
      this.logger.warn('MQTT client is offline.');
    });
  }

  onModuleDestroy() {
    this.client?.end(true);
  }

  private handleConnect() {
    const topic =
      normalizeString(
        this.configService.get<string>('IOT_MQTT_TELEMETRY_TOPIC'),
      ) || DEFAULT_MQTT_TELEMETRY_TOPIC;

    this.client?.subscribe(topic, (error) => {
      if (error) {
        this.logger.error(`Failed to subscribe to ${topic}: ${error.message}`);
        return;
      }

      this.logger.log(`Subscribed to MQTT telemetry topic: ${topic}`);
    });
  }

  private async handleMessage(topic: string, payload: Buffer) {
    const expectedTopic =
      normalizeString(
        this.configService.get<string>('IOT_MQTT_TELEMETRY_TOPIC'),
      ) || DEFAULT_MQTT_TELEMETRY_TOPIC;

    if (topic !== expectedTopic) {
      return;
    }

    try {
      const parsed = JSON.parse(payload.toString('utf8')) as Record<string, unknown>;
      const dto = this.validateTelemetryPayload(parsed);
      await this.iotService.recordTelemetryFromMqtt(dto);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Invalid MQTT telemetry payload: ${message}`);
    }
  }

  private validateTelemetryPayload(payload: Record<string, unknown>) {
    const dto = plainToInstance(TelemetryDto, payload, {
      enableImplicitConversion: true,
    });
    const errors = validateSync(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      throw new Error(errors.toString());
    }

    return dto;
  }
}
