/**
 * KH tuần WBS - Config và helper chung
 * Tách từ: 20. KH tuan WBS.js
 * Lưu ý: không tự ý đổi tên hàm public nếu chưa cập nhật menu/onEdit.
 */
const KH_TUAN_WBS_CONFIG = {
  SHEET_TUAN: 'KH_TUAN_WBS',
  SHEET_DATA: 'KH_TUAN_DATA',
  START_ROW: 5,
  SOURCE_CELL: 'B2',
  WEEK_CELL: 'E2',
  TOTAL_COLS: 18,
  TEN_DONG_PHAT_SINH_KHAC: 'Công tác phát sinh khác trong kỳ',
  DATA_META_COLS: 3,
  DATA_PARENT_COLS: 8,

  COL: {
    WBS: 1,
    CV_THANG: 2,
    VIEC_TUAN: 3,
    CHU_TRI: 4,
    PHE_DUYET: 5,
    DEADLINE: 6,
    KET_QUA: 7,
    TY_LE_HT: 8,
    NGAY_HT: 9,
    DANH_GIA: 10,
    CAP_NHAT: 11,
    Y_KIEN_CHI_DAO: 12,
    SOURCE_SHEET: 13,
    SOURCE_ROW: 14,
    MA_DU_AN: 15,
    TEN_DU_AN: 16,
    LOAI_DONG: 17,
    TASK_KEY: 18
  },

  MONTH_COL: {
    WBS: 1,
    NOI_DUNG: 2,
    MA_DU_AN: 3,
    DEADLINE: 6,
    CHU_TRI: 8,
    PHE_DUYET: 10
  }
};

function khTuanWbs_normalizeText_(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function khTuanWbs_isRoman_(value) {
  const s = String(value || '').trim();
  return /^[IVXLCDM]+$/.test(s);
}

function khTuanWbs_isNumericWbs_(value) {
  const s = String(value || '').trim();
  return /^\d+(\.\d+){0,3}$/.test(s);
}

function khTuanWbs_getWeekIndex_(weekName) {
  const match = String(weekName || '').trim().match(/^Tuần\s+(\d+)$/i);
  return match ? Number(match[1]) : 0;
}

function khTuanWbs_buildWorkingWeeks_(year, month) {
  const nam = Number(year);
  const thang = Number(month);
  const result = [];

  if (!nam || !thang || thang < 1 || thang > 12) {
    return result;
  }

  const lastDay = new Date(nam, thang, 0).getDate();
  let ngay = 1;

  while (ngay <= lastDay) {
    const start = new Date(nam, thang - 1, ngay);
    const startDow = start.getDay();

    if (startDow === 0) {
      ngay++;
      continue;
    }

    let endDay = ngay;
    while (endDay < lastDay) {
      const nextDate = new Date(nam, thang - 1, endDay + 1);
      const nextDow = nextDate.getDay();
      if (nextDow === 0 || nextDow === 1) {
        break;
      }
      endDay++;
    }

    result.push({
      name: 'Tuần ' + (result.length + 1),
      startDate: new Date(nam, thang - 1, ngay),
      endDate: new Date(nam, thang - 1, endDay)
    });

    ngay = endDay + 1;
  }

  return result;
}

function khTuanWbs_isLastWeekOfMonth_(sourceSheetName, weekName) {
  const thongTinThang = khTuanWbs_getMonthInfoFromSourceSheet_(sourceSheetName);
  const weekIndex = khTuanWbs_getWeekIndex_(weekName);

  if (!thongTinThang || weekIndex < 1) {
    return false;
  }

  const dsTuan = khTuanWbs_buildWorkingWeeks_(thongTinThang.nam, thongTinThang.thang);
  return weekIndex === dsTuan.length;
}

function khTuanWbs_getPreviousWeekName_(weekName) {
  const weekNumber = khTuanWbs_getWeekIndex_(weekName);
  if (weekNumber <= 1) {
    return '';
  }

  return 'Tuần ' + (weekNumber - 1);
}

function khTuanWbs_getMonthInfoFromSourceSheet_(sourceSheetName) {
  const match = String(sourceSheetName || '').trim().match(/T(0[1-9]|1[0-2])\.(\d{4})$/);
  if (!match) {
    return null;
  }

  return {
    thang: Number(match[1]),
    nam: Number(match[2])
  };
}

function khTuanWbs_valuesEqual_(valueA, valueB) {
  if (valueA instanceof Date && valueB instanceof Date) {
    return valueA.getTime() === valueB.getTime();
  }
  if (valueA instanceof Date || valueB instanceof Date) {
    const dateA = valueA instanceof Date ? valueA.getTime() : new Date(valueA).getTime();
    const dateB = valueB instanceof Date ? valueB.getTime() : new Date(valueB).getTime();
    if (!isNaN(dateA) && !isNaN(dateB)) {
      return dateA === dateB;
    }
  }
  return String(valueA || '').trim() === String(valueB || '').trim();
}

function khTuanWbs_createBlankRow_() {
  const row = [];
  for (let i = 0; i < KH_TUAN_WBS_CONFIG.TOTAL_COLS; i++) {
    row.push('');
  }
  return row;
}

function khTuanWbs_normalizeRowLength_(row) {
  const result = (row || []).slice(0, KH_TUAN_WBS_CONFIG.TOTAL_COLS);
  while (result.length < KH_TUAN_WBS_CONFIG.TOTAL_COLS) {
    result.push('');
  }
  return result;
}

function khTuanWbs_getDataTotalCols_() {
  const config = KH_TUAN_WBS_CONFIG;
  return config.DATA_META_COLS + config.TOTAL_COLS + config.DATA_PARENT_COLS;
}

function khTuanWbs_normalizeDataRawRow_(row) {
  const result = (row || []).slice(0, khTuanWbs_getDataTotalCols_());
  while (result.length < khTuanWbs_getDataTotalCols_()) {
    result.push('');
  }
  return result;
}

function khTuanWbs_rowHasData_(row) {
  return khTuanWbs_normalizeRowLength_(row).some(function(value) {
    return String(value || '').trim() !== '';
  });
}

function khTuanWbs_getLastRowByColumns_(sheet, startRow, cols) {
  const maxRow = sheet.getLastRow();
  const maxCol = Math.max.apply(null, cols);

  if (maxRow < startRow) {
    return startRow - 1;
  }

  const values = sheet.getRange(startRow, 1, maxRow - startRow + 1, maxCol).getDisplayValues();

  for (let i = values.length - 1; i >= 0; i--) {
    const hasData = cols.some(function(col) {
      return String(values[i][col - 1] || '').trim() !== '';
    });

    if (hasData) {
      return startRow + i;
    }
  }

  return startRow - 1;
}

function khTuanWbs_formatMonthLabel_(year, month) {
  const m = Number(month);
  const y = Number(year);

  if (!m || !y) return '';

  return 'T' + String(m).padStart(2, '0') + '.' + y;
}

