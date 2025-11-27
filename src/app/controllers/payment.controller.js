const cartModel = require('../models/GioHang');
const paymentModel = require('../models/payment.model');
const couponModel = require('../models/Voucher');

const { NotFoundError, BadRequestError } = require('../core/error.response');
const { Created, OK } = require('../core/success.response');

const { VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat } = require('vnpay');

const crypto = require('crypto');
const https = require('https');

function generatePayID() {
    const now = new Date();
    const timestamp = now.getTime();
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const milliseconds = now.getMilliseconds().toString().padStart(3, '0');
    return `PAY${timestamp}${seconds}${milliseconds}`;
}

const resolveUserId = (user) => {
    if (!user) return null;
    if (typeof user === 'string') return user;
    return user.id || user._id?.toString() || null;
};

const buildCartSummary = (cartDoc) => {
    if (!cartDoc) return null;

    const items = Array.isArray(cartDoc.Items) ? cartDoc.Items : [];
    const products = items.map((item) => ({
        productId: item.IdSanPham,
        name: item.TenSanPham,
        quantity: item.SoLuong,
        price: item.Gia,
        amount: item.ThanhTien,
        selectedDungTich: item.SelectedDungTich,
    }));

    const totalPrice = items.reduce((sum, item) => sum + (item.ThanhTien || 0), 0);
    const finalPrice = typeof cartDoc.FinalPrice === 'number' ? cartDoc.FinalPrice : totalPrice;

    return {
        products,
        totalPrice,
        finalPrice,
        fullName: cartDoc.ThongTinNhanHang?.HoTen || cartDoc.FullName,
        phoneNumber: cartDoc.ThongTinNhanHang?.SoDienThoai || cartDoc.PhoneNumber,
        address: cartDoc.ThongTinNhanHang?.DiaChiChiTiet || cartDoc.Address,
        email: cartDoc.ThongTinNhanHang?.Email || cartDoc.Email,
        couponId: cartDoc.couponId || cartDoc.AppliedVoucherId || cartDoc.MaVoucherId || null,
    };
};

const clearCartItems = async (cartDoc) => {
    if (!cartDoc) return;
    cartDoc.Items = [];
    await cartDoc.save();
};

const decrementCoupon = async (couponId) => {
    if (!couponId) return;
    try {
        await couponModel.findByIdAndUpdate(couponId, { $inc: { SoLuong: -1 } });
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('Coupon decrement failed:', error?.message);
        }
    }
};

class PaymentController {
    async createPayment(req, res) {
        const { typePayment } = req.body;
        const userId = resolveUserId(req.user);

        if (!userId) {
            throw new BadRequestError('Không xác định được người dùng');
        }

        const findCartUser = await cartModel.findOne({ IdKhachHang: userId });

        if (!findCartUser) {
            throw new NotFoundError('Giỏ hàng không tồn tại');
        }

        if (!findCartUser.Items || !findCartUser.Items.length) {
            throw new BadRequestError('Giỏ hàng không có sản phẩm');
        }

        const summary = buildCartSummary(findCartUser);

        if (typePayment === 'cod') {
            const newPayment = await paymentModel.create({
                userId,
                products: summary.products,
                totalPrice: summary.totalPrice,
                finalPrice: summary.finalPrice,
                fullName: summary.fullName,
                phoneNumber: summary.phoneNumber,
                address: summary.address,
                email: summary.email,
                couponId: summary.couponId,
                paymentMethod: 'cod',
                status: 'pending',
            });

            await clearCartItems(findCartUser);
            await decrementCoupon(summary.couponId);

            return new Created({
                message: 'Tạo đơn hàng thành công',
                metadata: newPayment,
            }).send(res);
        } else if (typePayment === 'vnpay') {
            const vnpay = new VNPay({
                tmnCode: 'O9OKST2M',
                secureSecret: 'TN3JE2BE55MWGE2J3T0O35H7EHSWA484',
                vnpayHost: 'https://sandbox.vnpayment.vn',
                testMode: true, // tùy chọn
                hashAlgorithm: 'SHA512', // tùy chọn
                loggerFn: ignoreLogger, // tùy chọn
            });

            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const vnpayResponse = vnpay.buildPaymentUrl({
                vnp_Amount: Number(summary.finalPrice),
                vnp_IpAddr: '127.0.0.1', //
                vnp_TxnRef: `${userId} + ${generatePayID()}`,
                vnp_OrderInfo: `Thanh toan don hang ${userId}`,
                vnp_OrderType: ProductCode.Other,
                vnp_ReturnUrl: `${process.env.BACKEND_URL}/payment/vnpay-callback`,
                vnp_Locale: VnpLocale.VN,
                vnp_CreateDate: dateFormat(new Date()),
                vnp_ExpireDate: dateFormat(tomorrow),
            });

            return new Created({
                message: 'Tạo đơn hàng thành công',
                metadata: vnpayResponse,
            }).send(res);
        } else if (typePayment === 'momo') {
            const accessKey = 'F8BBA842ECF85';
            const secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
            const partnerCode = 'MOMO';
            const orderId = partnerCode + new Date().getTime();
            const requestId = orderId;
                const orderInfo = `Thanh toan don hang ${userId}`;
            const redirectUrl = `${process.env.BACKEND_URL}/payment/momo-callback`;
            const ipnUrl = `${process.env.BACKEND_URL}/payment/momo-callback`;
            const requestType = 'payWithMethod';
                const amount = Number(summary.finalPrice);
            const extraData = '';

            const rawSignature =
                'accessKey=' +
                accessKey +
                '&amount=' +
                amount +
                '&extraData=' +
                extraData +
                '&ipnUrl=' +
                ipnUrl +
                '&orderId=' +
                orderId +
                '&orderInfo=' +
                orderInfo +
                '&partnerCode=' +
                partnerCode +
                '&redirectUrl=' +
                redirectUrl +
                '&requestId=' +
                requestId +
                '&requestType=' +
                requestType;

            const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

            const requestBody = JSON.stringify({
                partnerCode,
                partnerName: 'Test',
                storeId: 'MomoTestStore',
                requestId,
                amount,
                orderId,
                orderInfo,
                redirectUrl,
                ipnUrl,
                lang: 'vi',
                requestType,
                autoCapture: true,
                extraData,
                orderGroupId: '',
                signature,
            });

            const options = {
                hostname: 'test-payment.momo.vn',
                port: 443,
                path: '/v2/gateway/api/create',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(requestBody),
                },
            };

            const req1 = https.request(options, (res1) => {
                let data = '';
                res1.on('data', (chunk) => {
                    data += chunk;
                });
                res1.on('end', () => {
                    try {
                        return new Created({
                            message: 'Tạo đơn hàng thành công',
                            metadata: JSON.parse(data),
                        }).send(res);
                    } catch (err) {
                        console.log(err);
                    }
                });
            });

            req1.on('error', (e) => console.log(e));
            req1.write(requestBody);
            req1.end();
        }
    }

    async vnpayCallback(req, res) {
        const { vnp_ResponseCode, vnp_OrderInfo, vnp_ResponseMessage } = req.query;
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';

        if (vnp_ResponseCode !== '00') {
            const errorMessage = vnp_ResponseMessage || 'Thanh toán thất bại';
            const redirectUrl = `${frontendUrl}/payment-fail?method=vnpay&code=${vnp_ResponseCode || 'unknown'}&message=${encodeURIComponent(errorMessage)}`;
            return res.redirect(redirectUrl);
        }

        if (!vnp_OrderInfo) {
            const redirectUrl = `${frontendUrl}/payment-fail?method=vnpay&message=${encodeURIComponent('Không tìm thấy thông tin đơn hàng')}`;
            return res.redirect(redirectUrl);
        }

        const userId = vnp_OrderInfo.split(' ')[4];
        if (!userId) {
            const redirectUrl = `${frontendUrl}/payment-fail?method=vnpay&message=${encodeURIComponent('Không xác định được người dùng')}`;
            return res.redirect(redirectUrl);
        }

        const findCartUser = await cartModel.findOne({ IdKhachHang: userId });
        if (!findCartUser) {
            const redirectUrl = `${frontendUrl}/payment-fail?method=vnpay&message=${encodeURIComponent('Giỏ hàng không tồn tại')}`;
            return res.redirect(redirectUrl);
        }

        const summary = buildCartSummary(findCartUser);
        const newPayment = await paymentModel.create({
            userId,
            products: summary.products,
            totalPrice: summary.totalPrice,
            finalPrice: summary.finalPrice,
            fullName: summary.fullName,
            phoneNumber: summary.phoneNumber,
            address: summary.address,
            email: summary.email,
            couponId: summary.couponId,
            paymentMethod: 'vnpay',
            status: 'pending',
        });

        await clearCartItems(findCartUser);
        await decrementCoupon(summary.couponId);

        const redirectUrl = `${frontendUrl}/payment-success?method=vnpay&orderId=${newPayment._id.toString()}`;
        return res.redirect(redirectUrl);
    }

    async momoCallback(req, res) {
        const { resultCode, orderInfo, message } = req.query;
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';

        if (resultCode !== '0') {
            const errorMessage = message || 'Thanh toán thất bại';
            const redirectUrl = `${frontendUrl}/payment-fail?method=momo&code=${resultCode || 'unknown'}&message=${encodeURIComponent(errorMessage)}`;
            return res.redirect(redirectUrl);
        }

        if (!orderInfo) {
            const redirectUrl = `${frontendUrl}/payment-fail?method=momo&message=${encodeURIComponent('Không tìm thấy thông tin đơn hàng')}`;
            return res.redirect(redirectUrl);
        }

        const userId = orderInfo.split(' ')[4];
        if (!userId) {
            const redirectUrl = `${frontendUrl}/payment-fail?method=momo&message=${encodeURIComponent('Không xác định được người dùng')}`;
            return res.redirect(redirectUrl);
        }

        const findCartUser = await cartModel.findOne({ IdKhachHang: userId });
        if (!findCartUser) {
            const redirectUrl = `${frontendUrl}/payment-fail?method=momo&message=${encodeURIComponent('Giỏ hàng không tồn tại')}`;
            return res.redirect(redirectUrl);
        }

        const summary = buildCartSummary(findCartUser);
        const newPayment = await paymentModel.create({
            userId,
            products: summary.products,
            totalPrice: summary.totalPrice,
            finalPrice: summary.finalPrice,
            fullName: summary.fullName,
            phoneNumber: summary.phoneNumber,
            address: summary.address,
            email: summary.email,
            couponId: summary.couponId,
            paymentMethod: 'momo',
            status: 'pending',
        });

        await clearCartItems(findCartUser);
        await decrementCoupon(summary.couponId);

        const redirectUrl = `${frontendUrl}/payment-success?method=momo&orderId=${newPayment._id.toString()}`;
        return res.redirect(redirectUrl);
    }

    async getPaymentsAdmin(req, res) {
        const dataPayment = await paymentModel
            .find({})
            .populate('userId', 'fullName email')
            .populate('products.productId', '')
            .populate('couponId');
        return new OK({
            message: 'Lấy danh sách đơn hàng thành công',
            metadata: dataPayment,
        }).send(res);
    }

    async updatePayment(req, res) {
        const { orderId } = req.params;
        const { status } = req.body;
        if (!orderId || !status) {
            throw new BadRequestError('Bạn đang thiếu thông tin');
        }

        const findPayment = await paymentModel.findById(orderId);
        if (!findPayment) {
            throw new NotFoundError('Đơn hàng không tồn tại');
        }

        findPayment.status = status;
        await findPayment.save();
        return new OK({
            message: 'Cập nhật đơn hàng thành công',
            metadata: findPayment,
        }).send(res);
    }
}

module.exports = new PaymentController();
