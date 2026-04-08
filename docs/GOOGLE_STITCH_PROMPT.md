# Google Stitch Prompt - UIT Smart Campus

Đây là bản prompt `SUPER STRICT` để khóa phạm vi thiết kế thật sát, tránh việc Google Stitch sinh quá nhiều màn hình trùng lặp hoặc flow miên man.

Mục tiêu của bản này:

- khóa rõ **phần cứng hiện có**
- khóa rõ **dữ liệu và tính năng hiện có**
- khóa rõ **những gì phải thiết kế**
- khóa rõ **những gì không được tự ý thiết kế thêm**
- khóa rõ **rule thiết kế visual + UX + dark mode + accessibility**

## Cách dùng

1. Paste nguyên block prompt ở cuối file vào Google Stitch.
2. Nếu Stitch vẫn đẻ thêm nhiều màn, nhắc tiếp đúng câu này:
   `Do not add any new screen families, do not create duplicate flows, and reuse the required templates exactly as defined.`
3. Nếu Stitch vẫn quá lan man, yêu cầu nó output theo thứ tự:
   - `Design system`
   - `5-tab shell`
   - `16 core screens`
   - `role variants`
   - `dark mode`

## Những gì prompt này khóa

### 1. Phần cứng hiện có

Phải bám đúng các thành phần phần cứng thật đang có:

- `ESP32`
- `RFID RC522`
- `4 cảm biến slot` cho `A1`, `A2`, `A3`, `A4`
- `DHT11` cho `nhiệt độ` và `độ ẩm`
- `cảm biến mưa`
- `cảm biến lửa`
- `servo barrier`
- `1 webcam dùng chung`
- `1 local gateway`
- `1 dịch vụ LPR` để nhận diện biển số

### 2. Dữ liệu và chức năng thật đang có

Prompt phải bám đúng dữ liệu thật và backend thật:

- RFID scan result
- recognized license plate
- parking slot occupancy A1-A4
- available / occupied / total slots
- temperature
- humidity
- rain detected
- fire detected
- gate / barrier decision
- parking entry / exit session
- registered vehicles
- parking subscription status
- parking monthly payment via MoMo
- notifications
- schedule
- grades / GPA
- fire alerts

### 3. Giới hạn kỹ thuật realtime

- Mobile hiện tại **không có websocket/SSE riêng**
- Chỉ được thiết kế realtime theo kiểu `snapshot + polling`
- Chu kỳ refresh mặc định: `10-15 giây`
- Sau `30 giây` không có dữ liệu mới -> hiển thị `stale state`

## Screen Manifest bị khóa

Google Stitch chỉ được tạo đúng:

- `10 screen families`
- `16 core screens`
- `1 shared service detail template`
- `1 reusable modal/dialog system`

Không được tạo thêm screen family mới ngoài danh sách.

### 10 screen families bắt buộc

1. `App Shell`
2. `Auth`
3. `Home Dashboard`
4. `Schedule / Operations`
5. `Services Hub`
6. `Parking + IoT`
7. `Alerts`
8. `Profile + Settings`
9. `Legal + Permissions`
10. `Account Deletion`

### 16 core screens bắt buộc

1. `Splash`
2. `Auth screen`  
   Login + Register nằm trong cùng một family, có thể dùng segmented control / tab / stepper, không tách thành hai flow dài riêng
3. `Forgot / Reset password`
4. `Home Dashboard`
5. `Schedule screen` cho Student / Lecturer
6. `Operations screen` cho Admin / Super Admin
7. `Services Hub`
8. `Shared Service Detail Template`
9. `Parking + IoT Overview`
10. `Vehicle Registration`
11. `Parking Payment Handoff / Status`
12. `Alerts Center`
13. `Alert Detail`
14. `Profile Overview`
15. `Settings + Support`
16. `Legal + Permissions + Account Deletion Entry`

Quy ước quan trọng:

- `Privacy Policy`, `Terms`, `Permissions & Data Usage`, `Help & Support`, `About`, `Delete account entry` phải nằm trong `Settings + Support` hoặc `Legal + Permissions + Account Deletion Entry`, **không tách thành quá nhiều màn reader riêng** trừ khi thật sự cần.
- `Events`, `Course Registration`, `Room Booking`, `QR Attendance`, `Campus Map`, `Library`, `AI Chatbot`, `Smart Classroom` chỉ đi qua:
  - `Services Hub`
  - `Shared Service Detail Template`
- Không thiết kế full flow riêng cho từng module future.

## Nội dung bắt buộc của từng màn

### 1. Splash

Phải có:

- logo / brand lockup
- loading state ngắn gọn
- light mode + dark mode version

Không được có:

- quá nhiều text
- nhiều CTA

### 2. Auth screen

Phải có:

- login form
- register form
- chuyển đổi rõ giữa đăng nhập và đăng ký
- email
- mật khẩu
- xác nhận mật khẩu cho register
- MSSV / thông tin cơ bản cho register
- validation state
- error state

Không được có:

- flow auth nhiều bước dài dòng
- quá nhiều màn auth riêng lẻ

### 3. Forgot / Reset password

Phải có:

- nhập email
- gửi yêu cầu
- trạng thái thành công / thất bại

### 4. Home Dashboard

Phải là **một shared layout** với variant theo role.

Phải có:

- greeting
- role badge
- 1 hero summary area
- today snapshot
- unread notifications summary
- quick actions
- parking summary
- emergency banner khi có fire alert / stale telemetry

Biến thể:

- Student:
  - lịch hôm nay
  - GPA / điểm mới
  - thông báo mới
  - parking summary
- Lecturer:
  - lịch dạy hôm nay
  - attendance action
  - class notification summary
  - grading task summary
- Admin / Super Admin:
  - operations summary
  - parking health
  - fire alerts
  - IoT gateway health

### 5. Schedule screen

Chỉ cho Student / Lecturer.

Phải có:

- weekly / daily academic schedule
- next class card
- empty state
- loading state

Không được tự đẻ thêm:

- nhiều màn lịch con không cần thiết

### 6. Operations screen

Chỉ cho Admin / Super Admin.

Phải có:

- operations summary
- parking ops summary
- fire alert log summary
- IoT gateway health summary
- quick links tới management tools

Không được:

- biến thành dashboard desktop phức tạp

### 7. Services Hub

Phải có:

- grouped service cards
- search nếu cần
- các nhóm:
  - Academic
  - Campus life
  - Campus utilities
  - Teaching tools
  - Admin tools

Phải đưa các module roadmap vào đây:

- Events
- Course Registration
- Room Booking
- QR Attendance
- Campus Map
- Library
- AI Chatbot
- Smart Classroom

Không được:

- tạo full screen family mới cho từng module ở bước này

### 8. Shared Service Detail Template

Đây là một template dùng chung cho các module roadmap.

Phải có:

- page title
- module summary
- 1 primary action
- content sections
- empty / loading / unavailable state

Không được:

- thiết kế 7-8 template khác nhau gần giống nhau

### 9. Parking + IoT Overview

Đây là màn quan trọng nhất.

Phải có:

- available / occupied / total hero summary
- slot grid cho `A1-A4`
- sensor cards cho:
  - nhiệt độ
  - độ ẩm
  - mưa
  - lửa
- gateway/device status
- last updated
- online state
- stale state
- offline state
- fire alert state
- CTA đăng ký xe
- vehicle list summary
- subscription status
- payment entry CTA

Không được:

- làm thành nhiều dashboard parking khác nhau
- tạo quá nhiều màn parking trùng nội dung

### 10. Vehicle Registration

Phải có:

- biển số
- RFID
- ghi chú / label
- validation UX
- success / error state

### 11. Parking Payment Handoff / Status

Phải có:

- subscription status
- monthly fee
- payment CTA
- pending / success / failed states
- note rằng đây là physical parking service

### 12. Alerts Center

Phải có:

- all alerts
- unread filter
- emergency grouping
- normal notifications grouping
- empty / offline / error state

### 13. Alert Detail

Phải có:

- title
- severity
- timestamp
- location / gate context nếu có
- sensor context nếu có
- CTA back / acknowledge

### 14. Profile Overview

Phải có:

- avatar
- basic account info
- role
- profile summary
- entry vào settings

### 15. Settings + Support

Phải có:

- account & security
- permissions & data usage entry
- privacy policy entry
- terms entry
- help & support
- about / developer identity
- logout

### 16. Legal + Permissions + Account Deletion Entry

Phải có:

- privacy policy summary / entry
- terms of service summary / entry
- permissions & data usage explanation
- account deletion entry point
- data retention / deletion note

Không được:

- tách quá nhiều legal reader screens gần giống nhau

## Rule chống sinh màn lung tung

Các câu này phải đưa vào prompt để Stitch bị khóa:

- Do not add any screen family outside the required list.
- Do not create separate full flows for every future module.
- Use variants instead of duplicate screens.
- Reuse one shared service detail template.
- Reuse one shared modal/dialog pattern.
- If a need can be solved with a bottom sheet, modal, drawer, or section, do not create a new screen.
- Keep the output compact and implementation-friendly.

## Design Rules bị khóa

### I. Layout & Balance

- Use `8pt grid`
- `4pt` sub-spacing allowed
- Standard spacing `16-24px`
- All screens must feel visually balanced
- Avoid clutter
- Only one primary action per screen

### II. Banner

- Banner height max `25-35%` of screen height
- Radius `12-20px`
- Maximum `1-2` banners per screen
- Do not stack large banners

### III. Color System

- cool, soft, low-saturation palette
- primary anchored around `#1E40AF`
- secondary cool gray / white
- accent mint or very soft violet used sparingly
- avoid harsh saturated colors
- ensure readable contrast

### IV. Modern UI Style

- minimal
- soft UI
- rounded corners
- very soft shadow
- optional subtle glass only
- no skeuomorphic style

### V. Typography

- Inter or Roboto preferred
- Be Vietnam Pro acceptable if Stitch handles Vietnamese well
- max 2 fonts
- Heading `20-28px`
- Body `14-16px`
- Caption `12px`
- line height `1.4-1.6`

### VI. Components

- Buttons:
  - radius `10-16px`
  - padding `12-16px`
  - normal / pressed / disabled
- Cards:
  - radius `12-20px`
  - soft shadow
  - padding `12-20px`
- Icons:
  - outline / minimal line only
  - size `20-24px`
- Inputs:
  - clear focus state
  - validation message

### VII. UX

- strong hierarchy
- one main purpose per screen
- short flows
- subtle animation only
- fade and scale are enough
- interaction response under `300ms`
- skeleton loading preferred over spinner

### VIII. Accessibility

- tap target at least `44px`, preferably `48dp`
- no color-only meaning
- readable contrast
- icon + label pairing
- emergency states immediately understandable

### IX. Dark Mode

- mandatory
- use `#0F172A` / `#111827` style dark background
- avoid pure black
- same design consistency as light mode
- lower shadow intensity in dark mode

### X. Required States

Phải account đủ các state sau ở các màn chính:

- loading
- skeleton
- empty
- error
- offline
- stale telemetry
- no data yet
- no vehicle
- expired subscription
- successful payment
- failed payment
- permission denied
- account deletion confirmation
- fire alert

## Prompt để copy vào Google Stitch

```text
Design an Android-first mobile app UI for "UIT Smart Campus", a university super app for the University of Information Technology (UIT), VNU-HCM.

Use English for instructions, but all user-facing app copy must be proper Vietnamese with full diacritics.

STRICT SCOPE LOCK:
- Do NOT generate too many overlapping screens.
- Do NOT add any screen family outside the required list.
- Create exactly 10 screen families.
- Create exactly 16 core screens.
- Use role-based variants instead of duplicate screens.
- Reuse one shared service detail template.
- Reuse one shared modal/dialog pattern.
- If a need can be solved with a bottom sheet, modal, drawer, section, or accordion, do NOT create a new screen.
- Keep the design compact, practical, and implementation-friendly.

The 10 required screen families are:
1. App Shell
2. Auth
3. Home Dashboard
4. Schedule / Operations
5. Services Hub
6. Parking + IoT
7. Alerts
8. Profile + Settings
9. Legal + Permissions
10. Account Deletion

The 16 required core screens are:
1. Splash
2. Auth screen
3. Forgot / Reset password
4. Home Dashboard
5. Schedule screen
6. Operations screen
7. Services Hub
8. Shared Service Detail Template
9. Parking + IoT Overview
10. Vehicle Registration
11. Parking Payment Handoff / Status
12. Alerts Center
13. Alert Detail
14. Profile Overview
15. Settings + Support
16. Legal + Permissions + Account Deletion Entry

Roles:
- Student
- Lecturer
- Admin
- Super Admin

Use shared layouts with role-based variants. Do not design 4 separate apps.

Real hardware that exists:
- ESP32
- RFID RC522
- 4 parking slot sensors for A1, A2, A3, A4
- DHT11 sensor for temperature and humidity
- rain sensor
- fire sensor
- servo barrier
- one shared webcam
- one local gateway
- one license plate recognition service

Real data and backend-supported capabilities already available:
- RFID scan result
- recognized license plate
- parking slot occupancy for A1-A4
- available / occupied / total slots
- temperature
- humidity
- rain detected
- fire detected
- gate / barrier decision
- parking entry / exit session
- registered vehicles
- parking subscription status
- monthly parking payment via MoMo
- notifications
- schedule
- grades / GPA
- fire alerts

Realtime technical constraint:
- Mobile currently does NOT have websocket or SSE.
- Design mobile "live status" using snapshot + polling only.
- Assume refresh every 10-15 seconds.
- Show stale state after 30 seconds without fresh data.

Design intent:
- modern
- cool
- soft
- low saturation
- balanced
- credible
- production-minded
- not overloaded

Color system:
- primary anchored around #1E40AF
- secondary cool gray / white
- optional mint or very soft violet accents used sparingly
- avoid harsh saturated colors

Typography:
- prefer Inter or Roboto
- Be Vietnam Pro is acceptable only if Vietnamese rendering looks excellent
- max 2 fonts total
- heading 20-28px
- body 14-16px
- caption 12px
- line height 1.4-1.6

Layout rules:
- use 8pt grid
- allow 4pt sub-spacing
- standard spacing 16-24px
- keep visual balance
- one main action per screen
- avoid clutter

Banner rules:
- banner height max 25-35% of the screen height
- radius 12-20px
- maximum 1-2 banners per screen
- do not stack large banners

Component rules:
- buttons: rounded 10-16px, padding 12-16px, proper normal/pressed/disabled states
- cards: rounded 12-20px, very soft shadows, padding 12-20px
- icons: outline or minimal line style only, consistent 20-24px sizing
- inputs: clear focus state, validation-friendly, clean and accessible

UX rules:
- short flows
- strong hierarchy
- only one primary action per screen
- subtle animation only
- fade and small scale transitions are enough
- interaction response under 300ms
- use skeleton loading instead of heavy spinner usage where possible

Accessibility rules:
- tap target at least 44px, preferably 48dp
- strong readable contrast
- never use color as the only status signal
- pair icons with text labels
- emergency UI must be immediately understandable

Dark mode:
- mandatory
- use dark gray backgrounds such as #0F172A or #111827
- avoid pure black
- keep the same design language as light mode
- reduce shadow intensity in dark mode

NOW DESIGN THE REQUIRED CORE SCREENS ONLY:

1. Splash
- brand lockup
- short loading state
- no extra CTA

2. Auth screen
- login and register in the same family
- clear toggle between login and register
- email
- password
- register fields for basic account info
- validation
- error state

3. Forgot / Reset password
- email input
- submit action
- success and failure messaging

4. Home Dashboard
- one shared layout with role-based content variants
- student variant: today's classes, GPA/score summary, unread notifications, parking summary, quick actions
- lecturer variant: today's classes, attendance actions, class notices, grading tasks
- admin/super admin variant: operations summary, parking health, fire alerts, IoT gateway health
- include emergency banner logic

5. Schedule screen
- only for student/lecturer academic schedule usage
- daily/weekly structure
- next class card
- loading and empty state

6. Operations screen
- only for admin/super admin
- operations summary
- parking ops summary
- fire alert summary
- IoT gateway health summary

7. Services Hub
- grouped cards only
- categories:
  - Academic
  - Campus life
  - Campus utilities
  - Teaching tools
  - Admin tools
- future modules must appear here as service entries, not as full new screen families

8. Shared Service Detail Template
- one reusable detail layout for events, course registration, room booking, QR attendance, campus map, library, AI chatbot, smart classroom
- one primary action
- summary
- content sections
- loading / empty / unavailable states

9. Parking + IoT Overview
- this is the flagship live-status screen
- available / occupied / total hero summary
- slot grid for A1-A4
- temperature, humidity, rain, fire cards
- last updated
- gateway/device status
- online / stale / offline / fire-alert states
- vehicle summary
- subscription summary
- CTA to register vehicle
- CTA to continue payment
- empty state when no vehicle is registered

10. Vehicle Registration
- plate number
- RFID
- optional label
- validation
- success / error state

11. Parking Payment Handoff / Status
- monthly fee
- subscription status
- payment CTA
- pending / success / failed states
- note that this is a real-world physical parking service

12. Alerts Center
- all alerts
- unread filter
- normal vs emergency grouping
- empty / offline / error states

13. Alert Detail
- title
- severity
- timestamp
- gate/location context if available
- sensor context if available

14. Profile Overview
- avatar
- basic info
- role
- profile summary
- entry to settings

15. Settings + Support
- account and security
- permissions & data usage entry
- privacy policy entry
- terms entry
- help and support
- about / developer identity
- logout

16. Legal + Permissions + Account Deletion Entry
- privacy policy summary or reader entry
- terms summary or reader entry
- permissions and data usage explanation
- data retention / deletion explanation
- account deletion entry point

Important anti-sprawl rules:
- Do NOT create a separate full flow for each future service module.
- Do NOT create multiple parking dashboards.
- Do NOT create multiple legal reader screens unless absolutely necessary.
- Do NOT create duplicate home screens with different layouts; use variants.
- Do NOT create extra onboarding flows, setup wizards, or promo screens beyond the required list.

Required state coverage across the main screens:
- loading
- skeleton
- empty
- error
- offline
- stale telemetry
- no data yet
- no vehicle
- expired subscription
- successful payment
- failed payment
- permission denied
- account deletion confirmation
- fire alert

Output requirements:
- produce a compact but complete design system
- produce the 5-tab shell
- produce exactly the required core screens
- use variants instead of duplicate screens
- include key light mode and dark mode screens
- include a few tablet/foldable adaptations only for the most important screens
- keep everything implementation-friendly for engineers
```
