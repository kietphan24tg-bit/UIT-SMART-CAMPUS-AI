# Huong dan Dong gop

Cam on ban da quan tam den du an Smart Campus! Tai lieu nay huong dan cach dong gop code vao du an.

## Quy trinh dong gop

### 1. Tao branch moi

```bash
# Cap nhat develop moi nhat
git checkout develop
git pull origin develop

# Tao branch moi
git checkout -b feature/<ten-tinh-nang>
# hoac
git checkout -b fix/<ten-bug>
```

### 2. Quy tac dat ten branch

| Loai | Format | Vi du |
|------|--------|-------|
| Tinh nang moi | `feature/<ten>` | `feature/auth`, `feature/schedule-view` |
| Sua loi | `fix/<ten>` | `fix/login-crash`, `fix/gpa-calculation` |
| Hotfix | `hotfix/<ten>` | `hotfix/security-patch` |
| Docs | `docs/<ten>` | `docs/api-guide` |

### 3. Viet code

- Tuan thu [Quy tac lap trinh](docs/CONVENTIONS.md)
- Viet test cho logic quan trong
- Dam bao lint pass: `pnpm lint`
- Format code: `pnpm format`

### 4. Commit message

Su dung [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <mo ta>

Vi du:
feat(auth): add JWT refresh token rotation
fix(schedule): correct timezone offset in calendar view
docs(api): update authentication endpoint docs
test(grades): add unit tests for GPA calculation
chore(deps): upgrade expo to v52
```

**Types cho phep:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `revert`, `ci`, `build`

**Scopes cho phep:** `api`, `mobile`, `shared`, `auth`, `schedule`, `grades`, `notifications`, `users`, `chatbot`, `events`, `attendance`, `navigation`, `deps`, `config`, `ci`, `docs`

### 5. Tao Pull Request

1. Push branch len remote:
   ```bash
   git push -u origin feature/<ten-tinh-nang>
   ```

2. Tao Pull Request tren GitHub:
   - Base branch: `develop`
   - Dien day du mo ta theo template
   - Lien ket voi Issue tuong ung
   - Gan reviewer

3. Cho review va sua theo feedback

### 6. Review checklist

Truoc khi request review, kiem tra:

- [ ] Code chay duoc, khong co loi
- [ ] Lint va format pass (`pnpm lint && pnpm format:check`)
- [ ] Da viet test (neu can)
- [ ] Khong commit file `.env`, secrets, hoac file khong can thiet
- [ ] Commit messages dung format
- [ ] PR description ro rang

## Quy trinh Review

- Moi PR can **toi thieu 1 approve** tu reviewer
- Reviewer nen review trong vong **24 gio**
- Su dung "Request changes" neu can sua, "Approve" neu OK
- Merge bang **Squash and Merge** vao `develop`

## Bao loi

Neu phat hien loi, tao Issue moi voi template "Bug Report" tren GitHub.

## De xuat tinh nang

Muon de xuat tinh nang moi? Tao Issue voi template "Feature Request".
