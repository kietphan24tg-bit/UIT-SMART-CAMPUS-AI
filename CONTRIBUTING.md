# Hướng dẫn Đóng góp

Cảm ơn bạn đã quan tâm đến dự án Smart Campus! Tài liệu này hướng dẫn cách đóng góp code vào dự án.

## Quy trình đóng góp

### 1. Tạo branch mới

```bash
# Cập nhật nhánh develop mới nhất
git checkout develop
git pull origin develop

# Tạo branch mới
git checkout -b feature/<tên-tính-năng>
# hoặc
git checkout -b fix/<tên-bug>
```

### 2. Quy tắc đặt tên branch

| Loại | Format | Ví dụ |
|------|--------|-------|
| Tính năng mới | `feature/<tên>` | `feature/auth`, `feature/schedule-view` |
| Sửa lỗi | `fix/<tên>` | `fix/login-crash`, `fix/gpa-calculation` |
| Hotfix | `hotfix/<tên>` | `hotfix/security-patch` |
| Tài liệu | `docs/<tên>` | `docs/api-guide` |

### 3. Viết code

- Tuân thủ [Quy tắc lập trình](docs/CONVENTIONS.md)
- Viết test cho logic quan trọng
- Đảm bảo lint pass: `pnpm lint`
- Format code: `pnpm format`

### 4. Commit message

Sử dụng [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <mô tả>

Ví dụ:
feat(auth): add JWT refresh token rotation
fix(schedule): correct timezone offset in calendar view
docs(api): update authentication endpoint docs
test(grades): add unit tests for GPA calculation
chore(deps): upgrade expo to v52
```

**Types cho phép:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `revert`, `ci`, `build`

**Scopes cho phép:** `api`, `mobile`, `shared`, `auth`, `schedule`, `grades`, `notifications`, `users`, `chatbot`, `events`, `attendance`, `navigation`, `deps`, `config`, `ci`, `docs`

### 5. Tạo Pull Request

1. Push branch lên remote:
   ```bash
   git push -u origin feature/<tên-tính-năng>
   ```

2. Tạo Pull Request trên GitHub:
   - Base branch: `develop`
   - Điền đầy đủ mô tả theo template
   - Liên kết với Issue tương ứng
   - Gán reviewer

3. Chờ review và sửa theo feedback

### 6. Review checklist

Trước khi request review, kiểm tra:

- [ ] Code chạy được, không có lỗi
- [ ] Lint và format pass (`pnpm lint && pnpm format:check`)
- [ ] Đã viết test (nếu cần)
- [ ] Không commit file `.env`, secrets, hoặc file không cần thiết
- [ ] Commit messages đúng format
- [ ] PR description rõ ràng

## Quy trình Review

- Mỗi PR cần **tối thiểu 1 approve** từ reviewer
- Reviewer nên review trong vòng **24 giờ**
- Sử dụng "Request changes" nếu cần sửa, "Approve" nếu OK
- Merge bằng **Squash and Merge** vào `develop`

## Báo lỗi

Nếu phát hiện lỗi, tạo Issue mới với template "Bug Report" trên GitHub.

## Đề xuất tính năng

Muốn đề xuất tính năng mới? Tạo Issue với template "Feature Request".
