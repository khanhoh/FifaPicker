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
   - **ROUND 1 (1R - 8R)**: 11 cầu thủ chính, quỹ lương $\le 305$, bắt buộc có đúng 1 GK.
     - 1R - 3R: Pick 1 cầu thủ / 30s.
     - 4R - 7R: Pick 2 cầu thủ / 60s.
     - 8R: Pick bù đúng số còn thiếu, lặp đến khi cả 4 đội đủ 11 thẻ.
   - **ROUND 2 (-1R - -6R)**: 12 cầu thủ dự bị $\rightarrow$ Tổng 23 cầu thủ, bắt buộc dự bị có đúng 1 GK; -6R bù đến khi đủ.
     - Pick lần lượt: 2 (60s) $\rightarrow 2$ (60s) $\rightarrow 3$ (90s) $\rightarrow 2$ (60s) $\rightarrow 3$ (90s).
4. **Cơ Chế Pick Độc Quyền Cầu Thủ (Exclusive Pick)**:
   - Khi một đội đã chọn một cầu thủ (ví dụ: `L. Messi` mùa `26TS`), tất cả các mùa thẻ khác của cầu thủ này sẽ tự động bị khóa trên toàn hệ thống.
   - Nhận diện và phân biệt chính xác các cầu thủ trùng/na ná tên (`Ronaldo` béo vs `Cristiano Ronaldo` CR7; `Gabriel Batistuta` vs `Gabriel Jesus`...).
5. **Room riêng & phân quyền bằng session token**:
   - Trọng tài tạo room và chia sẻ mã 6 ký tự. Bốn lựa chọn đội được cố định là **AMT, NK, FFB và TAG**, gồm đúng metadata, màu và logo giải đấu.
   - Khi join, người chơi được server phân ngẫu nhiên vào một đội còn trống; có thể swap trực tiếp trong Lobby. Trọng tài có quyền randomize toàn bộ vị trí.
   - **Chỉ Trọng tài** mới có quyền: Bắt đầu Draft, Tạm dừng (Pause), Tiếp tục (Resume), Chuyển lượt thủ công, Đặt lại (Reset).
   - Đội trưởng các đội chỉ có thể bấm nút **PICK** khi đến đúng lượt của đội mình.
   - Mất kết nối không làm Draft dừng. Slot vẫn được giữ, đồng hồ tiếp tục chạy và đội không reconnect kịp sẽ mất lượt.
6. **2 Giao Diện Chuẩn Esports**:
   - **Bảng Tổng Quan (Broadcast Board)**: Bảng 4 cột 13 vòng hiển thị toàn diện đội hình 4 đội kèm banner vàng chữ đen.
   - **Màn Hình Chọn Cầu Thủ (Player Picker)**: Tìm kiếm cầu thủ theo tên, lọc mùa thẻ bằng text/icon tròn, lọc vị trí/OVR/lương, xem trước thẻ FIFA Card lớn và nút PICK to bản.

---

## 👥 Luồng tham gia Room

1. Trọng tài chọn **Tạo Room**, nhập tên và copy mã 6 ký tự.
2. Bốn người chơi chọn **Join Room**, nhập mã và tên Captain; server tự phân ngẫu nhiên vào AMT, NK, FFB hoặc TAG còn trống.
3. Người chơi có thể swap sang vị trí khác; nếu vị trí đã có người thì hai Captain được hoán đổi ngay. Trọng tài có thể randomize toàn bộ vị trí hoặc xóa người chơi khỏi Lobby.
4. Nút **Bắt đầu Draft** chỉ mở khi đủ 4 đội đang online. Nút này đưa mọi người vào màn hình chờ Draft nhưng chưa chạy đồng hồ; Trọng tài phải xác nhận thêm một lần để bắt đầu lượt pick đầu tiên.
5. Khán giả chọn chế độ **Khán giả**, nhập mã để xem mà không chiếm team slot.
6. Trọng tài có thể chọn **Hủy Room** để thu hồi toàn bộ session và ngắt kết nối tất cả thành viên.

Quyền hạn được gắn với token riêng do server cấp và được lưu trên trình duyệt để reconnect đúng slot. Mã room chỉ dùng để tìm room, không cấp quyền Trọng tài hay quyền của đội.

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

### Xem nhanh giao diện không cần tạo Room

Mở **[http://localhost:3000/smoke](http://localhost:3000/smoke)** để xem Lobby, modal chờ bắt đầu, Broadcast, Pick, modal lỗi luật Pick, Ban và Xếp đội hình bằng dữ liệu giả. Thanh Smoke Preview cho phép đổi màn hình, vai trò, đội và case lỗi; chế độ này không tạo Room, không mở Socket.io và không thay đổi dữ liệu phiên thật. Trạng thái có thể chia sẻ bằng query string, ví dụ `/smoke?view=ready&role=team&team=3` hoặc `/smoke?view=pick-error&role=team&team=1&error=salary`.

Dropdown **Test case** trên thanh Smoke Preview có sẵn các tình huống review nhanh:

- `D01`: Trọng tài xem modal xác nhận và bấm bắt đầu đếm ngược.
- `D02`: Captain xem modal chờ với đúng tên đội và slot pick.
- `D03`: Khán giả xem modal chờ Trọng tài.
- `D04`: mở modal lỗi luật Pick và đổi giữa các case lương/GK.
- `D05`: kiểm tra tên người chơi tương ứng tại cột và thẻ tóm tắt của bảng Draft.
- `D06`: kiểm tra `-5R` bắt đầu ở Team 1 và đi theo chiều `1 → 2 → 3 → 4`.
- `P01`: xác nhận trang Pick không còn Team Color/chỉ số ẩn vàng; chọn GK, nhập Max Salary `6` và Search để kiểm tra kết quả.
- `B01`: kiểm tra tên người chơi hiển thị cạnh tên đội tại trang Ban.
- `L01`: Trọng tài xem hai lineup chưa khóa và thử **Kết thúc lineup** để quay lại chọn cặp đấu.
- `L02`: Captain FFB nằm ngoài cặp AMT–NK xem hai lineup ở chế độ read-only.
- `L03`: Khán giả xem hai lineup ở chế độ read-only.
- `L04`: Trọng tài xem trạng thái hai lineup đã khóa và nút Ban lại.

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
    │   └── logos/             # Asset logo tùy chọn
    └── src/
        ├── App.jsx            # Điều hướng giữa Bảng Tổng Quan và Màn Hình Picker
        ├── context/
        │   └── DraftContext.jsx # Quản lý kết nối WebSocket và state người dùng
        ├── smoke/                # Preview UI bằng fixture, không cần Room/Socket
        └── components/
            ├── Header.jsx     # Đồng hồ Neon, YOUR TURN, Round badge & Nút Trọng Tài
            ├── BroadcastBoard.jsx     # [Ảnh 1] Bảng tổng quan 4 đội và 13 round đấu
            ├── RoomGateway.jsx        # Màn tạo/join/xem room
            ├── RoomLobby.jsx          # Lobby 4 đội, mã chia sẻ và Start gate
            ├── PlayerSearchPicker.jsx # [Ảnh 2] Tìm kiếm cầu thủ, xem thẻ và nút PICK
            ├── PlayerCard.jsx         # Thẻ FIFA Card lớn hiển thị OVR (đã cộng)
            └── RulesModal.jsx         # Modal hiển thị bảng luật giải đấu chi tiết
```

---

## 📜 Giấy Phép & Bản Quyền

Dự án phát triển phục vụ giải đấu giao hữu và cộng đồng FC Online Việt Nam.
Dữ liệu chỉ số cầu thủ được cung cấp thông qua API FIFAaddict.
