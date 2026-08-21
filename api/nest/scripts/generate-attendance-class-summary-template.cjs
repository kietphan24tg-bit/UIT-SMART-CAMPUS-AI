const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const OUTPUT_DIR = path.resolve(__dirname, '../../../docs/samples');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'attendance-class-summary-template.xlsx');

const sampleSessions = [
  { label: '27/04', time: '07:30-09:45' },
  { label: '29/04', time: '07:30-09:45' },
  { label: '02/05', time: '07:30-09:45' },
  { label: '04/05', time: '07:30-09:45' },
];

const sampleStudents = [
  {
    index: 1,
    studentId: '22520001',
    fullName: 'Nguyen Van A',
    email: '22520001@gm.uit.edu.vn',
    statuses: ['Co mat', 'Co mat', 'Muon', 'Co mat'],
  },
  {
    index: 2,
    studentId: '22520002',
    fullName: 'Tran Thi B',
    email: '22520002@gm.uit.edu.vn',
    statuses: ['Vang', 'Co mat', 'Co mat', 'Co mat'],
  },
  {
    index: 3,
    studentId: '22520003',
    fullName: 'Le Minh C',
    email: '22520003@gm.uit.edu.vn',
    statuses: ['Co mat', 'Vang', 'Co mat', 'Mien'],
  },
  {
    index: 4,
    studentId: '22520004',
    fullName: 'Pham Gia D',
    email: '22520004@gm.uit.edu.vn',
    statuses: ['Co mat', 'Co mat', 'Co mat', 'Co mat'],
  },
];

function applyBorder(cell, color = 'FFD7E0EA') {
  cell.border = {
    top: { style: 'thin', color: { argb: color } },
    left: { style: 'thin', color: { argb: color } },
    bottom: { style: 'thin', color: { argb: color } },
    right: { style: 'thin', color: { argb: color } },
  };
}

function applyStatusStyle(cell, value) {
  const toneByStatus = {
    'Co mat': { fill: 'FFE8F7EC', text: 'FF146C2E' },
    Vang: { fill: 'FFFCE8E6', text: 'FFC5221F' },
    Muon: { fill: 'FFFFF4E5', text: 'FF9A6700' },
    Mien: { fill: 'FFE8F0FE', text: 'FF175CD3' },
  };

  const tone = toneByStatus[value] || { fill: 'FFF8FAFC', text: 'FF344054' };
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: tone.fill },
  };
  cell.font = { color: { argb: tone.text }, bold: true, size: 11 };
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Tong hop diem danh');
  const lastColumnIndex = 4 + sampleSessions.length;
  const lastColumnLetter = String.fromCharCode(64 + lastColumnIndex);

  worksheet.views = [{ state: 'frozen', ySplit: 7, xSplit: 3 }];
  worksheet.properties.defaultRowHeight = 22;
  worksheet.columns = [
    { key: 'index', width: 8 },
    { key: 'studentId', width: 16 },
    { key: 'fullName', width: 28 },
    { key: 'email', width: 30 },
    ...sampleSessions.map(() => ({ width: 16 })),
  ];

  worksheet.mergeCells(`A1:${lastColumnLetter}1`);
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'BAO CAO TONG HOP DIEM DANH THEO LOP';
  titleCell.font = { bold: true, size: 16 };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  const infoRows = [
    ['Mon hoc', 'Phan tich yeu cau phan mem - VN'],
    ['Ma mon', 'SE104'],
    ['Ma lop', 'SE104.Q21'],
    ['Giang vien', 'Nguyen Hoang Phuc'],
    ['Tong sinh vien', String(sampleStudents.length)],
  ];

  infoRows.forEach(([label, value], index) => {
    const rowNumber = index + 3;
    worksheet.getCell(`A${rowNumber}`).value = label;
    worksheet.getCell(`A${rowNumber}`).font = { bold: true, size: 11 };
    worksheet.getCell(`B${rowNumber}`).value = value;
    worksheet.mergeCells(`B${rowNumber}:D${rowNumber}`);
    worksheet.getCell(`B${rowNumber}`).alignment = { horizontal: 'left' };
  });

  const legendCell = worksheet.getCell(`F3`);
  legendCell.value = 'Chu thich';
  legendCell.font = { bold: true, size: 11 };

  const legendItems = [
    ['F4', 'Co mat'],
    ['F5', 'Vang'],
    ['G4', 'Muon'],
    ['G5', 'Mien'],
  ];

  legendItems.forEach(([cellRef, value]) => {
    const cell = worksheet.getCell(cellRef);
    cell.value = value;
    applyStatusStyle(cell, value);
    applyBorder(cell);
  });

  const headerRowNumber = 7;
  const headerRow = worksheet.getRow(headerRowNumber);
  headerRow.height = 34;
  headerRow.getCell(1).value = 'STT';
  headerRow.getCell(2).value = 'MSSV';
  headerRow.getCell(3).value = 'Ho va ten';
  headerRow.getCell(4).value = 'Email';

  sampleSessions.forEach((session, index) => {
    const cell = headerRow.getCell(5 + index);
    cell.value = `${session.label}\n${session.time}`;
  });

  headerRow.eachCell((cell) => {
    cell.font = { bold: true, size: 11 };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEAF3FF' },
    };
    applyBorder(cell, 'FFC9D7E6');
  });

  sampleStudents.forEach((student) => {
    const row = worksheet.addRow([
      student.index,
      student.studentId,
      student.fullName,
      student.email,
      ...student.statuses,
    ]);

    row.height = 24;
    row.eachCell((cell, colNumber) => {
      applyBorder(cell);
      if (colNumber >= 5) {
        applyStatusStyle(cell, String(cell.value || ''));
      } else {
        cell.alignment = { vertical: 'middle' };
      }
    });
  });

  const footerRowNumber = worksheet.lastRow.number + 2;
  worksheet.mergeCells(`A${footerRowNumber}:${lastColumnLetter}${footerRowNumber}`);
  const footerCell = worksheet.getCell(`A${footerRowNumber}`);
  footerCell.value =
    'Mau nay minh hoa cho API export tong hop theo lop: moi cot la mot phien diem danh, moi dong la mot sinh vien.';
  footerCell.font = { italic: true, size: 10, color: { argb: 'FF667085' } };

  await workbook.xlsx.writeFile(OUTPUT_FILE);
  console.log(OUTPUT_FILE);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
