# Quy tac Lap trinh

## 1. Naming Conventions

### Chung
| Loai | Convention | Vi du |
|------|-----------|-------|
| Bien | camelCase | `userName`, `isActive` |
| Hang so | UPPER_SNAKE_CASE | `MAX_LIMIT`, `API_PREFIX` |
| Function | camelCase | `getUser()`, `calculateGPA()` |
| Class | PascalCase | `AuthService`, `UserController` |
| Interface/Type | PascalCase | `ApiResponse`, `UserProfile` |
| Enum | PascalCase (key: UPPER_SNAKE) | `UserRole.STUDENT` |

### File naming
| Loai | Convention | Vi du |
|------|-----------|-------|
| Component (RN) | PascalCase | `ScheduleCard.tsx` |
| Screen (RN) | kebab-case | `index.tsx`, `[id].tsx` |
| Module (Nest) | kebab-case | `auth.module.ts`, `auth.service.ts` |
| Util/Hook | kebab-case | `use-api.ts`, `format.ts` |
| Type file | kebab-case | `api-response.ts`, `user.ts` |
| Test file | *.spec.ts / *.test.ts | `auth.service.spec.ts` |

## 2. TypeScript

### Strict mode bat buoc
- `strict: true` trong tsconfig
- Khong dung `any` - su dung `unknown` roi type narrowing
- Su dung `type imports` khi chi import type: `import type { User } from '...'`

### Interface vs Type
- Dung `interface` cho object shapes co the extend
- Dung `type` cho union types, utility types, aliases

```typescript
// Interface cho object shapes
interface User {
  id: string;
  email: string;
}

// Type cho unions va aliases
type UserRole = 'student' | 'lecturer' | 'admin';
type Nullable<T> = T | null;
```

## 3. React Native (Mobile)

### Component Structure
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
// stores/<ten>-store.ts
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
// Dung React Query cho data tu API
const { data, isLoading } = useQuery({
  queryKey: ['schedules', semesterId],
  queryFn: () => scheduleApi.getSchedule(semesterId),
});
```

## 4. NestJS (Backend)

### Module Pattern
- Moi feature la 1 NestJS Module doc lap
- Service chua business logic, Controller chi handle HTTP
- Su dung Dependency Injection

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

### API Response Format
Tat ca response tu API phai theo format:
```json
{
  "success": true,
  "data": { ... },
  "message": "Success",
  "statusCode": 200,
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### Error Handling
- Su dung NestJS built-in exceptions: `NotFoundException`, `UnauthorizedException`, ...
- Global `HttpExceptionFilter` tu dong format error response
- Khong dung try/catch trong controller (de cho filter xu ly)

### API Versioning
- Tat ca endpoint bat dau voi `/api/v1/`
- RESTful naming: danh tu so nhieu (`/users`, `/schedules`, `/grades`)

## 5. Import Order

Thu tu import trong moi file:

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

ESLint `import/order` rule se tu dong enforce thu tu nay.

## 6. Git Conventions

### Branch naming
- `feature/<ten>` - Tinh nang moi
- `fix/<ten>` - Sua loi
- `hotfix/<ten>` - Sua loi khan cap
- `docs/<ten>` - Cap nhat tai lieu

### Commit message
Conventional Commits format: `<type>(<scope>): <description>`

Xem chi tiet tai [CONTRIBUTING.md](../CONTRIBUTING.md).
