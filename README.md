# ⚽ FC Online Realtime Draft Picker

Hệ thống Webapp chọn cầu thủ (Draft Picker) theo thời gian thực chuẩn giải đấu **FC Online Pro League**, xây dựng trên nền tảng **React (Vite) + Node.js (Express) + Socket.io + TailwindCSS**.

---

## 🌟 Tính Năng Nổi Bật

1. **Đồng Bộ Dữ Liệu Thời Gian Thực (WebSocket / Socket.io)**:
   - Các thao tác pick thẻ, chuyển lượt, đếm ngược đồng hồ và trạng thái quỹ lương được đồng bộ tức thì giữa tất cả các máy client (Trọng tài, 4 Đội trưởng, Streamer).
2. **Tích Hợp API FIFAaddict & File Excel**:
   - Tự động lấy danh sách cầu thủ, avatar, huy hiệu mùa thẻ và quốc kỳ từ FIFAaddict.
   - Tự động cộng điểm OVR bonus và hiển thị mức thẻ cộng tối đa (`+4` đến `+8`) dựa trên file dữ liệu `Workbook1.xlsx`.
   - Giới hạn tìm kiếm chỉ trong danh sách 53 mùa thẻ chính thức của giải đấu.
3. **Cơ Chế Snake Draft & Kiểm Soát Luật Nghiêm Ngặt**:
   - **ROUND 1 (1R - 8R)**: 11 cầu thủ chính, quỹ lương $\le 305$, bắt buộc có tối thiểu $\ge 1$ GK.
     - 1R - 3R: Pick 1 cầu thủ / 30s.
     - 4R - 7R: Pick 2 cầu thủ / 60s.
     - 8R: Pick bù (tự động skip nếu đội đã đủ 11 thẻ).
   - **ROUND 2 (-1R - -5R)**: 12 cầu thủ dự bị $\rightarrow$ Tổng 23 cầu thủ, bắt buộc có $\ge 2$ GK.
     - Pick lần lượt: 2 (60s) $\rightarrow 2$ (60s) $\rightarrow 3$ (90s) $\rightarrow 2$ (60s) $\rightarrow 3$ (90s).
4. **Cơ Chế Pick Độc Quyền Cầu Thủ (Exclusive Pick)**:
   - Khi một đội đã chọn một cầu thủ (ví dụ: `L. Messi` mùa `26TS`), tất cả các mùa thẻ khác của cầu thủ này sẽ tự động bị khóa trên toàn hệ thống.
   - Nhận diện và phân biệt chính xác các cầu thủ trùng/na ná tên (`Ronaldo` béo vs `Cristiano Ronaldo` CR7; `Gabriel Batistuta` vs `Gabriel Jesus`...).
5. **Hệ Thống Phân Quyền & Đăng Nhập Tài Khoản**:
   - **Chỉ Trọng tài** mới có quyền: Bắt đầu Draft, Tạm dừng (Pause), Tiếp tục (Resume), Chuyển lượt thủ công, Đặt lại (Reset).
   - Đội trưởng các đội chỉ có thể bấm nút **PICK** khi đến đúng lượt của đội mình.
6. **2 Giao Diện Chuẩn Esports**:
   - **Bảng Tổng Quan (Broadcast Board)**: Bảng 4 cột 13 vòng hiển thị toàn diện đội hình 4 đội kèm banner vàng chữ đen.
   - **Màn Hình Chọn Cầu Thủ (Player Picker)**: Tìm kiếm cầu thủ theo tên, lọc mùa thẻ bằng text/icon tròn, lọc vị trí/OVR/lương, xem trước thẻ FIFA Card lớn và nút PICK to bản.

---

## 👥 Danh Sách Tài Khoản Mặc Định

| Vai trò / Đội | Mã đội | Mật khẩu / Mã PIN | Quyền hạn |
| :--- | :---: | :---: | :--- |
| 🏆 **Trọng Tài / Admin** | `referee` | `123456` | Toàn quyền điều khiển phiên Draft |
| 🦁 **AMITA FCO** | `AMT` | `1111` | Captain Đội 1 (Pick khi tới lượt) |
| 🛡️ **NK FC ONLINE** | `NK` | `2222` | Captain Đội 2 (Pick khi tới lượt) |
| 🔥 **FOR FUN BROTHER** | `FFB` | `3333` | Captain Đội 3 (Pick khi tới lượt) |
| 🦅 **TAG TEAM** | `TAG` | `4444` | Captain Đội 4 (Pick khi tới lượt) |
| 📺 **Khán Giả / Streamer** | `spectator` | *(Không cần PIN)* | Xem toàn màn hình Live Broadcast |

---

## 🛠️ Yêu Cầu Môi Trường

- **Node.js**: Phiên bản `>= 18.x` (Khuyên dùng Node.js 20 LTS hoặc mới hơn).
- **Trình duyệt**: Chrome, Edge, Firefox, Brave, Safari...

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### Cách 1: Khởi Động Nhanh 1-Click trên Windows (Khuyên Dùng)

Nhấp đúp chuột vào file:
👉 **`start.bat`**

Script sẽ tự động mở đồng thời cả Backend (Port 5000) và Frontend (Port 3000).

---

### Cách 2: Cài Đặt & Khởi Chạy Bằng Dòng Lệnh (Manual)

#### 1. Clone repository về máy:
```bash
git clone https://github.com/khanhoh/FifaPicker.git
cd FifaPicker
```

#### 2. Cài đặt thư viện cho Backend:
```bash
cd server
npm install
```

#### 3. Cài đặt thư viện cho Frontend:
```bash
cd ../client
npm install
```

#### 4. Khởi chạy ứng dụng:

Mở 2 cửa sổ terminal riêng biệt:

- **Terminal 1: Khởi động Backend (Port 5000)**
  ```bash
  cd server
  node server.js
  ```

- **Terminal 2: Khởi động Frontend (Port 3000)**
  ```bash
  cd client
  npm run dev
  ```

Truy cập ứng dụng tại: **[http://localhost:3000](http://localhost:3000)**

---

## 📁 Cấu Trúc Dự Án

```
FifaPicker/
├── Workbook1.xlsx             # File dữ liệu mùa thẻ, điểm cộng OVR và max plus
├── Workbook1_backup.xlsx      # Bản sao lưu gốc Excel
├── start.bat                  # Script khởi động 1-click trên Windows
├── package.json               # Package config tổng
├── server/                    # Máy chủ Backend Node.js / Express / Socket.io
│   ├── server.js              # Server chính, REST APIs & WebSocket events
│   ├── draftEngine.js         # State machine Snake Draft, Quỹ lương 305, Pick độc quyền
│   ├── excelParser.js         # Module đọc dữ liệu OVR bonus từ Workbook1.xlsx
│   └── fifaService.js         # Service gọi API FIFAaddict & lọc 53 mùa thẻ
└── client/                    # Ứng dụng Frontend React + TailwindCSS
    ├── public/
    │   └── logos/             # Logo chính thức 4 đội (AMT.png, NK.png, FFB.png, TAG.png)
    └── src/
        ├── App.jsx            # Điều hướng giữa Bảng Tổng Quan và Màn Hình Picker
        ├── context/
        │   └── DraftContext.jsx # Quản lý kết nối WebSocket và state người dùng
        └── components/
            ├── Header.jsx     # Đồng hồ Neon, YOUR TURN, Round badge & Nút Trọng Tài
            ├── BroadcastBoard.jsx     # [Ảnh 1] Bảng tổng quan 4 đội và 13 round đấu
            ├── PlayerSearchPicker.jsx # [Ảnh 2] Tìm kiếm cầu thủ, xem thẻ và nút PICK
            ├── PlayerCard.jsx         # Thẻ FIFA Card lớn hiển thị OVR (đã cộng)
            ├── LoginModal.jsx         # Modal đăng nhập Trọng tài & Đội trưởng
            └── RulesModal.jsx         # Modal hiển thị bảng luật giải đấu chi tiết
```

---

## 📜 Giấy Phép & Bản Quyền

Dự án phát triển phục vụ giải đấu giao hữu và cộng đồng FC Online Việt Nam.
Dữ liệu chỉ số cầu thủ được cung cấp thông qua API FIFAaddict.
