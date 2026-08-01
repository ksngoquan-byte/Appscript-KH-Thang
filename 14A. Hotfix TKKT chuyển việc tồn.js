/**
 * HOTFIX TKKT 2026-08-01
 *
 * Mục tiêu:
 * - Giữ nguyên các hàm lõi đang có trong file 14.
 * - Ghi đè entrypoint chuyển việc tồn bằng phiên bản fail-fast.
 * - Không báo thành công khi không có việc tồn, thiếu nhóm đích hoặc số dòng ghi không khớp.
 *
 * Điều kiện nền:
 * - SO_COT_FORM_BAO_CAO_THANG_ = 17 (A:Q)
 * - COT_DANH_GIA_CONG_VIEC_TON_ = 15 (cột O)
 */

dongBoToanBoCongViecTonCuaSheetHienTai = function() {
  try {
    const lock = khoaDongBoCongViecTon_(KHOA_BATCH_DONG_BO_CONG_VIEC_TON_TIMEOUT_MS_);
    if (!lock) {
      throw new Error(
        'Không lấy được lock để đồng bộ toàn bộ công việc tồn. ' +
        'Có thể đang có một lần chạy khác, hãy đợi khoảng 10-30 giây rồi chạy lại.'
      );
    }

    try {
      const ss = layBangTinhDangMo_();
      const sheetNguon = ss.getActiveSheet();
      const config = docCauHinh_(ss);
      const tapTrangThaiCongViecTon = layTapTrangThaiCongViecTon_(ss, config);

      if (!laSheetThangDongBo_(sheetNguon, config)) {
        throw new Error('Sheet đang mở không phải sheet tháng hợp lệ để đồng bộ công việc tồn.');
      }

      const sheetDich = laySheetThangKeTiep_(ss, sheetNguon, config);
      if (!sheetDich) {
        throw new Error('Không tìm thấy sheet tháng kế tiếp cho ' + sheetNguon.getName());
      }

      yeuCauDongBoTrongKyBaoCaoKeHoach_(sheetNguon, sheetDich);

      const banDoCongViecTon = layBanDoCongViecTonTheoNhom_(
        sheetNguon,
        config,
        tapTrangThaiCongViecTon
      );
      const dsNhomCoViecTon = Object.keys(banDoCongViecTon);

      if (!dsNhomCoViecTon.length) {
        throw new Error(
          'Không tìm thấy công việc tồn trong cột O - Đánh giá của sheet ' +
          sheetNguon.getName() +
          '. Các trạng thái được chuyển phải thuộc danh mục tại Data!R6:R10 và khác trạng thái Đạt.'
        );
      }

      const dsNhomThieuTaiSheetDich = dsNhomCoViecTon.filter(function(maNhom) {
        return !layThongTinNhomTrongSheet_(sheetDich, maNhom);
      });

      if (dsNhomThieuTaiSheetDich.length) {
        throw new Error(
          'Sheet tháng sau chưa có nhóm đích: ' + dsNhomThieuTaiSheetDich.join(', ') +
          '. Cần khởi tạo đủ các nhóm La Mã và ít nhất 01 dòng công việc mẫu trong từng nhóm trước khi chuyển.'
        );
      }

      if (!xacNhanDongBoCongViecTonThuCong_(sheetNguon, sheetDich)) {
        Logger.log(
          'BO_QUA dongBoToanBoCongViecTonCuaSheetHienTai | nguoi_dung_huy_xac_nhan'
        );
        return {
          sheetNguon: sheetNguon.getName(),
          sheetDich: sheetDich.getName(),
          tongNhom: 0,
          tongViecTon: 0,
          tongDongGhi: 0,
          tongDongXoa: 0,
          tongDongChenMoi: 0,
          tongBoQua: 0,
          chiTietNhom: [],
          daHuy: true
        };
      }

      const ketQuaTongHop = dongBoToanBoCongViecTonGiuaHaiSheet_(
        sheetNguon,
        sheetDich,
        config,
        tapTrangThaiCongViecTon
      );

      if (
        ketQuaTongHop.tongDongGhi !== ketQuaTongHop.tongViecTon ||
        ketQuaTongHop.tongBoQua > 0
      ) {
        throw new Error(
          'Đồng bộ chưa hoàn tất: phát hiện ' + ketQuaTongHop.tongViecTon +
          ' việc tồn nhưng chỉ ghi được ' + ketQuaTongHop.tongDongGhi +
          ', bỏ qua ' + ketQuaTongHop.tongBoQua +
          '. Không hiển thị thông báo thành công để tránh người dùng hiểu nhầm.'
        );
      }

      Logger.log(
        'Đồng bộ toàn bộ công việc tồn xong | nguon=%s | dich=%s | nhóm=%s | ' +
        'việc tồn=%s | dòng ghi=%s | dòng xóa=%s | dòng chèn=%s | bỏ qua=%s',
        ketQuaTongHop.sheetNguon,
        ketQuaTongHop.sheetDich,
        ketQuaTongHop.tongNhom,
        ketQuaTongHop.tongViecTon,
        ketQuaTongHop.tongDongGhi,
        ketQuaTongHop.tongDongXoa,
        ketQuaTongHop.tongDongChenMoi,
        ketQuaTongHop.tongBoQua
      );

      ss.toast(
        'Đã đồng bộ ' + ketQuaTongHop.tongDongGhi + ' việc tồn từ ' +
        ketQuaTongHop.sheetNguon + ' sang ' + ketQuaTongHop.sheetDich,
        'Công việc tồn',
        5
      );

      return ketQuaTongHop;
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    Logger.log(
      'Lỗi dongBoToanBoCongViecTonCuaSheetHienTai [TKKT HOTFIX]: %s',
      error.stack || error
    );
    throw error;
  }
};
