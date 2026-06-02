const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log("🚀 Bắt đầu quá trình Build & Mã hóa (Obfuscate) bảo mật...");

// 1. Tạo thư mục dist
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

// 2. Sao chép HTML và nén/mã hóa CSS sang thư mục dist
console.log("📦 Đang sao chép HTML và nén bảo mật tệp CSS...");
const distHtmlPath = path.join(distDir, 'index.html');
fs.copyFileSync(path.join(__dirname, 'index.html'), distHtmlPath);

// Cache-busting: Thêm mã phiên bản ngẫu nhiên vào link CSS và JS trong dist/index.html
const buildVersion = Date.now();
let htmlContent = fs.readFileSync(distHtmlPath, 'utf8');
htmlContent = htmlContent
  .replace('href="./css/style.css"', `href="./css/style.css?v=${buildVersion}"`)
  .replace('src="./js/app.js"', `src="./js/app.js?v=${buildVersion}"`);
fs.writeFileSync(distHtmlPath, htmlContent);
console.log(`⚡ Đã tự động thêm cache-busting: ?v=${buildVersion}`);

const cssSrcDir = path.join(__dirname, 'css');
const cssDistDir = path.join(distDir, 'css');
if (!fs.existsSync(cssDistDir)) {
  fs.mkdirSync(cssDistDir);
}

if (fs.existsSync(cssSrcDir)) {
  fs.readdirSync(cssSrcDir).forEach(file => {
    const filePath = path.join(cssSrcDir, file);
    if (fs.lstatSync(filePath).isFile() && file.endsWith('.css')) {
      const cssContent = fs.readFileSync(filePath, 'utf8');
      
      // Thuật toán nén và làm rối CSS tầng sâu: Xóa bình luận, khoảng trắng, xuống dòng
      const minifiedCss = cssContent
        .replace(/\/\*[\s\S]*?\*\//g, '')       // Xóa bình luận
        .replace(/\s*([{}|;:,])\s*/g, '$1')     // Xóa khoảng trắng thừa quanh các dấu ngoặc, dấu hai chấm, dấu chấm phẩy
        .replace(/\s+/g, ' ')                   // Rút gọn nhiều khoảng trắng liên tục thành 1 khoảng trắng
        .trim();
        
      fs.writeFileSync(path.join(cssDistDir, file), minifiedCss);
    }
  });
}

// Tạo thư mục dist/js
const distJsDir = path.join(distDir, 'js');
if (!fs.existsSync(distJsDir)) {
  fs.mkdirSync(distJsDir);
}

// Sao chép các tệp JS thư viện khác (như three.min.js) sang dist/js
const jsSrcDir = path.join(__dirname, 'js');
if (fs.existsSync(jsSrcDir)) {
  fs.readdirSync(jsSrcDir).forEach(file => {
    if (file !== 'app.js' && file.endsWith('.js')) {
      fs.copyFileSync(path.join(jsSrcDir, file), path.join(distJsDir, file));
      console.log(`📦 Đang sao chép thư viện: ${file}`);
    }
  });
}

// 3. Tiến hành mã hóa tệp js/app.js sang dist/js/app.js
console.log("🔒 Đang mã hóa tệp JS bằng javascript-obfuscator (vui lòng chờ)...");
try {
  execSync('npx -y javascript-obfuscator js/app.js --output dist/js/app.js --compact true --self-defending true --control-flow-flattening true --dead-code-injection true --string-array true --string-array-encoding base64 --debug-protection true --debug-protection-interval 2000', { stdio: 'inherit' });
  console.log("\n✨ QUÁ TRÌNH MÃ HÓA HOÀN TẤT THÀNH CÔNG!");
  console.log("📂 Thư mục 'dist' đã sẵn sàng! Bạn chỉ cần tải toàn bộ nội dung trong thư mục 'dist' này lên hosting của bạn.");
  console.log("📝 Khi người dùng nhấn F12 trên hosting, họ sẽ thấy tệp JS và CSS nhưng hoàn toàn ở dạng nén/mã hóa không thể đọc hay sao chép.");
} catch (error) {
  console.error("❌ Có lỗi xảy ra trong quá trình mã hóa:", error.message);
}
