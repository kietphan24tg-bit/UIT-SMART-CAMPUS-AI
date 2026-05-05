# IoT MQTT Setup

## Target flow

`ESP32 -> Mosquitto on VPS -> iot-mqtt-bridge -> Smart Campus API -> mobile app`

The mobile app does not connect to MQTT. It keeps using the Smart Campus API.

## What is already expected

- ESP32 firmware publishes JSON telemetry to `uit/parking/telemetry`
- Smart Campus API already exposes `POST /api/v1/iot/telemetry`
- API accepts header `x-iot-secret`

## VPS services

This repo now includes two deployable services in [infrastructure/docker](../infrastructure/docker):

- `mqtt`: Mosquitto broker on port `1883`
- `iot-mqtt-bridge`: subscribes to MQTT and forwards payloads into the API telemetry endpoint

## Environment variables

Set these values in your production `.env` before running Docker Compose:

```env
IOT_SHARED_SECRET=change-me
IOT_MQTT_ENABLED=false
IOT_MQTT_BROKER_URL=mqtt://mqtt:1883
IOT_MQTT_USERNAME=smartcampus_esp32
IOT_MQTT_PASSWORD=replace-with-a-real-password
IOT_MQTT_TELEMETRY_TOPIC=uit/parking/telemetry
IOT_MQTT_BRIDGE_CLIENT_ID=smart-campus-mqtt-bridge
IOT_MQTT_BRIDGE_API_URL=http://api:3000/api/v1/iot/telemetry
```

Notes:

- Keep `IOT_MQTT_ENABLED=false` on the API when using the bridge, otherwise you will consume the same MQTT message twice.
- If the API runs outside this Docker network, set `IOT_MQTT_BRIDGE_API_URL` to the public API URL instead.

## Create the Mosquitto password file

On the VPS:

```sh
cd infrastructure/docker
chmod +x create-mosquitto-passwords.sh
./create-mosquitto-passwords.sh smartcampus_esp32 replace-with-a-real-password
```

That command updates [mosquitto_passwords](../infrastructure/docker/mosquitto_passwords).

## Start the MQTT stack

If your API stack is already deployed with the same compose file:

```sh
cd infrastructure/docker
docker compose -f docker-compose.prod.yml up -d --build mqtt iot-mqtt-bridge
```

If the API service is also part of the same compose deployment and not running yet:

```sh
cd infrastructure/docker
docker compose -f docker-compose.prod.yml up -d --build api mqtt iot-mqtt-bridge nginx
```

## ESP32 firmware values

The ESP32 should use the VPS broker address:

```cpp
#define ESP32_MQTT_HOST "your-vps-ip-or-domain"
#define ESP32_MQTT_PORT 1883
#define ESP32_MQTT_USERNAME "smartcampus_esp32"
#define ESP32_MQTT_PASSWORD "replace-with-a-real-password"
#define ESP32_MQTT_TELEMETRY_TOPIC "uit/parking/telemetry"
```

After updating the values, compile and upload the firmware again.

## Smoke test

From the VPS, subscribe to the telemetry topic:

```sh
docker exec -it smart-campus-mqtt mosquitto_sub \
  -h localhost \
  -p 1883 \
  -u smartcampus_esp32 \
  -P replace-with-a-real-password \
  -t uit/parking/telemetry
```

Then power the ESP32. You should see JSON messages arrive.

Check bridge logs:

```sh
docker logs -f smart-campus-iot-mqtt-bridge
```

Healthy logs look like this:

```txt
[bridge] connected to MQTT broker
[bridge] subscribed to uit/parking/telemetry
[bridge] forwarded telemetry -> 201
```

## What your friend needs later

Nothing changes on the mobile app architecture. Your friend only needs the normal Smart Campus API:

- call existing telemetry or parking endpoints for initial data
- keep using backend realtime/socket if the app already has it

The app does not need MQTT credentials and does not talk to ESP32 directly.
