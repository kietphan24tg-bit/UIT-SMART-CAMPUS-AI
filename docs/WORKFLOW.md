# Quy trình Làm việc Nhóm

## 1. Phân vai trò (Nhóm 4 người)

| Vai trò | Trách nhiệm chính |
|---------|-------------------|
| **Team Lead / Fullstack** | Setup repo, infrastructure, auth + RBAC, code review, merge PRs |
| **Backend Developer** | NestJS modules, database design, API endpoints, phân quyền, unit tests |
| **Mobile Developer** | React Native screens, UI/UX implementation, navigation |
| **Mobile + Integration** | State management, API integration, E2E testing (Maestro) |

## 2. Phân công theo Phase

### Phase 1 — Nền tảng & Cơ bản (Sprint 1–4, ~8 tuần)

| Sprint | Team Lead | Backend Dev | Mobile Dev | Mobile + Integration |
|--------|-----------|-------------|------------|----------------------|
| **Sprint 1** | Setup monorepo, CI/CD, Docker | Database schema, Prisma setup | Expo setup, navigation | Zustand stores, API client |
| **Sprint 2** | Auth module (API + RBAC) | Schedule + Grades API | Auth screens (Login/Register) | Auth store + API integration |
| **Sprint 3** | Code review, fix bugs | Notifications API + FCM | Home, Schedule, Grades screens | Kết nối Schedule + Grades API |
| **Sprint 4** | Testing, polish | API docs (Swagger), tests | Profile screen, UI polish | Notifications integration, E2E |

### Phase 2 — Tính năng Chính (Sprint 5–8, ~8 tuần)

| Sprint | Team Lead | Backend Dev | Mobile Dev | Mobile + Integration |
|--------|-----------|-------------|------------|----------------------|
| **Sprint 5** | Chatbot API + OpenAI | Events + Attendance API | Chatbot UI | Events UI + đăng ký |
| **Sprint 6** | Room booking API | Course registration API | Attendance (QR scan/tạo) | ĐKMH UI + Room booking UI |
| **Sprint 7** | Code review, RBAC mở rộng | API tests, fix bugs | QR check-in sự kiện | Kết nối tất cả API Phase 2 |
| **Sprint 8** | Testing, performance | API optimization | UI polish, animation | E2E testing Phase 2 |

### Phase 3 — Nâng cao & IoT (Sprint 9–12, ~8 tuần)

| Sprint | Team Lead | Backend Dev | Mobile Dev | Mobile + Integration |
|--------|-----------|-------------|------------|----------------------|
| **Sprint 9** | Maps data + API | Library API | Bản đồ campus UI | Library UI |
| **Sprint 10** | IoT integration (MQTT) | Parking + Classroom API | Parking UI | Classroom IoT control UI |
| **Sprint 11** | Code review, security | IoT backend + tests | LED demo integration | E2E testing Phase 3 |
| **Sprint 12** | Deploy production | Performance, docs | Final UI polish | Full regression testing |

## 3. Sprint Workflow

Mỗi sprint kéo dài **2 tuần**.

### Tuần 1
- **Ngày 1 (Thứ 2)**: Sprint Planning — review backlog, chọn tasks, estimate
- **Hàng ngày**: Daily standup (15 phút)
  - Hôm qua làm gì?
  - Hôm nay sẽ làm gì?
  - Có vướng mắc gì không?
- **Cuối tuần**: Mid-sprint check

### Tuần 2
- **Hàng ngày**: Daily standup
- **Thứ 5**: Code freeze — không merge feature mới
- **Thứ 6**: Testing & bug fixes
- **Cuối tuần**: Sprint Review + Retrospective

## 4. Git Workflow

### Branch Strategy

```
main (production)
  └── develop (integration)
        ├── feature/auth-api          (Team Lead)
        ├── feature/schedule-api      (Backend Dev)
        ├── feature/login-screen      (Mobile Dev)
        └── feature/auth-integration  (Mobile + Integration)
```

### Quy trình làm việc hàng ngày

```bash
# 1. Cập nhật develop mới nhất
git checkout develop
git pull origin develop

# 2. Tạo hoặc chuyển sang feature branch
git checkout -b feature/<tên>

# 3. Code và commit thường xuyên
git add .
git commit -m "feat(scope): mô tả ngắn gọn"

# 4. Push và tạo PR
git push -u origin feature/<tên>
# Tạo PR trên GitHub, base: develop

# 5. Sau khi PR được approve và merge
git checkout develop
git pull origin develop
git branch -d feature/<tên>
```

### Quy tắc Pull Request

1. **Tiêu đề PR** theo format: `[TYPE] Mô tả ngắn gọn`
   - Ví dụ: `[FEAT] Add JWT authentication module`
2. **Mô tả PR** theo template (tự động)
3. **Liên kết Issue**: Mỗi PR phải liên kết với 1 Issue
4. **Review**: Tối thiểu 1 approve
5. **CI pass**: Lint + Test phải pass
6. **Merge method**: Squash and Merge

## 5. Quản lý Issue

### Issue Labels

| Label | Màu | Mô tả |
|-------|-----|-------|
| `feature` | xanh lá | Tính năng mới |
| `bug` | đỏ | Lỗi cần sửa |
| `enhancement` | xanh dương | Cải tiến |
| `documentation` | vàng | Tài liệu |
| `priority:high` | đỏ đậm | Ưu tiên cao |
| `priority:medium` | cam | Ưu tiên trung bình |
| `priority:low` | xanh nhạt | Ưu tiên thấp |
| `phase:1` | tím nhạt | Thuộc Phase 1 |
| `phase:2` | tím | Thuộc Phase 2 |
| `phase:3` | tím đậm | Thuộc Phase 3 |
| `api` | tím | Liên quan backend |
| `mobile` | xanh | Liên quan mobile |
| `iot` | cam | Liên quan IoT |

### Phân công Issue
- Mỗi người tự assign issue cho mình trong Sprint Planning
- Không làm quá 2 issues cùng lúc
- Cập nhật trạng thái issue khi bắt đầu và hoàn thành
- Ưu tiên hoàn thành Phase hiện tại trước khi chuyển sang Phase tiếp

## 6. Giao tiếp

### Công cụ
- **GitHub Issues**: Quản lý task
- **GitHub Discussions**: Thảo luận kỹ thuật
- **Pull Requests**: Code review
- **Chat nhóm (Zalo/Discord)**: Giao tiếp nhanh

### Khi cần hỗ trợ
1. Tự tìm hiểu trước (Google, docs, 30 phút)
2. Nếu chưa giải quyết được, hỏi trong chat nhóm
3. Nếu vấn đề phức tạp, tạo Issue và tag người liên quan

## 7. Quy trình Release

### Đánh số phiên bản (SemVer)

| Phase | Version | Mô tả |
|-------|---------|-------|
| Phase 1 hoàn thành | `0.1.0` | MVP — Auth, TKB, Điểm, Thông báo |
| Phase 2 hoàn thành | `0.2.0` | Chatbot, Events, ĐKMH, Điểm danh |
| Phase 3 hoàn thành | `0.3.0` | Maps, Library, Parking, IoT |
| Production | `1.0.0` | Phiên bản chính thức |

### Release Flow
1. Tất cả features đã merge vào `develop`
2. Tạo branch `release/vX.Y.Z` từ `develop`
3. Testing trên release branch
4. Merge vào `main` và tag version
5. Deploy

```bash
git checkout develop
git checkout -b release/v0.1.0
# Testing, bug fixes
git checkout main
git merge release/v0.1.0
git tag -a v0.1.0 -m "Release v0.1.0 - Phase 1 MVP"
git push origin main --tags
```

## 8. Milestones

| Milestone | Mục tiêu | Deadline (ước lượng) |
|-----------|----------|---------------------|
| M1: Project Setup | Monorepo, CI/CD, Docker, Auth API | Tuần 2 |
| M2: Phase 1 MVP | TKB, Điểm, Thông báo (API + Mobile) | Tuần 8 |
| M3: Phase 2 | Chatbot, Events, ĐKMH, Điểm danh | Tuần 16 |
| M4: Phase 3 | Maps, Library, Parking, IoT demo | Tuần 24 |
| M5: Final | Production deploy, báo cáo | Tuần 26 |
