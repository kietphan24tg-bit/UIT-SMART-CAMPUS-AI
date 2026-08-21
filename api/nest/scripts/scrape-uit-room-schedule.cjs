const fs = require('node:fs');
const path = require('node:path');

const axios = require('axios');
const cheerio = require('cheerio');

const SOURCE_URL = 'https://student.uit.edu.vn/lichphong';
const OUTPUT_PATH = path.resolve(__dirname, '..', 'prisma', 'fixtures', 'uit-room-schedule.snapshot.json');

const decode = (value) => JSON.parse(`"${value}"`);

const SPORT_ROOM_CODES = new Set([
  decode('Ph\\u00f2ng B\\u00f3ng B\\u00e0n'),
  decode('S\\u00e2n B\\u00f3ng Chuy\\u1ec1n'),
  decode('S\\u00e2n B\\u00f3ng R\\u1ed5'),
  decode('S\\u00e2n B\\u00f3ng \\u0110\\u00e1'),
  decode('S\\u00e2n C\\u1ea7u L\\u00f4ng'),
  'Sân Pickleball 01',
  'Sân Pickleball 02',
  'Sân Pickleball 03',
  decode('S\\u00e2n V\\u00f5 Thu\\u1eadt'),
]);

function normalize(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function toIsoDate(input) {
  const [day, month, year] = input.split('-');
  return `${year}-${month}-${day}`;
}

function normalizeTime(value) {
  if (!value) {
    return null;
  }

  const [hours, minutes] = value.split(':');
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
}

function parseSlot(rawText) {
  const text = normalize(rawText);
  const timeMatch = text.match(/\(([\d:]+)\s*-\s*([\d:]+)\)/);

  return {
    label: text,
    startTime: normalizeTime(timeMatch?.[1] ?? null),
    endTime: normalizeTime(timeMatch?.[2] ?? null),
  };
}

function inferRoomLocation(roomCode) {
  if (/^A\d{3}$/.test(roomCode)) {
    return { buildingCode: 'A', floorNumber: Number(roomCode[1]) };
  }

  if (/^B\d\.\d{2}$/.test(roomCode)) {
    return { buildingCode: 'B', floorNumber: Number(roomCode[1]) };
  }

  if (/^C\d{3}$/.test(roomCode)) {
    return { buildingCode: 'C', floorNumber: Number(roomCode[1]) };
  }

  if (/^E\d{2}\.\d$/.test(roomCode)) {
    return { buildingCode: 'E', floorNumber: Number(roomCode.slice(1, 3)) };
  }

  if (SPORT_ROOM_CODES.has(roomCode)) {
    return { buildingCode: 'SPORT', floorNumber: 0 };
  }

  return { buildingCode: 'VENUE', floorNumber: 0 };
}

function inferRoomType(roomCode, displayName) {
  if (SPORT_ROOM_CODES.has(roomCode)) {
    return 'meeting';
  }

  if (
    displayName === decode('Ph\\u00f2ng H\\u1ecdp') ||
    roomCode === decode('H\\u1ed9i Tr\\u01b0\\u1eddng A') ||
    roomCode === 'HTE' ||
    roomCode === decode('S\\u1ea3nh C')
  ) {
    return 'meeting';
  }

  if (
    displayName === 'PM' ||
    displayName === decode('Ph\\u00f2ng m\\u00e1y') ||
    displayName === decode('Ph\\u00f2ng Th\\u1ef1c h\\u00e0nh Thi\\u1ebft k\\u1ebf vi m\\u1ea1ch s\\u1ed1')
  ) {
    return 'lab';
  }

  return 'classroom';
}

function extractAttendeeCount(text) {
  const match = text.match(/Sĩ số:\s*(\d+)/i);
  return match ? Number(match[1]) : null;
}

function cleanTitle(text) {
  return normalize(text.replace(/Sĩ số:\s*\d+/gi, ''));
}

function parseBookingCell($, cell) {
  const rawTitle = normalize($(cell).find('.title').first().text()) || normalize($(cell).text());
  const attendeeCount = extractAttendeeCount(rawTitle);
  const title = cleanTitle(rawTitle);
  const instructorNames = $(cell)
    .find('.description li')
    .map((_, item) => normalize($(item).text()))
    .get()
    .filter(Boolean);
  const description = normalize($(cell).find('.description').first().text());
  const rowspan = Number($(cell).attr('rowspan') || '1');
  const isTeaching = description.includes('Giảng viên:') || instructorNames.length > 0;

  return {
    title,
    attendeeCount,
    description: description || null,
    instructorNames,
    rowspan,
    createdBy: isTeaching ? 'lecturer' : 'admin',
    purpose: isTeaching ? 'Giảng dạy' : description || title,
    contactName: isTeaching ? instructorNames[0] ?? null : null,
    departmentName: isTeaching ? null : title || null,
  };
}

async function main() {
  const response = await axios.get(SOURCE_URL, {
    timeout: 30000,
    responseType: 'arraybuffer',
  });
  const html = new TextDecoder('utf-8').decode(response.data);
  const $ = cheerio.load(html);

  const rooms = new Map();
  const bookings = [];

  $('table').each((_, table) => {
    const headers = $(table)
      .find('thead th')
      .map((__, el) => normalize($(el).text()))
      .get();

    if (headers.length < 3 || headers[0] !== 'Phòng / Thứ') {
      return;
    }

    const dates = headers
      .slice(2)
      .map((header) => header.match(/\((\d{2}-\d{2}-\d{4})\)/)?.[1] ?? null)
      .filter(Boolean);

    const carry = dates.map(() => 0);
    const slotDefs = [];
    let currentRoomCode = null;

    $(table)
      .find('tbody tr')
      .each((__, tr) => {
        const cells = $(tr).children('td').toArray();

        if (!cells.length) {
          return;
        }

        let cellIndex = 0;
        let slotIndex = slotDefs.length % 12;

        if ($(cells[0]).hasClass('room_title')) {
          const roomName = normalize($(cells[0]).find('.room_name').first().text());
          const roomCode = roomName.replace(/\s*\([^)]*\)\s*$/, '');
          const displayNameMatch = roomName.match(/\(([^)]*)\)\s*$/);
          const displayName = displayNameMatch ? normalize(displayNameMatch[1]) : null;
          const capacityText = normalize($(cells[0]).find('.capacity').first().text());
          const capacity = Number(capacityText.match(/(\d+)/)?.[1] ?? 0);
          const location = inferRoomLocation(roomCode);

          rooms.set(roomCode, {
            roomCode,
            displayName,
            capacity,
            type: inferRoomType(roomCode, displayName),
            ...location,
          });

          currentRoomCode = roomCode;
          slotDefs.length = 0;
          carry.fill(0);
          cellIndex = 1;
          slotIndex = 0;
        }

        const slot = parseSlot($(cells[cellIndex]).text());
        slotDefs[slotIndex] = slot;
        cellIndex += 1;

        for (let dayIndex = 0; dayIndex < dates.length; dayIndex += 1) {
          if (carry[dayIndex] > 0) {
            carry[dayIndex] -= 1;
            continue;
          }

          const cell = cells[cellIndex];
          cellIndex += 1;

          if (!cell) {
            continue;
          }

          const cellText = normalize($(cell).text());

          if (!cellText || cellText === '-- ... --') {
            continue;
          }

          const booking = parseBookingCell($, cell);
          const endSlot = slotDefs[slotIndex + booking.rowspan - 1] ?? slot;

          bookings.push({
            roomCode: currentRoomCode,
            bookingDate: toIsoDate(dates[dayIndex]),
            startTime: slot.startTime,
            endTime: endSlot.endTime,
            title: booking.title,
            purpose: booking.purpose,
            attendeeCount: booking.attendeeCount,
            contactName: booking.contactName,
            departmentName: booking.departmentName,
            notes: booking.description,
            createdBy: booking.createdBy,
          });

          carry[dayIndex] = booking.rowspan - 1;
        }
      });
  });

  const snapshot = {
    sourceUrl: SOURCE_URL,
    generatedAt: new Date().toISOString(),
    rooms: [...rooms.values()].sort((a, b) => a.roomCode.localeCompare(b.roomCode, 'en')),
    bookings,
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');

  console.log(
    JSON.stringify(
      {
        outputPath: OUTPUT_PATH,
        rooms: snapshot.rooms.length,
        bookings: snapshot.bookings.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
