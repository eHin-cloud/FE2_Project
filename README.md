# 🌌 Nguyễn Thanh Hiền | Trạm Không Gian Portfolio 3D & 2D

Chào mừng bạn đến với dự án Portfolio cá nhân của **Nguyễn Thanh Hiền** - Sinh viên ngành Công nghệ Thông tin tại Trường Cao đẳng Công nghệ Thủ Đức (TDC). Đây là một trang web giới thiệu bản thân, kỹ năng và dự án được thiết kế theo phong cách Trạm chỉ huy không gian (Space Station) kết hợp giữa chế độ 2D truyền thống mượt mà và chế độ 3D nhập vai tương tác cao.

---

## 🚀 Tính Năng Nổi Bật & Công Việc Đã Thực Hiện

### 1. 🎮 Chế Độ Không Gian 3D (Three.js Virtual Universe)
* **Vận hành phi thuyền**: Cho phép người dùng trực tiếp điều khiển chiến cơ trinh sát bay lơ lửng trong Hệ Mặt Trời ảo bằng phím `W, A, S, D` / Phím mũi tên, chuột hoặc Joystick ảo trên thiết bị di động.
* **Cơ chế tương tác trạm hành tinh**:
  * Tích hợp 6 trạm hành tinh chính xung quanh lõi mặt trời tương ứng với các chương mục: *Trái Đất (Hướng dẫn), Sao Kim (Giới thiệu), Sao Hỏa (Kỹ năng), Sao Mộc (Kinh nghiệm), Sao Thổ (Sản phẩm), Sao Thiên Vương (Đánh giá), Sao Hải Vương (Liên hệ)*.
  * Cải tiến cơ chế kết nối: Thay đổi chỉ dẫn từ việc tự động kết nối khi **"Đứng yên" (Stay Still)** sang hành động chủ động **"Nhấn vào" (Click)** trực tiếp lên hành tinh để mở cổng dữ liệu.
* **Khu vực đặc biệt Pluto (Sao Diêm Vương)**:
  * Được bảo vệ bởi lớp lá chắn năng lượng. Chỉ mở khóa khi phi hành gia hoàn thành việc kích hoạt kết nối thông tin của cả 6 hành tinh chính.
  * Tích hợp thẻ hồ sơ CV chuyên nghiệp của Nguyễn Thanh Hiền tại trạm Pluto.

### 2. 🤖 Trợ Lý Trí Tuệ Nhân Tạo (Cyber AI Assistant)
* **Chatbot nổi thông minh**: Tích hợp một chatbot AI hỗ trợ xuyên suốt cả 2 chế độ 2D và 3D.
* **Mô hình tri thức tùy biến**: AI được nạp đầy đủ cơ sở dữ liệu chuyên môn về kỹ năng (Laravel, PHP, Frontend, QA/QC, Mobile Flutter), lộ trình học tập, dự án (E-commerce, Điện Máy PRO) và thông tin cá nhân của Thanh Hiền.
* **Trải nghiệm đan xen**: Hỗ trợ kích hoạt nhanh thông qua nút nhấn *"Hỏi AI về CV"* trong trạm Pluto để trực tiếp đưa câu hỏi vào luồng chat.

### 3. 📄 Hồ Sơ Chuyên Môn & Tài Nguyên CV
* **Xem CV trực tuyến**: Thay thế hoàn toàn các nút In/Tải PDF phức tạp cũ bằng một nút bấm Gradient tối giản **XEM CV** (VIEW CV) dẫn trực tiếp đến tệp PDF chất lượng cao.
* **Đồng bộ hóa nội dung**: Viết lại phần tóm tắt hồ sơ chuyên môn ngắn gọn, làm nổi bật định hướng Web/Laravel Developer cùng kinh nghiệm thực chiến 3 dự án cốt lõi.

### 4. 📞 Biểu Mẫu Liên Hệ 2D & Mạng Xã Hội
* **Khôi phục Contact Form**: Đưa biểu mẫu liên hệ Web3Forms hoạt động bình thường trở lại tại giao diện 2D của phần `#contact`, đảm bảo tính năng kiểm thử đầu vào và truyền gửi dữ liệu trực tiếp về hòm thư cá nhân `thenghien2006@gmail.com`.
* **Tích hợp liên kết Zalo**:
  * Loại bỏ liên kết Douyin (TikTok Trung Quốc) cũ.
  * Cập nhật liên kết liên hệ **Zalo** chính thức qua số điện thoại `0396519196` (`https://zalo.me/0396519196`).
  * Nhúng mã vẽ Vector SVG logo Zalo nguyên bản sắc nét ở chân trang, căn chỉnh thẳng hàng (Flexbox) cùng các mạng xã hội khác (GitHub, Facebook, Email).

### 5. 🛠️ Tối Ưu Hóa Hệ Thống & Khắc Phục Lỗi (Bug Fixes)
* **Hiển thị chân trang (Footer)**: Khắc phục lỗi footer bị ẩn ở cuối trang do thư viện `scrollReveal` (gỡ bỏ selector `"footer"` khỏi danh sách reveal để đảm bảo hiển thị luôn ổn định).
* **Đồng bộ ngôn ngữ**: Việt hóa và Anh hóa toàn bộ nhãn điều hướng, thông báo HUD hiển thị và chỉ dẫn vận hành.
* **Loại bỏ thương hiệu dư thừa**: Gỡ bỏ nhãn chữ `"Vibe Coder"` ở thanh menu để hiển thị tinh gọn tên chủ sở hữu.
* **Tương thích API cục bộ**: Tối ưu hóa tệp API `api/gemini.php` cho phép bỏ qua xác thực chứng chỉ SSL khi nhà phát triển chạy thử nghiệm ở môi trường localhost.
* **Sửa âm thanh**: Cấu hình chuẩn xác mức âm lượng của súng bắn laser (`laser.mp3`) và vụ nổ phi thuyền khi va chạm hành tinh.

### 6. 📦 Quy Trình Build & Mã Hóa Bảo Mật
Dự án được cấu hình quy trình đóng gói tự động qua tệp `build.js`:
* **Xóa tệp dư thừa**: Tự động dọn sạch thư mục sản phẩm `dist/` cũ trước khi biên dịch mới.
* **Nén & Mã hóa bảo mật (Obfuscation)**: Nén mã nguồn CSS và mã hóa tệp Javascript (`js/app.js`) bằng `javascript-obfuscator` chống đánh cắp mã nguồn hoặc sao chép ý tưởng khi đưa lên môi trường mạng.
* **Chống lưu Cache trình duyệt (Cache Busting)**: Tự động đính kèm mã định danh phiên bản (`version.json` & query string) vào tài nguyên để người dùng luôn nhận được phiên bản mới nhất ngay khi tải lại trang mà không bị lỗi cache file cũ.

---

## 🛠️ Công Nghệ Sử Dụng

* **Core**: HTML5, Vanilla CSS3, Javascript (ES6+)
* **3D Engine**: Three.js (WebGL)
* **CSS Framework**: Tailwind CSS (nạp trực tiếp tối ưu)
* **Build tool**: Node.js & Javascript Obfuscator CLI
* **AI API**: Google Gemini API via PHP Proxy
* **Form Service**: Web3Forms API
* **Icons & Fonts**: FontAwesome 6, Google Fonts (Orbitron, Outfit, Share Tech Mono)

---

## 📂 Hướng Dẫn Chạy Cục Bộ & Đóng Gói

### 1. Chạy môi trường phát triển (Local Development)
Bạn chỉ cần mở tệp `index.html` thông qua một máy chủ local (ví dụ như extension **Live Server** trên VS Code) để chạy ứng dụng trực tiếp trên cổng `http://localhost`.

### 2. Đóng gói sản phẩm (Production Build)
Để nén, mã hóa và sinh mã cache-busting chuẩn bị đưa lên hosting:
```bash
# Cài đặt các thư viện cần thiết (nếu có)
npm install

# Chạy tệp build tự động
node build.js
```
Toàn bộ sản phẩm hoàn thiện sẽ được tạo ra tại thư mục `dist/`. Bạn chỉ cần upload toàn bộ thư mục `dist/` này lên hosting.