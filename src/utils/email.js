const nodemailer = require('nodemailer');

/**
 * Create email transporter
 * @returns {Object} Nodemailer transporter
 */
const createTransporter = () => {
    return nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_PUBLIC,
            pass: process.env.PASS_PUBLIC,
        },
    });
};

/**
 * Send email
 * @param {String} to - Recipient email
 * @param {String} subject - Email subject
 * @param {String} html - Email HTML content
 * @returns {Promise} Email send result
 */
const sendEmail = async (to, subject, html) => {
    try {
        const transporter = createTransporter();
        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to,
            subject,
            html,
        };

        const result = await transporter.sendMail(mailOptions);
        return { success: true, result };
    } catch (error) {
        console.error('Email send error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send password reset email
 * @param {String} email - User email
 * @param {String} resetToken - Password reset token
 * @param {String} resetUrl - Reset password URL
 * @returns {Promise} Email send result
 */
const sendPasswordResetEmail = async (email, resetToken, resetUrl) => {
    const subject = 'Đặt lại mật khẩu';
    const html = `
        <h1>Yêu cầu đặt lại mật khẩu</h1>
        <p>Bạn đã yêu cầu đặt lại mật khẩu. Click vào link bên dưới để đặt lại mật khẩu:</p>
        <a href="${resetUrl}?token=${resetToken}">Đặt lại mật khẩu</a>
        <p>Link này sẽ hết hạn sau 1 giờ.</p>
        <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
    `;

    return await sendEmail(email, subject, html);
};

/**
 * Send welcome email
 * @param {String} email - User email
 * @param {String} username - Username
 * @returns {Promise} Email send result
 */
const sendWelcomeEmail = async (email, username) => {
    const subject = 'Chào mừng đến với Perfume Shop';
    const html = `
        <h1>Xin chào ${username}!</h1>
        <p>Cảm ơn bạn đã đăng ký tài khoản tại Perfume Shop.</p>
        <p>Chúc bạn có những trải nghiệm mua sắm tuyệt vời!</p>
    `;

    return await sendEmail(email, subject, html);
};

/**
 * Send order confirmation email
 * @param {String} email - Customer email
 * @param {Object} order - Order details
 * @returns {Promise} Email send result
 */
const sendOrderConfirmationEmail = async (email, order) => {
    const subject = `Xác nhận đơn hàng #${order.orderNumber}`;
    const html = `
        <h1>Đơn hàng của bạn đã được xác nhận</h1>
        <p>Mã đơn hàng: <strong>${order.orderNumber}</strong></p>
        <p>Tổng tiền: <strong>${order.totalAmount.toLocaleString('vi-VN')} VNĐ</strong></p>
        <p>Phương thức thanh toán: ${order.paymentMethod}</p>
        <p>Chúng tôi sẽ liên hệ với bạn sớm nhất để xác nhận và giao hàng.</p>
        <p>Cảm ơn bạn đã mua hàng!</p>
    `;

    return await sendEmail(email, subject, html);
};

/**
 * Send order cancellation email
 * @param {String} email - Customer email
 * @param {Object} order - Order details
 * @param {String} reason - Cancellation reason
 * @returns {Promise} Email send result
 */
const sendOrderCancellationEmail = async (email, order, reason = '') => {
    const orderNumber = order._id?.toString().slice(-8).toUpperCase() || order.orderNumber || 'N/A';
    const totalAmount = order.TongTien || order.totalAmount || 0;
    const paymentStatus = order.TrangThaiThanhToan || order.paymentStatus;
    const isPaid = paymentStatus === 'paid';
    
    const subject = `Đơn hàng #${orderNumber} đã được hủy`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #d32f2f;">Đơn hàng của bạn đã được hủy</h1>
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Mã đơn hàng:</strong> #${orderNumber}</p>
                <p><strong>Tổng tiền:</strong> ${totalAmount.toLocaleString('vi-VN')} VNĐ</p>
                ${reason ? `<p><strong>Lý do hủy:</strong> ${reason}</p>` : ''}
            </div>
            ${isPaid ? `
                <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                    <p style="margin: 0;"><strong>Lưu ý về hoàn tiền:</strong></p>
                    <p style="margin: 5px 0 0 0;">Số tiền đã thanh toán sẽ được hoàn trả vào tài khoản của bạn trong vòng 3-5 ngày làm việc.</p>
                </div>
            ` : ''}
            <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.</p>
            <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
        </div>
    `;

    return await sendEmail(email, subject, html);
};

module.exports = {
    sendEmail,
    sendPasswordResetEmail,
    sendWelcomeEmail,
    sendOrderConfirmationEmail,
    sendOrderCancellationEmail,
};

