# Quy tắc Lập trình

## 1. Quy ước Đặt tên

### Chung
| Loại | Convention | Ví dụ |
|------|-----------|-------|
| Biến | camelCase | `userName`, `isActive` |
| Hằng số | UPPER_SNAKE_CASE | `MAX_LIMIT`, `API_PREFIX` |
| Function | camelCase | `getUser()`, `calculateGPA()` |
| Class | PascalCase | `AuthService`, `UserController` |
| Interface/Type | PascalCase | `ApiResponse`, `UserProfile` |
| Enum | PascalCase (key: UPPER_SNAKE) | `UserRole.STUDENT` |

### Đặt tên file
| Loại | Convention | Ví dụ |
|------|-----------|-------|
| Component (RN) | PascalCase | `ScheduleCard.tsx` |
| Screen (RN) | kebab-case | `index.tsx`, `[id].tsx` |
| Module (Nest) | kebab-case | `auth.module.ts`, `auth.service.ts` |
| Util/Hook | kebab-case | `use-api.ts`, `format.ts` |
| Type file | kebab-case | `api-response.ts`, `user.ts` |
| Test file | *.spec.ts / *.test.ts | `auth.service.spec.ts` |

## 2. TypeScript

### Strict mode bắt buộc
- `strict: true` trong tsconfig
- Không dùng `any` — sử dụng `unknown` rồi type narrowing
- Sử dụng `type imports` khi chỉ import type: `import type { User } from '...'`

### Interface vs Type
- Dùng `interface` cho object shapes có thể extend
- Dùng `type` cho union types, utility types, aliases

```typescript
// Interface cho object shapes
interface User {
  id: string;
  email: string;
}

// Type cho unions và aliases
type UserRole = 'student' | 'lecturer' | 'admin';
type Nullable<T> = T | null;
```

## 3. React Native (Mobile)

### Cấu trúc Component
```typescript
// 1. Imports
import { StyleSheet, View, Text } from 'react-native';

// 2. Props interface
interface ScheduleCardProps {
  title: string;
  time: string;
  room: string;
}

// 3. Component
export function ScheduleCard({ title, time, room }: ScheduleCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.detail}>{time} - {room}</Text>
    </View>
  );
}

// 4. Styles
const styles = StyleSheet.create({
  container: { ... },
  title: { ... },
  detail: { ... },
});
```

### State Management (Zustand)
```typescript
// stores/<tên>-store.ts
interface SomeState {
  data: Item[];
  loading: boolean;
  fetchData: () => Promise<void>;
}

export const useSomeStore = create<SomeState>((set) => ({
  data: [],
  loading: false,
  fetchData: async () => {
    set({ loading: true });
    try {
      const data = await api.getData();
      set({ data, loading: false });
    } catch {
      set({ loading: false });
    }
  },
}));
```

### React Query cho Server State
```typescript
// Dùng React Query cho data từ API
const { data, isLoading } = useQuery({
  queryKey: ['schedules', semesterId],
  queryFn: () => scheduleApi.getSchedule(semesterId),
});
```

## 4. NestJS (Backend)

### Module Pattern
- Mỗi feature là 1 NestJS Module độc lập
- Service chứa business logic, Controller chỉ handle HTTP
- Sử dụng Dependency Injection

### DTO Validation
```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'user@uit.edu.vn' })
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password!: string;
}
```

### Định dạng API Response
Tất cả response từ API phải theo format:
```json
{
  "success": true,
  "data": { ... },
  "message": "Success",
  "statusCode": 200,
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### Xử lý lỗi
- Sử dụng NestJS built-in exceptions: `NotFoundException`, `UnauthorizedException`, ...
- Global `HttpExceptionFilter` tự động format error response
- Không dùng try/catch trong controller (để cho filter xử lý)

### API Versioning
- Tất cả endpoint bắt đầu với `/api/v1/`
- RESTful naming: danh từ số nhiều (`/users`, `/schedules`, `/grades`)

## 5. Thứ tự Import

Thứ tự import trong mỗi file:

```typescript
// 1. Node built-in modules
import { join } from 'path';

// 2. External packages
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// 3. Internal packages (monorepo)
import { ApiResponse } from '@smart-campus/shared';

// 4. Parent imports
import { DatabaseModule } from '../../database/database.module';

// 5. Sibling/Index imports
import { AuthService } from './auth.service';
```

ESLint `import/order` rule sẽ tự động enforce thứ tự này.

## 6. Quy ước Git

### Đặt tên branch
- `feature/<tên>` — Tính năng mới
- `fix/<tên>` — Sửa lỗi
- `hotfix/<tên>` — Sửa lỗi khẩn cấp
- `docs/<tên>` — Cập nhật tài liệu

### Commit message
Conventional Commits format: `<type>(<scope>): <description>`

Xem chi tiết tại [CONTRIBUTING.md](../CONTRIBUTING.md).
