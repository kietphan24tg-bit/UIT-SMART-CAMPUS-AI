# Chiến lược Kiểm thử (Testing Strategy)

## Tổng quan

Dự án sử dụng **3 tầng kiểm thử** (testing pyramid):

1. **Unit Tests** (Jest) — Kiểm thử logic riêng lẻ: services, stores, utils
2. **Component Tests** (Jest + Testing Library) — Kiểm thử UI components
3. **E2E Tests** (Maestro) — Kiểm thử toàn bộ flow trên thiết bị/emulator

```
        /  E2E (Maestro)  \         ← Ít test, chạy chậm, độ tin cậy cao
       /  Component Tests  \        ← Kiểm thử UI components
      /    Unit Tests (Jest) \      ← Nhiều test, chạy nhanh
```

## Tech Stack Kiểm thử

| Thành phần | Công cụ | Mục đích |
|---|---|---|
| Test Runner | Jest 29 | Unit + Component tests |
| NestJS Unit | @nestjs/testing | Kiểm thử services, controllers |
| NestJS E2E | supertest | Kiểm thử API endpoints |
| RN Components | @testing-library/react-native | Kiểm thử components |
| RN Preset | jest-expo | Jest preset tương thích Expo |
| **Mobile E2E** | **Maestro** | **Kiểm thử flow trên device/emulator** |
| Shared Utils | ts-jest | Kiểm thử TypeScript utils |
| Mocking | Jest built-in | Mock dependencies |

## Cấu trúc file test

### Backend (apps/api)

```
apps/api/
├── jest.config.ts                              # Cấu hình unit test
├── src/modules/
│   ├── auth/
│   │   ├── auth.service.spec.ts                # Service unit tests
│   │   └── auth.controller.spec.ts             # Controller unit tests
│   ├── users/
│   │   ├── users.service.spec.ts
│   │   └── users.controller.spec.ts
│   ├── schedule/
│   │   └── schedule.service.spec.ts
│   ├── grades/
│   │   └── grades.service.spec.ts
│   └── notifications/
│       └── notifications.service.spec.ts
└── test/
    ├── jest-e2e.json                            # Cấu hình E2E test
    └── app.e2e-spec.ts                          # E2E tests
```

### Mobile (apps/mobile)

```
apps/mobile/
├── jest.config.js                              # Cấu hình Jest
├── jest-setup.ts                               # Setup + mocks
├── stores/__tests__/
│   └── auth-store.test.ts                      # Zustand store tests
└── app/
    ├── (auth)/__tests__/
    │   └── login.test.tsx                      # Kiểm thử màn hình đăng nhập
    └── (tabs)/
        ├── home/__tests__/
        │   └── index.test.tsx                  # Kiểm thử màn hình chính
        └── profile/__tests__/
            └── index.test.tsx                  # Kiểm thử trang cá nhân

```

### Mobile E2E — Maestro (apps/mobile/.maestro)

```
apps/mobile/.maestro/
├── config.yaml                          # Cấu hình Maestro (appId, tên project)
└── flows/
    ├── auth/
    │   ├── login-success.yaml           # Đăng nhập thành công
    │   ├── login-validation.yaml        # Validation form đăng nhập
    │   ├── login-invalid.yaml           # Sai thông tin đăng nhập
    │   ├── register.yaml                # Đăng ký tài khoản
    │   └── navigate-to-register.yaml    # Chuyển giữa đăng nhập/đăng ký
    ├── home/
    │   └── home-screen.yaml             # Kiểm tra màn hình chính
    ├── navigation/
    │   └── tab-navigation.yaml          # Chuyển đổi giữa các tab
    └── profile/
        ├── view-profile.yaml            # Xem thông tin cá nhân
        └── logout.yaml                  # Đăng xuất
```

### Shared (packages/shared)

```
packages/shared/
├── jest.config.ts
└── src/utils/__tests__/
    ├── validation.test.ts
    └── format.test.ts
```

## Lệnh chạy test

### Unit + Component Tests (Jest)

```bash
# Chạy tất cả tests
pnpm test

# Chạy tests với coverage
pnpm test:cov

# Chạy tests chỉ cho backend
pnpm test:api

# Chạy tests chỉ cho mobile
pnpm test:mobile

# Chạy tests trong watch mode (trong từng app)
cd apps/api && pnpm test:watch
cd apps/mobile && pnpm test:watch

# Chạy E2E tests (backend API)
cd apps/api && pnpm test:e2e
```

### E2E Tests (Maestro — Mobile)

```bash
# Chạy tất cả E2E flows
cd apps/mobile && pnpm test:e2e

# Chạy chỉ nhóm auth flows
cd apps/mobile && pnpm test:e2e:auth

# Chạy 1 flow cụ thể
maestro test apps/mobile/.maestro/flows/auth/login-success.yaml

# Maestro Studio — tạo flow bằng cách tương tác trực tiếp
maestro studio
```

## Hướng dẫn viết test

### 1. NestJS Service Test Pattern

Service tests mock tất cả dependencies (Prisma, JwtService, v.v.) và kiểm tra business logic.

```typescript
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma.service';
import { MyService } from './my.service';

describe('MyService', () => {
  let service: MyService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MyService,
        {
          provide: PrismaService,
          useValue: {
            myModel: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get(MyService);
    prisma = module.get(PrismaService);
  });

  it('should do something', async () => {
    (prisma.myModel.findMany as jest.Mock).mockResolvedValue([]);
    const result = await service.findAll();
    expect(result).toEqual([]);
  });
});
```

### 2. NestJS Controller Test Pattern

Controller tests mock service layer và kiểm tra routing logic.

```typescript
import { Test } from '@nestjs/testing';
import { MyController } from './my.controller';
import { MyService } from './my.service';

describe('MyController', () => {
  let controller: MyController;
  let service: jest.Mocked<MyService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [MyController],
      providers: [
        {
          provide: MyService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    controller = module.get(MyController);
    service = module.get(MyService);
  });

  it('should return items', async () => {
    const result = await controller.findAll();
    expect(service.findAll).toHaveBeenCalled();
    expect(result).toEqual([]);
  });
});
```

### 3. React Native Component Test Pattern

Component tests dùng `@testing-library/react-native` để render và tương tác.

```typescript
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';
import MyComponent from '../MyComponent';

jest.mock('@/stores/my-store');

describe('MyComponent', () => {
  it('should render correctly', () => {
    const { getByText } = render(<MyComponent />);
    expect(getByText('Expected Text')).toBeTruthy();
  });

  it('should handle user interaction', async () => {
    const { getByText, getByPlaceholderText } = render(<MyComponent />);

    fireEvent.changeText(getByPlaceholderText('Input'), 'value');
    fireEvent.press(getByText('Submit'));

    await waitFor(() => {
      expect(getByText('Success')).toBeTruthy();
    });
  });
});
```

### 4. Zustand Store Test Pattern

Store tests gọi actions trực tiếp và kiểm tra state changes.

```typescript
import { useMyStore } from '../my-store';

describe('useMyStore', () => {
  beforeEach(() => {
    useMyStore.setState({ items: [], loading: false });
  });

  it('should fetch items', async () => {
    await useMyStore.getState().fetchItems();
    expect(useMyStore.getState().items).toHaveLength(5);
  });
});
```

---

## Maestro E2E Testing (Mobile)

### Maestro là gì?

[Maestro](https://maestro.mobile.dev/) là framework E2E testing dành riêng cho mobile apps (iOS + Android). Nó cho phép viết test bằng **YAML** đơn giản, không cần code. Maestro tự động tương tác với app trên thiết bị thật hoặc emulator.

**Tại sao chọn Maestro thay vì Detox/Appium:**
- Cú pháp YAML đơn giản, ai cũng đọc được
- Không cần setup phức tạp (no code dependencies)
- Tự động chờ element xuất hiện (built-in waits)
- Có **Maestro Studio** để tạo test bằng cách click trực tiếp
- Hỗ trợ cả Android và iOS
- Tốc độ nhanh hơn Appium, ổn định hơn Detox

### Cài đặt Maestro

#### macOS / Linux

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

#### Windows

Maestro cần chạy trong WSL2 (Windows Subsystem for Linux):

```bash
# 1. Bật WSL2 (PowerShell admin)
wsl --install

# 2. Trong WSL terminal
curl -Ls "https://get.maestro.mobile.dev" | bash

# 3. Kiểm tra cài đặt
maestro --version
```

> **Lưu ý Windows**: Maestro không hỗ trợ Windows native. Phải dùng WSL2 hoặc chạy trên macOS/Linux. Android emulator phải truy cập được từ WSL.

#### Kiểm tra cài đặt

```bash
maestro --version
# Output: Maestro v1.x.x
```

### Yêu cầu trước khi chạy E2E

1. **Android Emulator** đang chạy hoặc **thiết bị thật** kết nối USB
2. **App đã được build và cài đặt** trên device/emulator:
   ```bash
   # Build phiên bản development
   cd apps/mobile
   npx expo run:android     # Android
   npx expo run:ios         # iOS (chỉ trên macOS)
   ```
3. **Backend API** đang chạy (để app có data thực tế):
   ```bash
   cd apps/api && pnpm dev
   ```

### Cú pháp Maestro YAML

#### Cấu trúc cơ bản

```yaml
appId: vn.edu.uit.smartcampus    # Bundle ID của app
name: Tên test case
tags:                             # (Tuỳ chọn) để nhóm tests
  - requires-auth
---
# Các bước test (chạy tuần tự)
- launchApp:
    clearState: true              # Xoá data app trước khi chạy

- assertVisible: "Text hiển thị"
- tapOn: "Text của button"
- inputText: "Nội dung nhập"
```

#### Các lệnh thường dùng

| Lệnh | Mô tả | Ví dụ |
|------|-------|-------|
| `launchApp` | Khởi động app | `- launchApp: { clearState: true }` |
| `tapOn` | Nhấn vào element | `- tapOn: "Đăng nhập"` |
| `inputText` | Nhập text | `- inputText: "hello@email.com"` |
| `assertVisible` | Kiểm tra hiển thị | `- assertVisible: "Trang chủ"` |
| `assertNotVisible` | Kiểm tra KHÔNG hiển thị | `- assertNotVisible: "Loading"` |
| `scrollUntilVisible` | Cuộn cho đến khi thấy | xem bên dưới |
| `swipe` | Vuốt màn hình | `- swipe: { direction: "LEFT" }` |
| `back` | Nhấn nút Back (Android) | `- back` |
| `hideKeyboard` | Ẩn bàn phím | `- hideKeyboard` |
| `waitForAnimationToEnd` | Chờ animation xong | `- waitForAnimationToEnd` |
| `takeScreenshot` | Chụp ảnh màn hình | `- takeScreenshot: "login-screen"` |

#### Timeout tuỳ chỉnh

```yaml
- assertVisible:
    text: "Dữ liệu tải thành công"
    timeout: 10000     # Chờ tối đa 10 giây
```

#### Scroll và tìm element

```yaml
- scrollUntilVisible:
    element: "Footer Text"
    direction: DOWN
    timeout: 20000
```

#### Chụp screenshot để debug

```yaml
- takeScreenshot: "after-login"
```

### Viết flow mới (hướng dẫn)

1. **Tạo file YAML** trong `apps/mobile/.maestro/flows/<feature>/`:
   ```yaml
   appId: vn.edu.uit.smartcampus
   name: <Feature> - <Mô tả>
   tags:
     - <tag>
   ---
   - launchApp:
       clearState: true

   - assertVisible: "Màn hình bắt đầu"
   # ... các bước tương tác ...
   ```

2. **Dùng Maestro Studio** để tạo nhanh:
   ```bash
   maestro studio
   ```
   Studio mở browser, cho phép click trên màn hình device và tự generate YAML.

3. **Chạy thử test**:
   ```bash
   maestro test apps/mobile/.maestro/flows/<feature>/<ten-flow>.yaml
   ```

4. **Tip: Đặt tên element bằng `testID`** để chọn chính xác hơn:
   ```tsx
   <TouchableOpacity testID="login-button" onPress={handleLogin}>
     <Text>Đăng nhập</Text>
   </TouchableOpacity>
   ```
   ```yaml
   - tapOn:
       id: "login-button"   # Dùng testID thay vì text
   ```

### Cấu trúc folder Maestro

Nhóm flows theo feature:

```
.maestro/flows/
├── auth/           # Đăng nhập, đăng ký, quên mật khẩu
├── home/           # Màn hình chính, quick actions
├── schedule/       # Thời khoá biểu
├── grades/         # Xem điểm, GPA
├── notifications/  # Thông báo
├── profile/        # Thông tin cá nhân, cài đặt
└── navigation/     # Chuyển tab, deep links
```

### Quy tắc đặt tên flow

- File name: `<hanh-dong>.yaml` (kebab-case)
- Ví dụ: `login-success.yaml`, `view-schedule.yaml`, `tab-navigation.yaml`
- Name field: `<Feature> - <Mô tả tiếng Việt>` để đọc trên report

### CI/CD với Maestro

Maestro có thể chạy trong CI. Tham khảo file `.github/workflows/e2e-mobile.yml`:

```yaml
# .github/workflows/e2e-mobile.yml (tham khảo)
name: Mobile E2E Tests
on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [develop]

jobs:
  maestro-e2e:
    runs-on: macos-latest   # Cần macOS để chạy iOS simulator
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install Maestro
        run: curl -Ls "https://get.maestro.mobile.dev" | bash

      - name: Install dependencies
        run: npm install -g pnpm && pnpm install

      - name: Build mobile app
        working-directory: apps/mobile
        run: npx expo prebuild && npx expo run:ios

      - name: Run Maestro E2E
        working-directory: apps/mobile
        run: |
          export PATH="$PATH:$HOME/.maestro/bin"
          maestro test .maestro/flows/ --format junit --output e2e-results.xml

      - name: Upload E2E results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: e2e-results
          path: apps/mobile/e2e-results.xml
```

> **Lưu ý**: CI E2E chạy chậm và tốn tài nguyên. Nên chỉ chạy trên `develop` và `main` branches, không chạy trên mỗi PR commit.

---

## Quy tắc viết test

### Quy tắc đặt tên
- Backend: `<tên>.spec.ts` (theo NestJS convention)
- Mobile: `<tên>.test.ts` hoặc `<tên>.test.tsx`
- Shared: `<tên>.test.ts`
- Đặt trong folder `__tests__/` hoặc cùng cấp với file source

### Mục tiêu Coverage

| Package | Branches | Functions | Lines | Statements |
|---------|----------|-----------|-------|------------|
| API | 60% | 60% | 60% | 60% |
| Mobile | 50% | 50% | 50% | 50% |

### Thực hành tốt
- Mỗi service/controller phải có ít nhất 1 test file
- Test cả happy path và error cases
- Mock external dependencies (database, API calls, SecureStore)
- Không test implementation details, chỉ test behavior
- Đặt tên test mô tả rõ ràng: `it('should throw NotFoundException when user not found')`
- Dùng `beforeEach` để reset state giữa các tests
- Nhóm related tests bằng `describe` blocks

### Những thứ KHÔNG nên test (Jest)
- NestJS module definitions (chỉ là wiring)
- DTO classes (class-validator tự xử lý)
- Decorators (test gián tiếp qua controller tests)
- Layout files (`_layout.tsx`) — chỉ là navigation config
- Styles (StyleSheet.create) — visual testing dùng tool khác
- Full user flows (dùng Maestro E2E thay vì Jest cho flows nhiều bước)

## Tích hợp CI/CD

Tests được chạy tự động trong GitHub Actions CI pipeline:
1. Mỗi Pull Request phải pass tất cả tests
2. Coverage reports được upload là artifacts
3. Nếu coverage giảm dưới threshold, CI sẽ fail

## Xử lý sự cố

### Jest

#### Test timeout
```bash
# Tăng timeout cho slow tests
jest --testTimeout=30000
```

#### Lỗi module resolution trong mobile tests
Kiểm tra `moduleNameMapper` trong `jest.config.js` và `transformIgnorePatterns` phù hợp với các packages đang dùng.

#### Prisma mock không hoạt động
Đảm bảo mock PrismaService đúng cấu trúc: `{ modelName: { method: jest.fn() } }`.

### Maestro

#### "No device found"
```bash
# Kiểm tra emulator đang chạy
adb devices              # Android
xcrun simctl list        # iOS (chỉ macOS)
```

#### Element không tìm thấy
- Dùng `maestro studio` để inspect element tree trên màn hình
- Thêm `testID` vào component React Native để chọn chính xác:
  ```tsx
  <View testID="my-element" />
  ```
- Tăng `timeout` nếu element cần thời gian load:
  ```yaml
  - assertVisible:
      text: "Data"
      timeout: 15000
  ```

#### App crash khi chạy flow
- Kiểm tra backend API có đang chạy hay không
- Thử `clearState: true` trong `launchApp` để reset app
- Xem logcat (Android) hoặc Console (iOS) để debug:
  ```bash
  adb logcat | grep -i "smartcampus"   # Android
  ```

#### Maestro không hoạt động trên Windows
Maestro **bắt buộc** chạy qua WSL2 trên Windows. Không hỗ trợ PowerShell/CMD native. Xem phần "Cài đặt Maestro" ở trên.
