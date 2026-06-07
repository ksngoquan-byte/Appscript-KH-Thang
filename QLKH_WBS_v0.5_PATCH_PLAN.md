# QLKH KH tuần/WBS v0.5 - Patch Plan

## Phạm vi

Áp dụng cho nhóm mẫu mới có `KH_TUAN_WBS` và `KH_TUAN_DATA`.

Không tự động cập nhật Apps Script live. Không sửa trigger, mail, protection.

## Luật nghiệp vụ

- `Cập nhật vào KH tháng? = Có` quyết định dòng có được ghi kết quả về KH tháng hay không.
- `Đánh giá = Đạt` quyết định dòng có bị ẩn ở các tuần sau hay không.
- Nếu một việc tháng đã `Đạt` ở tuần trước, tuần sau không nạp lại dòng việc tháng đó và không hiển thị việc con/manual/carry dưới nó.
- Khi cập nhật KH tháng theo dữ liệu tuần:
  - Tháng hiện tại: quét từ Tuần 1 đến tuần chứa ngày hôm nay.
  - Tháng cũ: quét toàn bộ tháng để hỗ trợ cập nhật/chốt hồi cứu.
  - Tháng tương lai: chặn.

## File đã sửa/thêm

| File | Nội dung |
|---|---|
| `20A. KH tuan WBS - config helper.js` | Thêm helper nhận diện `Đạt`, flag cập nhật, xác định phạm vi tuần theo ngày thực tế |
| `20C. KH tuan WBS - month source.js` | Khi nạp tuần, bỏ qua các dòng `_SourceRow` đã `Đạt` trong tuần trước |
| `20H. KH tuan WBS - month aggregate push.js` | Hàm mới `khTuanWbs_pushMonthResultFromWeekData()` để cập nhật KH tháng từ `KH_TUAN_DATA` |

## Ghi chú về menu

Chưa sửa file menu vì chưa xác định được file menu hiện hữu trong repo bằng audit read-only. Sau khi xác định file menu/onOpen live, thêm item gọi:

```javascript
.addItem('Cập nhật KH tháng theo dữ liệu tuần', 'khTuanWbs_pushMonthResultFromWeekData')
```

## Test bắt buộc trên Tieuchuan – T06.2026

| STT | Test | Kết quả mong muốn |
|---:|---|---|
| 1 | Tuần 1 đánh giá `Đạt`, chưa cập nhật tháng | Tuần 2 không hiện việc tháng |
| 2 | Tuần 1 đánh giá `Đạt`, có việc con/manual/carry | Tuần 2 việc con/manual/carry cũng không hiện |
| 3 | Tuần 1 `Không đạt` | Tuần 2 vẫn hiện/chuyển tiếp |
| 4 | Tuần 1 `Chuyển kỳ sau` | Tuần 2 vẫn hiện/chuyển tiếp |
| 5 | Tuần 1 trống đánh giá | Tuần 2 vẫn hiện |
| 6 | Trong tháng hiện tại bấm cập nhật | Chỉ quét Tuần 1 đến tuần chứa ngày hôm nay |
| 7 | Sang tháng mới cập nhật tháng cũ | Quét toàn bộ tháng cũ |
| 8 | Chọn tháng tương lai | Cảnh báo/chặn |
| 9 | Dòng `Cập nhật = Không` | Không ghi về KH tháng |
| 10 | Dòng không có `_SourceRow` | Không ghi về KH tháng |
| 11 | Dòng Dự án/Tổng | Không ghi về KH tháng |
| 12 | Không ghi nhầm sheet tháng khác | Pass bắt buộc |

## Rollback

- Revert branch/PR hoặc khôi phục 2 file `20A`, `20C` về commit trước.
- Xóa/không push file mới `20H` nếu chưa đạt test.
- Vì chưa sửa `20F`, hàm cập nhật tuần đang hiển thị vẫn giữ nguyên.
