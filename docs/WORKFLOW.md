# Quy trinh Lam viec Nhom

## 1. Phan vai tro (Nhom 4 nguoi)

| Vai tro | Trach nhiem chinh |
|---------|-------------------|
| **Team Lead / Fullstack** | Setup repo, infrastructure, auth module, code review, merge PRs |
| **Backend Developer** | NestJS modules, database design, API endpoints, unit tests |
| **Mobile Developer** | React Native screens, UI/UX implementation, navigation |
| **Mobile + Integration** | State management, API integration, E2E testing |

## 2. Sprint Workflow

Moi sprint keo dai **2 tuan**.

### Tuan 1
- **Ngay 1 (Thu 2)**: Sprint Planning - review backlog, chon tasks, estimate
- **Hang ngay**: Daily standup (15 phut)
  - Hom qua lam gi?
  - Hom nay se lam gi?
  - Co vuong mac gi khong?
- **Cuoi tuan**: Mid-sprint check

### Tuan 2
- **Hang ngay**: Daily standup
- **Thu 5**: Code freeze - khong merge feature moi
- **Thu 6**: Testing & bug fixes
- **Cuoi tuan**: Sprint Review + Retrospective

## 3. Git Workflow

### Branch Strategy

```
main (production)
  └── develop (integration)
        ├── feature/auth (Nguoi 1)
        ├── feature/schedule-api (Nguoi 2)
        ├── feature/schedule-ui (Nguoi 3)
        └── feature/api-integration (Nguoi 4)
```

### Quy trinh lam viec hang ngay

```bash
# 1. Cap nhat develop moi nhat
git checkout develop
git pull origin develop

# 2. Tao hoac chuyen sang feature branch
git checkout -b feature/<ten>

# 3. Code va commit thuong xuyen
git add .
git commit -m "feat(scope): mo ta ngan gon"

# 4. Push va tao PR
git push -u origin feature/<ten>
# Tao PR tren GitHub, base: develop

# 5. Sau khi PR duoc approve va merge
git checkout develop
git pull origin develop
git branch -d feature/<ten>
```

### Pull Request Rules

1. **Tieu de PR** theo format: `[TYPE] Mo ta ngan gon`
   - Vi du: `[FEAT] Add JWT authentication module`
2. **Mo ta PR** theo template (tu dong)
3. **Lien ket Issue**: Moi PR phai lien ket voi 1 Issue
4. **Review**: Toi thieu 1 approve
5. **CI pass**: Lint + Test phai pass
6. **Merge method**: Squash and Merge

## 4. Issue Management

### Issue Labels

| Label | Mau | Mo ta |
|-------|-----|-------|
| `feature` | xanh la | Tinh nang moi |
| `bug` | do | Loi can sua |
| `enhancement` | xanh duong | Cai tien |
| `documentation` | vang | Tai lieu |
| `priority:high` | do dam | Uu tien cao |
| `priority:medium` | cam | Uu tien trung binh |
| `priority:low` | xanh nhat | Uu tien thap |
| `api` | tim | Lien quan backend |
| `mobile` | xanh | Lien quan mobile |

### Issue Assignment
- Moi nguoi tu assign issue cho minh trong Sprint Planning
- Khong lam qua 2 issues cung luc
- Cap nhat trang thai issue khi bat dau va hoan thanh

## 5. Communication

### Tools
- **GitHub Issues**: Task tracking
- **GitHub Discussions**: Thao luan ky thuat
- **Pull Requests**: Code review
- **Chat nhom (Zalo/Discord)**: Giao tiep nhanh

### Khi can ho tro
1. Tu tim hieu truoc (Google, docs, 30 phut)
2. Neu chua giai quyet duoc, hoi trong chat nhom
3. Neu van de phuc tap, tao Issue va tag nguoi lien quan

## 6. Release Process

### Version Numbering (SemVer)
- `MAJOR.MINOR.PATCH` (vd: `0.1.0`, `0.2.0`, `1.0.0`)
- Phase 1 MVP: `0.x.x`
- Production release: `1.0.0`

### Release Flow
1. Tat ca features da merge vao `develop`
2. Tao branch `release/vX.Y.Z` tu `develop`
3. Testing tren release branch
4. Merge vao `main` va tag version
5. Deploy

```bash
git checkout develop
git checkout -b release/v0.1.0
# Testing, bug fixes
git checkout main
git merge release/v0.1.0
git tag -a v0.1.0 -m "Release v0.1.0 - MVP"
git push origin main --tags
```
