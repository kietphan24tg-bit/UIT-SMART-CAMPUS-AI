# UI/UX QC Loop (Theo Skill Checklist)

Tài liệu này dùng để lặp lại vòng QA UI/UX liên tục cho đến khi đạt mức phát hành.

## Nguồn checklist bắt buộc
- `.tmp/ui-ux-pro-max-skill/.claude/skills/brand/references/consistency-checklist.md`
- `.tmp/ui-ux-pro-max-skill/.claude/skills/brand/references/approval-checklist.md`

## Vòng lặp mỗi iteration
1. Audit visual consistency:
- Logo đúng biến thể, clear space, không biến dạng.
- Màu bám palette thương hiệu, tương phản đạt chuẩn.
- Typography đúng thang cấp caption/body/title/headline.
2. Audit content:
- Copy ngắn, rõ, đúng giọng sản phẩm.
- Không dùng câu demo hoặc mô tả kỹ thuật thừa.
- CTA rõ và nhất quán theo trạng thái.
3. Audit accessibility:
- Tap target >= 48dp.
- Color không là tín hiệu duy nhất.
- Focus state và contrast đạt chuẩn.
4. Sửa UI theo mức ưu tiên:
- P0: lệch layout, logo sai, contrast kém.
- P1: copy dài/khó đọc, hierarchy chưa rõ.
- P2: polish spacing/motion.
5. Re-test:
- `pnpm --filter mobile lint`
- `pnpm --filter mobile test`

## Definition of Done cho mỗi màn
- Hero gọn: 1 title + 1 subtitle ngắn.
- Section subtitle tối đa một ý chính.
- Không có đoạn mô tả dài quá 2 câu.
- Trạng thái `Đang hỗ trợ / Sắp triển khai / Tạm thời chưa khả dụng` hiển thị rõ.

## Iteration Log

### Iteration 1
- Rút gọn copy trên Auth, Home, Schedule, Parking, Services, Alerts, Profile.
- Chuẩn hóa ngôn ngữ trạng thái dịch vụ và empty states.
- Bổ sung kế hoạch backend theo phase song song.

### Iteration 2
- Chuẩn hóa trục layout ngang giữa `hero` và `content`.
- Giảm overlap âm toàn cục để tránh lệch bố cục.
- Tắt overlap ở màn form/detail (Auth, Forgot Password, Legal, Settings, Delete Account, Service Detail, Parking Task, Alert Detail).
- Cân lại spacing card/segment/form ở màn Auth.
