require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');

// Suppress Mongoose duplicate index warnings
const originalWarn = console.warn;
console.warn = function(...args) {
    const message = args.join(' ');
    if (message.includes('Duplicate schema index') || message.includes('MONGOOSE')) {
        return; // Suppress these warnings
    }
    originalWarn.apply(console, args);
};

// Import models
const Role = require('../app/models/Role');
const Taikhoan = require('../app/models/Taikhoan');
const LoaiDoAn = require('../app/models/LoaiDoAn');
const DoAn = require('../app/models/DoAn');
const MMOProduct = require('../app/models/MMOProduct');
const MMOOrder = require('../app/models/MMOOrder');
const Voucher = require('../app/models/Voucher');
const Wallet = require('../app/models/Wallet');
const WalletTransaction = require('../app/models/WalletTransaction');
const DonHang = require('../app/models/DonHang');
const GioHang = require('../app/models/GioHang');
const DanhGia = require('../app/models/DanhGia');

// Helper function to check if running inside Docker
function isRunningInDocker() {
    if (fs.existsSync('/.dockerenv')) {
        return true;
    }
    try {
        const cgroup = fs.readFileSync('/proc/self/cgroup', 'utf8');
        if (cgroup.includes('docker') || cgroup.includes('containerd')) {
            return true;
        }
    } catch (e) {
        // File doesn't exist, not in Docker
    }
    return false;
}

// MongoDB URI với auto-detect local development
let MONGODB_URI = process.env.MONGODB_URI;

// Nếu không có MONGODB_URI trong env
if (!MONGODB_URI) {
    // Auto-detect: nếu đang chạy trong Docker, dùng mongo hostname
    if (isRunningInDocker()) {
        MONGODB_URI = 'mongodb://admin:password@mongo:27017/academic-project-shop?authSource=admin';
    } else {
        // Chạy local: thử kết nối MongoDB Docker trước (nếu có)
        // Nếu không có, sẽ dùng localhost (cần MongoDB local đã cài)
        MONGODB_URI = 'mongodb://admin:password@localhost:27017/academic-project-shop?authSource=admin';
    }
} else {
    // Có MONGODB_URI trong env: auto-detect local và thay mongo -> localhost
    if (!isRunningInDocker() && MONGODB_URI.includes('mongo:')) {
        MONGODB_URI = MONGODB_URI.replace(/mongo:/g, 'localhost:');
        console.log('🔧 Auto-detected local development: replaced "mongo" with "localhost" in MongoDB URI');
    }
}

// Nếu không có MONGODB_URI trong env và đang chạy local, thử kết nối MongoDB Docker
if (!process.env.MONGODB_URI && !isRunningInDocker()) {
    // Thử kết nối MongoDB trong Docker nếu có
    const dockerMongoUri = 'mongodb://admin:password@localhost:27017/academic-project-shop?authSource=admin';
    MONGODB_URI = dockerMongoUri;
    console.log('🔧 Sử dụng MongoDB Docker (localhost:27017)');
}

/**
 * Seed database với dữ liệu mẫu
 */
async function seedDatabase() {
    try {
        console.log('🔄 Đang kết nối MongoDB...');
        const maskedUri = MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'); // Hide credentials
        console.log(`📡 MongoDB URI: ${maskedUri}`);
        
        const connectionOptions = {
            serverSelectionTimeoutMS: 10000, // 10 seconds timeout
            socketTimeoutMS: 45000,
        };
        
        try {
            await mongoose.connect(MONGODB_URI, connectionOptions);
            console.log('✅ Đã kết nối MongoDB');
        } catch (error) {
            if (error.name === 'MongooseServerSelectionError') {
                console.error('\n❌ Không thể kết nối MongoDB!');
                console.error('\n💡 Giải pháp:');
                console.error('   1. Khởi động MongoDB Docker: docker-compose up -d mongo');
                console.error('   2. Hoặc cài đặt MongoDB local và khởi động service');
                console.error('   3. Hoặc cập nhật MONGODB_URI trong file .env');
                console.error('\n📖 Xem hướng dẫn chi tiết: SEED_INSTRUCTIONS.md\n');
            }
            throw error;
        }

        // Clear existing data - Xóa tất cả collections
        console.log('\n🗑️  Đang xóa dữ liệu cũ...');
        
        // Lấy tất cả collections trong database
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        
        // Xóa tất cả collections (bao gồm cả các collections cũ như SanPham, LoaiSanPham, Heart)
        for (const collection of collections) {
            try {
                await db.collection(collection.name).deleteMany({});
                console.log(`   ✓ Đã xóa collection: ${collection.name}`);
            } catch (error) {
                console.warn(`   ⚠️  Không thể xóa collection ${collection.name}:`, error.message);
            }
        }
        
        // Xóa collections theo thứ tự để đảm bảo không có lỗi
        // (Một số collections có thể không tồn tại nữa nên bỏ qua lỗi)
        const collectionsToDelete = [
            'WalletTransaction', 'Wallet', 'MMOOrder', 'DonHang', 'GioHang', 
            'DanhGia', 'DoAn', 'MMOProduct', 'Voucher', 'LoaiDoAn', 
            'Taikhoan', 'Role', 'Chat', 'ChatRoom', 'ChatMessage',
            'DoAnFile', 'Download', 'Payments', 'Session', 'OAuthCode',
            // Collections cũ (có thể không tồn tại)
            'SanPham', 'LoaiSanPham', 'hearts'
        ];
        
        for (const collectionName of collectionsToDelete) {
            try {
                const collection = db.collection(collectionName);
                const count = await collection.countDocuments();
                if (count > 0) {
                    await collection.deleteMany({});
                    console.log(`   ✓ Đã xóa ${count} documents từ ${collectionName}`);
                }
            } catch (error) {
                // Bỏ qua nếu collection không tồn tại
                if (error.codeName !== 'NamespaceNotFound') {
                    console.warn(`   ⚠️  Lỗi khi xóa ${collectionName}:`, error.message);
                }
            }
        }
        
        console.log('✅ Đã xóa dữ liệu cũ');

        // ============================================
        // 1. SEED ROLES
        // ============================================
        console.log('\n📝 Đang tạo Roles...');
        const roles = await Role.insertMany([
            { TenVaiTro: 'Admin' },
            { TenVaiTro: 'Customer' },
            { TenVaiTro: 'Staff' }
        ]);
        console.log(`✅ Đã tạo ${roles.length} roles`);

        const adminRole = roles.find(r => r.TenVaiTro === 'Admin');
        const customerRole = roles.find(r => r.TenVaiTro === 'Customer');
        const staffRole = roles.find(r => r.TenVaiTro === 'Staff');

        // ============================================
        // 2. SEED USERS
        // ============================================
        console.log('\n👤 Đang tạo Users...');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        const users = await Taikhoan.insertMany([
            {
                TenDangNhap: 'admin',
                Email: 'admin@example.com',
                MatKhau: hashedPassword,
                HoTen: 'Quản Trị Viên',
                SoDienThoai: '0123456789',
                MaVaiTro: adminRole._id,
                TrangThai: 'active'
            },
            {
                TenDangNhap: 'customer1',
                Email: 'customer1@example.com',
                MatKhau: hashedPassword,
                HoTen: 'Nguyễn Văn A',
                SoDienThoai: '0987654321',
                MaVaiTro: customerRole._id,
                TrangThai: 'active'
            },
            {
                TenDangNhap: 'customer2',
                Email: 'customer2@example.com',
                MatKhau: hashedPassword,
                HoTen: 'Trần Thị B',
                SoDienThoai: '0912345678',
                MaVaiTro: customerRole._id,
                TrangThai: 'active'
            },
            {
                TenDangNhap: 'staff1',
                Email: 'staff1@example.com',
                MatKhau: hashedPassword,
                HoTen: 'Lê Văn C',
                SoDienThoai: '0923456789',
                MaVaiTro: staffRole._id,
                TrangThai: 'active'
            }
        ]);
        console.log(`✅ Đã tạo ${users.length} users`);

        const adminUser = users.find(u => u.TenDangNhap === 'admin');
        const customer1 = users.find(u => u.TenDangNhap === 'customer1');
        const customer2 = users.find(u => u.TenDangNhap === 'customer2');

        // ============================================
        // 3. SEED WALLETS
        // ============================================
        console.log('\n💰 Đang tạo Wallets...');
        // Sử dụng getOrCreate để tránh duplicate
        const wallet1 = await Wallet.getOrCreate(customer1._id);
        wallet1.SoDu = 5000000; // 5 triệu VNĐ
        wallet1.TrangThai = 'active';
        await wallet1.save();
        
        const wallet2 = await Wallet.getOrCreate(customer2._id);
        wallet2.SoDu = 2000000; // 2 triệu VNĐ
        wallet2.TrangThai = 'active';
        await wallet2.save();
        
        console.log(`✅ Đã tạo 2 wallets`);

        // ============================================
        // 4. SEED LOAI DO AN (Categories)
        // ============================================
        console.log('\n📁 Đang tạo Loại Đồ Án...');
        const categories = await LoaiDoAn.insertMany([
            {
                TenLoaiDoAn: 'Web Development',
                MoTa: 'Đồ án về phát triển web',
                Loai: 'subject',
                ThuTu: 1,
                TrangThai: 'active'
            },
            {
                TenLoaiDoAn: 'Mobile App',
                MoTa: 'Đồ án về phát triển ứng dụng di động',
                Loai: 'subject',
                ThuTu: 2,
                TrangThai: 'active'
            },
            {
                TenLoaiDoAn: 'AI/ML',
                MoTa: 'Đồ án về trí tuệ nhân tạo và machine learning',
                Loai: 'subject',
                ThuTu: 3,
                TrangThai: 'active'
            },
            {
                TenLoaiDoAn: 'Full-stack',
                MoTa: 'Đồ án full-stack development',
                Loai: 'subject',
                ThuTu: 4,
                TrangThai: 'active'
            },
            {
                TenLoaiDoAn: 'Đại học',
                MoTa: 'Cấp độ đại học',
                Loai: 'level',
                ThuTu: 1,
                TrangThai: 'active'
            },
            {
                TenLoaiDoAn: 'Thạc sĩ',
                MoTa: 'Cấp độ thạc sĩ',
                Loai: 'level',
                ThuTu: 2,
                TrangThai: 'active'
            },
            {
                TenLoaiDoAn: 'Source Code Full',
                MoTa: 'Bao gồm source code đầy đủ',
                Loai: 'format',
                ThuTu: 1,
                TrangThai: 'active'
            },
            {
                TenLoaiDoAn: 'Source Code Basic',
                MoTa: 'Source code cơ bản',
                Loai: 'format',
                ThuTu: 2,
                TrangThai: 'active'
            }
        ]);
        console.log(`✅ Đã tạo ${categories.length} categories`);

        const webDevCategory = categories.find(c => c.TenLoaiDoAn === 'Web Development');
        const mobileCategory = categories.find(c => c.TenLoaiDoAn === 'Mobile App');
        const aiCategory = categories.find(c => c.TenLoaiDoAn === 'AI/ML');
        const fullstackCategory = categories.find(c => c.TenLoaiDoAn === 'Full-stack');
        const daiHocLevel = categories.find(c => c.TenLoaiDoAn === 'Đại học');
        const thacSiLevel = categories.find(c => c.TenLoaiDoAn === 'Thạc sĩ');

        // ============================================
        // 5. SEED DO AN (Projects)
        // ============================================
        console.log('\n📦 Đang tạo Đồ Án...');
        const projects = await DoAn.insertMany([
            {
                TieuDe: 'Website Bán Hàng Online - E-commerce Platform',
                MaLoaiDoAn: webDevCategory._id,
                MonHoc: 'Web Development',
                CapDo: 'Đại học',
                Gia: 500000,
                KhuyenMai: 10,
                MoTa: 'Website bán hàng online đầy đủ tính năng với React, Node.js, MongoDB. Bao gồm quản lý sản phẩm, giỏ hàng, thanh toán, đơn hàng.',
                TinhNang: [
                    'Đăng nhập/Đăng ký',
                    'Quản lý sản phẩm',
                    'Giỏ hàng',
                    'Thanh toán VNPay',
                    'Quản lý đơn hàng',
                    'Đánh giá sản phẩm',
                    'Tìm kiếm và lọc',
                    'Admin dashboard'
                ],
                CongNghe: ['React', 'Node.js', 'Express', 'MongoDB', 'JWT', 'VNPay'],
                BaoGom: ['Source code đầy đủ', 'Database schema', 'Tài liệu hướng dẫn', 'API documentation'],
                HinhAnhChinh: 'https://via.placeholder.com/800x600/4F46E5/FFFFFF?text=E-commerce+Platform',
                AnhPreview: [
                    'https://via.placeholder.com/800x600/4F46E5/FFFFFF?text=E-commerce+Homepage',
                    'https://via.placeholder.com/800x600/10B981/FFFFFF?text=Product+Page',
                    'https://via.placeholder.com/800x600/F59E0B/FFFFFF?text=Cart+Page'
                ],
                LinkDemo: 'https://demo.example.com/ecommerce',
                DiemSo: '9.5',
                NamThucHien: 2024,
                Truong: 'Đại học Công nghệ',
                Tags: ['ecommerce', 'react', 'nodejs', 'mongodb', 'fullstack'],
                SoLuotTai: 25,
                DanhGia: 4.8,
                SoLuongDanhGia: 12,
                TrangThai: 'available',
                IsFeatured: true
            },
            {
                TieuDe: 'Ứng dụng Quản lý Nhà Hàng - Restaurant Management App',
                MaLoaiDoAn: mobileCategory._id,
                MonHoc: 'Mobile App',
                CapDo: 'Đại học',
                Gia: 600000,
                KhuyenMai: 0,
                MoTa: 'Ứng dụng quản lý nhà hàng trên nền tảng React Native. Quản lý bàn, món ăn, đơn hàng, thống kê doanh thu.',
                TinhNang: [
                    'Quản lý bàn',
                    'Quản lý menu',
                    'Đặt món',
                    'Thanh toán',
                    'Thống kê doanh thu',
                    'Quản lý nhân viên',
                    'Báo cáo'
                ],
                CongNghe: ['React Native', 'Node.js', 'MongoDB', 'Firebase'],
                BaoGom: ['Source code', 'APK file', 'Tài liệu', 'Database'],
                HinhAnhChinh: 'https://via.placeholder.com/800x600/EF4444/FFFFFF?text=Restaurant+App',
                AnhPreview: [
                    'https://via.placeholder.com/800x600/EF4444/FFFFFF?text=Restaurant+App'
                ],
                LinkDemo: 'https://demo.example.com/restaurant',
                DiemSo: '9.0',
                NamThucHien: 2024,
                Truong: 'Đại học Khoa học Tự nhiên',
                Tags: ['mobile', 'react-native', 'restaurant', 'management'],
                SoLuotTai: 15,
                DanhGia: 4.5,
                SoLuongDanhGia: 8,
                TrangThai: 'available',
                IsFeatured: true
            },
            {
                TieuDe: 'Hệ thống Nhận diện Khuôn mặt - Face Recognition System',
                MaLoaiDoAn: aiCategory._id,
                MonHoc: 'AI/ML',
                CapDo: 'Thạc sĩ',
                Gia: 1500000,
                KhuyenMai: 15,
                MoTa: 'Hệ thống nhận diện khuôn mặt sử dụng Deep Learning với TensorFlow và OpenCV. Ứng dụng trong bảo mật, điểm danh tự động.',
                TinhNang: [
                    'Nhận diện khuôn mặt real-time',
                    'Đăng ký khuôn mặt',
                    'Xác thực người dùng',
                    'Điểm danh tự động',
                    'Thống kê và báo cáo',
                    'API integration'
                ],
                CongNghe: ['Python', 'TensorFlow', 'OpenCV', 'Flask', 'PostgreSQL', 'Docker'],
                BaoGom: ['Source code Python', 'Model đã train', 'Tài liệu nghiên cứu', 'Dataset mẫu', 'API documentation'],
                HinhAnhChinh: 'https://via.placeholder.com/800x600/8B5CF6/FFFFFF?text=Face+Recognition',
                AnhPreview: [
                    'https://via.placeholder.com/800x600/8B5CF6/FFFFFF?text=Face+Recognition'
                ],
                LinkDemo: 'https://demo.example.com/face-recognition',
                DiemSo: '9.8',
                NamThucHien: 2024,
                Truong: 'Đại học Bách Khoa',
                Tags: ['ai', 'machine-learning', 'deep-learning', 'tensorflow', 'opencv'],
                SoLuotTai: 8,
                DanhGia: 5.0,
                SoLuongDanhGia: 5,
                TrangThai: 'available',
                IsFeatured: true
            },
            {
                TieuDe: 'Hệ thống Quản lý Thư viện - Library Management System',
                MaLoaiDoAn: fullstackCategory._id,
                MonHoc: 'Full-stack',
                CapDo: 'Đại học',
                Gia: 400000,
                KhuyenMai: 5,
                MoTa: 'Hệ thống quản lý thư viện full-stack với React frontend và Node.js backend. Quản lý sách, mượn trả, thành viên.',
                TinhNang: [
                    'Quản lý sách',
                    'Quản lý thành viên',
                    'Mượn/Trả sách',
                    'Tìm kiếm sách',
                    'Thống kê',
                    'Báo cáo',
                    'Admin panel'
                ],
                CongNghe: ['React', 'Node.js', 'Express', 'MongoDB', 'JWT'],
                BaoGom: ['Source code frontend', 'Source code backend', 'Database', 'Tài liệu'],
                HinhAnhChinh: 'https://via.placeholder.com/800x600/06B6D4/FFFFFF?text=Library+System',
                AnhPreview: [
                    'https://via.placeholder.com/800x600/06B6D4/FFFFFF?text=Library+System'
                ],
                LinkDemo: null,
                DiemSo: '8.5',
                NamThucHien: 2023,
                Truong: 'Đại học Sư phạm',
                Tags: ['library', 'management', 'fullstack', 'react', 'nodejs'],
                SoLuotTai: 30,
                DanhGia: 4.3,
                SoLuongDanhGia: 20,
                TrangThai: 'available',
                IsFeatured: false
            },
            {
                TieuDe: 'Website Tin tức - News Portal',
                MaLoaiDoAn: webDevCategory._id,
                MonHoc: 'Web Development',
                CapDo: 'Đại học',
                Gia: 350000,
                KhuyenMai: 0,
                MoTa: 'Website tin tức với hệ thống quản lý nội dung. Phân quyền admin, editor, user. Tích hợp comment, like, share.',
                TinhNang: [
                    'Đăng bài viết',
                    'Phân loại tin tức',
                    'Tìm kiếm',
                    'Comment system',
                    'Like/Share',
                    'Admin panel',
                    'Editor dashboard'
                ],
                CongNghe: ['Next.js', 'Node.js', 'MongoDB', 'Cloudinary'],
                BaoGom: ['Source code', 'Database', 'Tài liệu'],
                HinhAnhChinh: 'https://via.placeholder.com/800x600/EC4899/FFFFFF?text=News+Portal',
                AnhPreview: [
                    'https://via.placeholder.com/800x600/EC4899/FFFFFF?text=News+Portal'
                ],
                LinkDemo: 'https://demo.example.com/news',
                DiemSo: '8.0',
                NamThucHien: 2023,
                Truong: 'Đại học Khoa học Xã hội',
                Tags: ['news', 'cms', 'nextjs', 'blog'],
                SoLuotTai: 40,
                DanhGia: 4.2,
                SoLuongDanhGia: 25,
                TrangThai: 'available',
                IsFeatured: false
            }
        ]);
        console.log(`✅ Đã tạo ${projects.length} projects`);

        // ============================================
        // 6. SEED MMO PRODUCTS
        // ============================================
        console.log('\n🎮 Đang tạo MMO Products...');
        const mmoProducts = await MMOProduct.insertMany([
            {
                Ten: 'World of Warcraft Classic Gold - 10,000',
                Loai: 'gold',
                Game: 'World of Warcraft',
                Gia: 500000,
                SoLuong: 50,
                MoTa: 'World of Warcraft Classic Gold. Fast delivery within 5-30 minutes. Safe and secure transaction.',
                HinhAnh: 'https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=WoW+Gold',
                TrangThai: 'active',
                NguoiTao: adminUser._id
            },
            {
                Ten: 'Final Fantasy XIV Gil - 1,000,000',
                Loai: 'gold',
                Game: 'Final Fantasy XIV',
                Gia: 800000,
                SoLuong: 30,
                MoTa: 'Final Fantasy XIV Gil. Instant delivery. 100% safe and verified.',
                HinhAnh: 'https://via.placeholder.com/400x300/10B981/FFFFFF?text=FFXIV+Gil',
                TrangThai: 'active',
                NguoiTao: adminUser._id
            },
            {
                Ten: 'League of Legends Account - Level 30',
                Loai: 'accounts',
                Game: 'League of Legends',
                Gia: 2000000,
                SoLuong: 10,
                MoTa: 'League of Legends account level 30. Ranked ready. Email included.',
                HinhAnh: 'https://via.placeholder.com/400x300/F59E0B/FFFFFF?text=LoL+Account',
                TrangThai: 'active',
                NguoiTao: adminUser._id
            },
            {
                Ten: 'Valorant Points - 10,000 VP',
                Loai: 'items',
                Game: 'Valorant',
                Gia: 1200000,
                SoLuong: 20,
                MoTa: 'Valorant Points. Instant delivery. Safe transaction guaranteed.',
                HinhAnh: 'https://via.placeholder.com/400x300/EF4444/FFFFFF?text=Valorant+VP',
                TrangThai: 'active',
                NguoiTao: adminUser._id
            },
            {
                Ten: 'Genshin Impact Primogems - 6,480',
                Loai: 'items',
                Game: 'Genshin Impact',
                Gia: 1500000,
                SoLuong: 15,
                MoTa: 'Genshin Impact Primogems. Fast delivery. 100% safe.',
                HinhAnh: 'https://via.placeholder.com/400x300/8B5CF6/FFFFFF?text=Genshin+Primogems',
                TrangThai: 'active',
                NguoiTao: adminUser._id
            },
            {
                Ten: 'Power Leveling Service - WoW Classic 1-60',
                Loai: 'services',
                Game: 'World of Warcraft',
                Gia: 3000000,
                SoLuong: 5,
                MoTa: 'Professional power leveling service. Level 1-60 in 3-5 days. Safe and secure.',
                HinhAnh: 'https://via.placeholder.com/400x300/06B6D4/FFFFFF?text=Power+Leveling',
                TrangThai: 'active',
                NguoiTao: adminUser._id
            }
        ]);
        console.log(`✅ Đã tạo ${mmoProducts.length} MMO products`);

        // ============================================
        // 7. SEED VOUCHERS
        // ============================================
        console.log('\n🎟️  Đang tạo Vouchers...');
        const vouchers = await Voucher.insertMany([
            {
                MaVoucher: 'WELCOME10',
                NoiDung: 'Giảm 10% cho đơn hàng đầu tiên',
                GiaTri: 10,
                SoLuong: 100,
                NgayTao: new Date(),
                NgayHetHan: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 ngày
                TrangThai: 'active',
                GiaTriToiThieu: 100000
            },
            {
                MaVoucher: 'SAVE20',
                NoiDung: 'Giảm 20% cho đơn hàng từ 500,000 VNĐ',
                GiaTri: 20,
                SoLuong: 50,
                NgayTao: new Date(),
                NgayHetHan: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 ngày
                TrangThai: 'active',
                GiaTriToiThieu: 500000
            },
            {
                MaVoucher: 'MMO15',
                NoiDung: 'Giảm 15% cho đơn hàng MMO từ 200,000 VNĐ',
                GiaTri: 15, // 15% discount (thay vì 50,000 VNĐ cố định)
                SoLuong: 200,
                NgayTao: new Date(),
                NgayHetHan: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 ngày
                TrangThai: 'active',
                GiaTriToiThieu: 200000
            }
        ]);
        console.log(`✅ Đã tạo ${vouchers.length} vouchers`);

        console.log('\n✅ Seed database thành công!');
        console.log('\n📊 Tóm tắt:');
        console.log(`   - Roles: ${roles.length}`);
        console.log(`   - Users: ${users.length}`);
        console.log(`   - Wallets: 2`);
        console.log(`   - Categories: ${categories.length}`);
        console.log(`   - Projects: ${projects.length}`);
        console.log(`   - MMO Products: ${mmoProducts.length}`);
        console.log(`   - Vouchers: ${vouchers.length}`);
        console.log('\n🔑 Thông tin đăng nhập:');
        console.log('   Admin:');
        console.log('     - Username: admin');
        console.log('     - Password: admin123');
        console.log('   Customer:');
        console.log('     - Username: customer1 / customer2');
        console.log('     - Password: admin123');

        await mongoose.connection.close();
        console.log('\n✅ Đã đóng kết nối MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi khi seed database:', error);
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
        process.exit(1);
    }
}

// Chạy seed
if (require.main === module) {
    seedDatabase();
}

module.exports = { seedDatabase };
