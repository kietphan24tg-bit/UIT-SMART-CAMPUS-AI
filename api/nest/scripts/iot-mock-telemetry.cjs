/**
 * Mock gateway: gá»­i POST /api/v1/iot/telemetry Ä‘á»‹nh ká»³ Ä‘á»ƒ dev cÃ³ dá»¯ liá»‡u realtime
 * (khÃ´ng thay tháº¿ gateway tháº­t â€” chá»‰ má»Ÿ pipeline khi chÆ°a cÃ³ thiáº¿t bá»‹).
 *
 * Cháº¡y: pnpm exec node scripts/iot-mock-telemetry.cjs   (tá»« thÆ° má»¥c api/nest)
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const BASE_URL = process.env.IOT_MOCK_API_BASE_URL || 'http://localhost:3000';
const TELEMETRY_PATH = '/api/v1/iot/telemetry';
const SECRET = process.env.IOT_SHARED_SECRET || 'change-me';
const GATE_ID = process.env.IOT_MOCK_GATE_ID || 'uit-gate-a';
const INTERVAL_MS = Number(process.env.IOT_MOCK_INTERVAL_MS) || 8000;

function buildPayload() {
  const t = Date.now();
  const wave = Math.sin(t / 20000);
  const occupied1 = (t >> 12) % 3 !== 0;
  const occupied2 = (t >> 11) % 4 !== 0;

  return {
    gateId: GATE_ID,
    deviceIp: process.env.IOT_MOCK_DEVICE_IP || '192.168.88.10',
    slots: [
      { slotNumber: 'A1', zone: 'Main', isOccupied: occupied1 },
      { slotNumber: 'A2', zone: 'Main', isOccupied: occupied2 },
    ],
    temperature: Math.round((28 + wave * 3 + Math.random() * 0.6) * 10) / 10,
    humidity: Math.round((65 + wave * 8 + Math.random() * 2) * 10) / 10,
    rainDetected: false,
    fireDetected: false,
    reportedAt: new Date().toISOString(),
  };
}

async function sendOnce() {
  const url = new URL(TELEMETRY_PATH, BASE_URL).toString();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-iot-secret': SECRET,
    },
    body: JSON.stringify(buildPayload()),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`[iot-mock] ${res.status} ${res.statusText}`, text.slice(0, 300));
    return;
  }
  console.warn(`[iot-mock] OK ${new Date().toISOString()} gate=${GATE_ID}`);
}

async function main() {
  console.warn(
    `[iot-mock] â†’ ${new URL(TELEMETRY_PATH, BASE_URL).toString()} má»—i ${INTERVAL_MS}ms (Ctrl+C dá»«ng)`,
  );
  await sendOnce();
  setInterval(() => {
    void sendOnce();
  }, INTERVAL_MS);
}

main().catch((err) => {
  console.error('[iot-mock] fatal', err);
  process.exit(1);
});
