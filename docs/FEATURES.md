# Danh sach Tinh nang

## Phan chia theo Phase

### Phase 1 - MVP (Sprint 1-4, ~8 tuan)

#### 1.1 Authentication (Auth)
- **Do uu tien**: Cao
- **Do kho**: De
- **Mo ta**: Dang nhap, dang ky, refresh token, dang xuat
- **User stories**:
  - Sinh vien co the dang ky tai khoan voi email UIT va MSSV
  - Sinh vien co the dang nhap bang email va mat khau
  - He thong tu dong refresh token khi het han
  - Sinh vien co the dang xuat tren tat ca thiet bi
- **Acceptance criteria**:
  - [x] API: POST /auth/register
  - [x] API: POST /auth/login
  - [x] API: POST /auth/refresh
  - [x] API: POST /auth/logout
  - [ ] Mobile: Man hinh dang nhap
  - [ ] Mobile: Man hinh dang ky
  - [ ] Mobile: Luu token vao SecureStore
  - [ ] Mobile: Auto-redirect khi da dang nhap

#### 1.2 Profile sinh vien
- **Do uu tien**: Cao
- **Do kho**: De
- **Mo ta**: Xem va cap nhat thong tin ca nhan
- **User stories**:
  - Sinh vien co the xem thong tin ca nhan (ho ten, MSSV, khoa, nganh)
  - Sinh vien co the cap nhat so dien thoai, dia chi, anh dai dien
- **Acceptance criteria**:
  - [x] API: GET /users/me
  - [x] API: PATCH /users/me
  - [ ] Mobile: Man hinh profile
  - [ ] Mobile: Form cap nhat thong tin

#### 1.3 Xem thoi khoa bieu
- **Do uu tien**: Cao
- **Do kho**: De
- **Mo ta**: Hien thi thoi khoa bieu theo tuan/ngay
- **User stories**:
  - Sinh vien co the xem thoi khoa bieu cua hoc ky hien tai
  - Sinh vien co the chuyen doi giua cac hoc ky
  - Sinh vien co the xem chi tiet mot buoi hoc (phong, giang vien, thoi gian)
- **Acceptance criteria**:
  - [x] API: GET /schedules
  - [x] API: GET /schedules/semesters
  - [x] API: GET /schedules/:id
  - [ ] Mobile: Calendar view theo tuan
  - [ ] Mobile: Danh sach buoi hoc theo ngay
  - [ ] Mobile: Chi tiet buoi hoc

#### 1.4 Xem diem va GPA
- **Do uu tien**: Cao
- **Do kho**: De
- **Mo ta**: Xem bang diem va tinh GPA
- **User stories**:
  - Sinh vien co the xem bang diem tat ca mon theo tung ky
  - Sinh vien co the xem GPA tich luy va GPA tung ky
- **Acceptance criteria**:
  - [x] API: GET /grades
  - [x] API: GET /grades/gpa
  - [ ] Mobile: Bang diem theo ky
  - [ ] Mobile: GPA summary card
  - [ ] Mobile: Filter theo hoc ky

#### 1.5 Thong bao
- **Do uu tien**: Trung binh
- **Do kho**: Trung binh
- **Mo ta**: Nhan thong bao tu he thong
- **User stories**:
  - Sinh vien nhan thong bao khi co thay doi lich hoc
  - Sinh vien nhan thong bao khi co diem moi
  - Sinh vien co the danh dau da doc / doc tat ca
- **Acceptance criteria**:
  - [x] API: GET /notifications
  - [x] API: GET /notifications/unread-count
  - [x] API: PATCH /notifications/:id/read
  - [x] API: PATCH /notifications/read-all
  - [ ] Mobile: Danh sach thong bao
  - [ ] Mobile: Badge so thong bao chua doc
  - [ ] Push notification (Firebase)

#### 1.6 AI Chatbot (Basic)
- **Do uu tien**: Trung binh
- **Do kho**: Trung binh
- **Mo ta**: Chatbot tra loi cau hoi cua sinh vien
- **User stories**:
  - Sinh vien co the hoi cac cau hoi ve truong (phong hoc, thu tuc, lich trinh)
  - Chatbot tra loi dua tren knowledge base cua truong
- **Acceptance criteria**:
  - [ ] API: POST /chatbot/message
  - [ ] OpenAI API integration
  - [ ] Knowledge base co ban
  - [ ] Mobile: Giao dien chat

---

### Phase 2 - Extended (Sprint 5-8)

#### 2.1 Smart Attendance (QR Code Check-in)
- Giang vien tao QR code cho buoi hoc
- Sinh vien scan QR de diem danh
- Tu dong luu ket qua vao he thong

#### 2.2 Event & Community System
- Xem danh sach su kien cua truong
- Dang ky tham gia su kien
- Check-in su kien bang QR
- Quan ly CLB

#### 2.3 Campus Navigation
- Ban do 2D cua khuon vien truong
- Tim phong hoc, phong lab, canteen, thu vien
- Chi duong trong campus

#### 2.4 Smart Library
- Tim kiem sach
- Xem tinh trang con/het
- Dat cho ngoi hoc

#### 2.5 Dang ky mon hoc
- Xem danh sach mon hoc mo
- Dang ky/huy dang ky mon hoc

---

### Phase 3 - Advanced (Sprint 9+)

#### 3.1 Smart Parking (IoT)
- Hien thi so cho trong
- Camera nhan dien bien so xe

#### 3.2 Smart Classroom (IoT)
- Dieu khien den, may lanh qua IoT
- Tu dong bat may chieu khi co lop

#### 3.3 Smart Energy (IoT)
- Theo doi tieu thu dien
- AI toi uu hoa nang luong

#### 3.4 Smart Security
- Camera AI phat hien bat thuong
- Canh bao an ninh

#### 3.5 Face Recognition Attendance
- Diem danh bang nhan dien khuon mat
