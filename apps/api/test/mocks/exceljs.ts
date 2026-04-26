class MockCell {
  value: unknown;
  font?: Record<string, unknown>;
  alignment?: Record<string, unknown>;
  fill?: Record<string, unknown>;
  border?: Record<string, unknown>;
}

class MockRow {
  private readonly cells = new Map<number, MockCell>();

  getCell(index: number) {
    if (!this.cells.has(index)) {
      this.cells.set(index, new MockCell());
    }

    return this.cells.get(index)!;
  }

  eachCell(callback: (cell: MockCell, colNumber: number) => void) {
    for (const [index, cell] of this.cells.entries()) {
      callback(cell, index);
    }
  }

  set values(values: unknown[]) {
    values.forEach((value, index) => {
      if (index === 0 || typeof value === 'undefined') {
        return;
      }

      this.getCell(index).value = value;
    });
  }
}

class MockWorksheet {
  columns: unknown[] = [];
  views: unknown[] = [];
  private readonly rows = new Map<number, MockRow>();

  mergeCells(_range: string) {}

  getCell(_address: string) {
    return new MockCell();
  }

  getRow(index: number) {
    if (!this.rows.has(index)) {
      this.rows.set(index, new MockRow());
    }

    return this.rows.get(index)!;
  }

  addRow(data: Record<string, unknown>) {
    const row = new MockRow();
    Object.values(data).forEach((value, index) => {
      row.getCell(index + 1).value = value;
    });
    return row;
  }
}

class MockWorkbook {
  readonly xlsx = {
    writeBuffer: async () => Buffer.from('mock-xlsx'),
  };

  addWorksheet(_name: string) {
    return new MockWorksheet();
  }
}

export default {
  Workbook: MockWorkbook,
};
