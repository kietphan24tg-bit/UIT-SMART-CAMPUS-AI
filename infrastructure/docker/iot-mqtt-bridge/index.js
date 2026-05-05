const { connect } = require('mqtt');

const DEFAULT_MQTT_BROKER_URL = 'mqtt://mqtt:1883';
const DEFAULT_MQTT_CLIENT_ID = 'smart-campus-mqtt-bridge';
const DEFAULT_MQTT_TELEMETRY_TOPIC = 'uit/parking/telemetry';
const DEFAULT_API_TELEMETRY_URL = 'http://api:3000/api/v1/iot/telemetry';
const DEFAULT_HTTP_TIMEOUT_MS = 15000;
const DEFAULT_RETRY_DELAY_MS = 3000;
const DEFAULT_MAX_RETRIES = 3;

function env(name, fallback = '') {
  const value = process.env[name];
  return typeof value === 'string' ? value.trim() : fallback;
}

function envNumber(name, fallback) {
  const parsed = Number(env(name, ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function postTelemetry(rawPayload) {
  const url = env('IOT_MQTT_BRIDGE_API_URL', DEFAULT_API_TELEMETRY_URL);
  const secret = env('IOT_SHARED_SECRET', 'change-me');
  const timeoutMs = envNumber('IOT_MQTT_BRIDGE_HTTP_TIMEOUT_MS', DEFAULT_HTTP_TIMEOUT_MS);
  const maxRetries = envNumber('IOT_MQTT_BRIDGE_MAX_RETRIES', DEFAULT_MAX_RETRIES);
  const retryDelayMs = envNumber('IOT_MQTT_BRIDGE_RETRY_DELAY_MS', DEFAULT_RETRY_DELAY_MS);

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-iot-secret': secret,
        },
        body: rawPayload,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`HTTP ${response.status}: ${body}`);
      }

      console.log(`[bridge] forwarded telemetry -> ${response.status}`);
      return;
    } catch (error) {
      clearTimeout(timeout);
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[bridge] forward failed (attempt ${attempt}/${maxRetries}): ${message}`);

      if (attempt < maxRetries) {
        await delay(retryDelayMs);
      }
    }
  }

  throw new Error('bridge exhausted retry budget');
}

function parseAndNormalizePayload(rawPayload) {
  const parsed = JSON.parse(rawPayload);
  const slots = Array.isArray(parsed.slots) ? parsed.slots : [];

  return JSON.stringify({
    gateId: String(parsed.gateId || '').trim(),
    deviceIp: parsed.deviceIp ? String(parsed.deviceIp).trim() : undefined,
    slotBitmap: parsed.slotBitmap ? String(parsed.slotBitmap).trim() : undefined,
    slots: slots.map((slot, index) => ({
      slotNumber: String(slot?.slotNumber || `A${index + 1}`).trim(),
      zone: slot?.zone ? String(slot.zone).trim() : undefined,
      occupied: Boolean(slot?.occupied ?? slot?.isOccupied),
    })),
    temperature:
      typeof parsed.temperature === 'number' && Number.isFinite(parsed.temperature)
        ? parsed.temperature
        : undefined,
    humidity:
      typeof parsed.humidity === 'number' && Number.isFinite(parsed.humidity)
        ? parsed.humidity
        : undefined,
    rainDetected: Boolean(parsed.rainDetected),
    fireDetected: Boolean(parsed.fireDetected),
    reportedAt:
      typeof parsed.reportedAt === 'string' && parsed.reportedAt.trim().length > 0
        ? parsed.reportedAt.trim()
        : new Date().toISOString(),
  });
}

function startBridge() {
  const brokerUrl = env('IOT_MQTT_BROKER_URL', DEFAULT_MQTT_BROKER_URL);
  const topic = env('IOT_MQTT_TELEMETRY_TOPIC', DEFAULT_MQTT_TELEMETRY_TOPIC);
  const clientId = env('IOT_MQTT_BRIDGE_CLIENT_ID', DEFAULT_MQTT_CLIENT_ID);
  const username = env('IOT_MQTT_USERNAME', '');
  const password = env('IOT_MQTT_PASSWORD', '');

  console.log(`[bridge] starting with broker=${brokerUrl} topic=${topic}`);

  const client = connect(brokerUrl, {
    clientId,
    reconnectPeriod: 5000,
    connectTimeout: 10000,
    keepalive: 30,
    clean: true,
    ...(username ? { username } : {}),
    ...(password ? { password } : {}),
  });

  client.on('connect', () => {
    console.log('[bridge] connected to MQTT broker');
    client.subscribe(topic, (error) => {
      if (error) {
        console.error(`[bridge] subscribe failed: ${error.message}`);
        return;
      }

      console.log(`[bridge] subscribed to ${topic}`);
    });
  });

  client.on('reconnect', () => {
    console.warn('[bridge] reconnecting to MQTT broker...');
  });

  client.on('offline', () => {
    console.warn('[bridge] MQTT client offline');
  });

  client.on('error', (error) => {
    console.error(`[bridge] MQTT error: ${error.message}`);
  });

  client.on('message', async (messageTopic, payloadBuffer) => {
    if (messageTopic !== topic) {
      return;
    }

    try {
      const rawPayload = payloadBuffer.toString('utf8');
      const normalizedPayload = parseAndNormalizePayload(rawPayload);
      await postTelemetry(normalizedPayload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[bridge] message handling failed: ${message}`);
    }
  });
}

startBridge();
