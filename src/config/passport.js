const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const TaiKhoan = require('../app/models/Taikhoan');
const jwt = require('jsonwebtoken');

// Google OAuth Strategy
const googleClientID = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const backendURL = process.env.BACKEND_URL || 'http://localhost:3001';
// Tự động tạo callback URL từ BACKEND_URL nếu không được set
const googleCallbackURL = process.env.GOOGLE_CALLBACK_URL || `${backendURL}/auth/google/callback`;

// Validate Google OAuth credentials
if (!googleClientID || googleClientID === 'your-google-client-id' || !googleClientSecret || googleClientSecret === 'your-google-client-secret') {
    console.warn('⚠️  WARNING: Google OAuth credentials not configured properly!');
    console.warn('   Please set the following variables in your .env file:');
    console.warn('   - GOOGLE_CLIENT_ID');
    console.warn('   - GOOGLE_CLIENT_SECRET');
    console.warn('   - BACKEND_URL (optional, defaults to http://localhost:3001)');
    console.warn('   - GOOGLE_CALLBACK_URL (optional, auto-generated from BACKEND_URL)');
    console.warn('   Get credentials from: https://console.cloud.google.com/apis/credentials');
    console.warn('   See GOOGLE_OAUTH_SETUP.md for detailed instructions');
} else {
    console.log('✅ Google OAuth configured');
    console.log('   Client ID:', googleClientID.substring(0, 20) + '...');
    console.log('   Callback URL:', googleCallbackURL);
    console.log('   Backend URL:', backendURL);
}

passport.use(new GoogleStrategy({
    clientID: googleClientID || 'your-google-client-id',
    clientSecret: googleClientSecret || 'your-google-client-secret',
    callbackURL: googleCallbackURL
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Chỉ log thông tin cần thiết để tối ưu performance
        if (process.env.NODE_ENV === 'development') {
            console.log('Google OAuth - User:', profile.displayName, `(${profile.emails?.[0]?.value || 'no email'})`);
        }
        
        // Lấy thông tin từ Google profile
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        const avatarUrl = profile.photos && profile.photos[0] ? profile.photos[0].value : null;
        const displayName = profile.displayName || 'Google User';
        
        // Tìm user theo Google ID hoặc email
        let user = await TaiKhoan.findOne({ 
            $or: [
                { 'google.id': profile.id },
                ...(email ? [{ 'Email': email.toLowerCase() }] : [])
            ]
        });

        if (user) {
            // Nếu user đã tồn tại, cập nhật thông tin Google
            let needsUpdate = false;
            
            // Cập nhật Google OAuth info nếu chưa có
            if (!user.google || !user.google.id) {
                user.google = {
                    id: profile.id,
                    accessToken: accessToken
                };
                needsUpdate = true;
            }
            
            // Cập nhật avatar từ Google nếu có và chưa có avatar
            if (avatarUrl && !user.AvatarUrl) {
                user.AvatarUrl = avatarUrl;
                needsUpdate = true;
            }
            
            // Cập nhật tên nếu chưa có hoặc là tên mặc định
            if (!user.HoTen || user.HoTen === 'Google User' || user.HoTen.startsWith('gg_')) {
                user.HoTen = displayName;
                needsUpdate = true;
            }
            
            if (needsUpdate) {
                await user.save();
            }
            
            return done(null, user);
        } else {
            // Lấy role Customer mặc định
            const Role = require('../app/models/Role');
            const customerRole = await Role.getCustomerRole();
            
            // Tạo user mới với đầy đủ thông tin từ Google
            const newUser = new TaiKhoan({
                TenDangNhap: `gg_${profile.id}`,
                Email: email || `gg_${profile.id}@google.com`,
                HoTen: displayName,
                TrangThai: 'active',
                MaVaiTro: customerRole ? customerRole._id : null,
                AvatarUrl: avatarUrl, // Lưu avatar từ Google
                google: {
                    id: profile.id,
                    accessToken: accessToken
                }
            });

            const createdUser = await newUser.save();
            return done(null, createdUser);
        }
    } catch (error) {
        console.error('Google OAuth error:', error);
        return done(error, null);
    }
}));

// Serialize user for session
passport.serializeUser((user, done) => {
    done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await TaiKhoan.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// Helper function to generate JWT token
const generateToken = (user) => {
    const payload = {
        id: user._id,
        username: user.TenDangNhap,
        email: user.Email,
        fullName: user.HoTen,
        role: user.VaiTro || 'customer',
        permissions: user.Quyen || []
    };

    return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key-change-in-production', {
        expiresIn: '7d'
    });
};

module.exports = {
    passport,
    generateToken
};
