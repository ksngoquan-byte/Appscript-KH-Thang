function chuanHoaCauTrucCongViecTrenSheet_(sheet) {
  const dongBatDau = CAU_HINH_UNG_DUNG.KIEM_TRA_CAU_TRUC.DONG_BAT_DAU_DU_LIEU || 5;
  const dongCuoi = sheet.getLastRow();
  const soDong = Math.max(dongCuoi - dongBatDau + 1, 0);
  if (!soDong) {
    return { sheet: sheet.getName(), soDongXuLy: 0, soCanhBao: 0, canhBao: [] };
  }

  const values = sheet.getRange(dongBatDau, 1, soDong, 9).getDisplayValues();
  const notesA = sheet.getRange(dongBatDau, 1, soDong, 1).getNotes();
  const thongTinSheet = layThongTinThangTuTenSheet_(sheet.getName());
  const prefixMaCv = taoPrefixMaCvTheoSheet_(thongTinSheet);
  const trangThaiId = taoTrangThaiMaCv_(notesA, prefixMaCv);
  const boDemTheoCap = [0, 0, 0, 0, 0];
  const maCvTheoCap = ['', '', '', '', ''];
  const maDuAnTheoCap = ['', '', '', '', ''];
  const ketQuaA = [];
  const ketQuaC = [];
  const ketQuaNoteA = [];
  const canhBao = [];

  for (let i = 0; i < values.length; i++) {
    const soDongHienTai = dongBatDau + i;
    const giaTriA = String(values[i][0] || '').trim();
    const giaTriB = String(values[i][1] || '').trim();
    const giaTriC = String(values[i][2] || '').trim();

    if (!giaTriA && !giaTriB) {
      ketQuaA.push(['']);
      ketQuaC.push([giaTriC]);
      ketQuaNoteA.push([notesA[i][0] || '']);
      continue;
    }

    if (chuanHoaTextStt_(giaTriB) === chuanHoaTextStt_(TEN_DONG_PHAT_SINH_KHAC_)) {
      for (let level = 0; level < boDemTheoCap.length; level++) {
        boDemTheoCap[level] = 0;
        maCvTheoCap[level] = '';
        maDuAnTheoCap[level] = '';
      }

      ketQuaA.push(['']);
      ketQuaC.push([giaTriC]);
      ketQuaNoteA.push([notesA[i][0] || '']);
      continue;
    }

    const loaiDong = xacDinhLoaiDongStt_(giaTriA);

    if (loaiDong === 'TONG') {
      ketQuaA.push(['∑']);
      ketQuaC.push([giaTriC]);
      ketQuaNoteA.push([notesA[i][0] || '']);
      continue;
    }

    if (loaiDong === null) {
      ketQuaA.push([giaTriA]);
      ketQuaC.push([giaTriC]);
      ketQuaNoteA.push([notesA[i][0] || '']);
      continue;
    }

    const cap = loaiDong === 'DU_AN' ? 0 : loaiDong;

    capNhatBoDemTheoCap_(boDemTheoCap, cap);
    const maHienThi = taoMaHienThiTheoCap_(boDemTheoCap, cap);
    const noteCu = phanTichNoteCongViec_(notesA[i][0]);
    const maCv = noteCu.ma_cv || taoMaCvMoi_(prefixMaCv, trangThaiId);
    const maCha = cap === 0 ? '' : (maCvTheoCap[cap - 1] || '');
    const maDuAnCha = timMaDuAnChaGanNhat_(maDuAnTheoCap, cap);
    let maDuAnMoi = giaTriC;

    if (!maDuAnMoi && maDuAnCha) {
      maDuAnMoi = maDuAnCha;
    } else if (maDuAnMoi && maDuAnCha && maDuAnMoi !== maDuAnCha) {
      canhBao.push('Dòng ' + soDongHienTai + ': mã dự án con khác mã dự án cha.');
    }

    maCvTheoCap[cap] = maCv;
    maDuAnTheoCap[cap] = maDuAnMoi || '';
    for (let level = cap + 1; level < maCvTheoCap.length; level++) {
      maCvTheoCap[level] = '';
      maDuAnTheoCap[level] = '';
    }

    ketQuaA.push([String(maHienThi)]);
    ketQuaC.push([maDuAnMoi]);
    ketQuaNoteA.push([taoNoteCongViec_(maCv, cap, maCha, noteCu.chuyen_tu || '')]);
  }

  const rangeA = sheet.getRange(dongBatDau, 1, ketQuaA.length, 1);
  rangeA.clearNote();
  rangeA.setNumberFormat('@');
  rangeA.setValues(ketQuaA);

  sheet.getRange(dongBatDau, 3, ketQuaC.length, 1).setValues(ketQuaC);

  return {
    sheet: sheet.getName(),
    soDongXuLy: ketQuaA.length,
    soCanhBao: canhBao.length,
    canhBao: canhBao
  };
}

function chuanHoaTextKhongDauStt_(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function laLuaChonNhomDuAn_(value) {
  const s = chuanHoaTextKhongDauStt_(value);
  return s === 'nhom' || s === 'du an' || s === 'nhom du an';
}

function xuLyOnEditCotAThang_(e) {
  try {
    if (!e || !e.range) {
      return false;
    }

    const range = e.range;
    if (range.getColumn() !== 1 || range.getRow() < layDongBatDauDropdownCapCongViec_()) {
      return false;
    }

    if (range.getNumRows && (range.getNumRows() !== 1 || range.getNumColumns() !== 1)) {
      return false;
    }

    const sheet = range.getSheet();
    const ss = e.source || sheet.getParent();
    const config = docCauHinh_(ss);
    if (!laSheetThangDongBo_(sheet, config)) {
      return false;
    }

    const giaTriMoi = typeof e.value !== 'undefined'
      ? e.value
      : range.getDisplayValue();
    if (!laLuaChonNhomDuAn_(giaTriMoi)) {
      return false;
    }

    range.setValue('Nhóm');
    capNhatLaMaDongNhomDuAnTrenSheet_(sheet, range.getRow());
    return true;
  } catch (error) {
    Logger.log('Lỗi xuLyOnEditCotAThang_: %s', error.stack || error);
    return false;
  }
}

function capNhatLaMaDongNhomDuAnTrenSheet_(sheet, dongVuaSua) {
  const dongBatDau = layDongBatDauDropdownCapCongViec_();
  const dongCuoi = Math.max(sheet.getLastRow(), dongVuaSua);
  const soDong = Math.max(dongCuoi - dongBatDau + 1, 0);
  if (!soDong) {
    return { soDongNhomDuAn: 0 };
  }

  const rangeA = sheet.getRange(dongBatDau, 1, soDong, 1);
  const values = rangeA.getDisplayValues();
  let soDongNhomDuAn = 0;

  for (let i = 0; i < values.length; i++) {
    const giaTriA = String(values[i][0] || '').trim();
    if (xacDinhLoaiDongStt_(giaTriA) !== 'DU_AN') {
      continue;
    }

    soDongNhomDuAn++;
    values[i][0] = doiSoSangLaMaStt_(soDongNhomDuAn);
  }

  rangeA.setNumberFormat('@');
  rangeA.setValues(values);

  for (let i = 0; i < values.length; i++) {
    if (/^[IVXLCDM]+$/.test(String(values[i][0] || '').trim())) {
      toMauDongNhomDuAn_(sheet, dongBatDau + i);
    }
  }

  return {
    soDongNhomDuAn: soDongNhomDuAn
  };
}
