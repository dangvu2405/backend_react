const express = require("express");
const crypto = require("crypto");
const moment = require("moment");
const qs = require("qs");
const QRCode = require("qrcode");
const { checkoutLimiter } = require('../app/middlewares/rateLimit.middleware');

const router = express.Router();

const pickEnv = (...keys) => {
    for (const key of keys) {
        const value = process.env[key];
        if (typeof value === "string" && value.trim()) {
            return value.trim();
        }
    }
    return "";
};

const VNP_TMNCODE = pickEnv("VNP_TMNCODE", "VNP_TMN_CODE", "VNPAY_TMN_CODE");
const VNP_HASHSECRET = pickEnv("VNP_HASHSECRET", "VNP_HASH_SECRET", "VNPAY_HASH_SECRET");
const VNP_URL = pickEnv("VNP_URL", "VNPAY_URL");
const DEFAULT_RETURN_URL = pickEnv("VNPAY_RETURN_URL", "VNP_RETURNURL", "VNP_RETURN_URL");
const DEFAULT_IPN_URL = pickEnv("VNPAY_IPN_URL", "VNP_IPNURL", "VNP_IPN_URL");

router.post("/vnpay/create-payment-url", checkoutLimiter, async (req, res) => {
    try {
        const configErrors = ensureConfig();
        if (configErrors.length) {
            return res.status(500).json({
                success: false,
                message: "Thiếu cấu hình VNPAY",
                errors: configErrors,
            });
        }

        const { orderId, amount, orderDescription, orderType, language, bankCode, returnUrl } =
            req.body || {};

        if (!orderId) {
            return res.status(400).json({ success: false, message: "Thiếu orderId" });
        }

        const numericAmount = Number(amount);
        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({ success: false, message: "Số tiền không hợp lệ" });
        }

        const clientIp = getClientIp(req);
        const normalizedReturnUrl = normalizeUrl(returnUrl || DEFAULT_RETURN_URL);

        const { params, txnRef, expireDate } = buildVNPayParams({
            orderId,
            amount: numericAmount,
            orderInfo: orderDescription,
            orderType,
            language,
            bankCode,
            returnUrl: normalizedReturnUrl,
            clientIp,
        });

        const signedParams = signVNPayParams(params);
        const paymentUrl = `${VNP_URL}?${qs.stringify(signedParams, {
            encode: true,
        })}`;

        return res.status(200).json({
            success: true,
            message: "Tạo link thanh toán VNPay thành công",
            data: {
                paymentUrl,
                txnRef,
                expireDate,
                params: signedParams,
            },
        });
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error("[VNPay][route] create-payment-url error:", error);
        }
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi tạo link thanh toán VNPay',
        });
    }
});

router.post("/vnpay/create-qr", checkoutLimiter, async (req, res) => {
    try {
        const configErrors = ensureConfig();
        if (configErrors.length) {
            return res.status(500).json({
                success: false,
                message: "Thiếu cấu hình VNPAY",
                errors: configErrors,
            });
        }

        const { orderId, amount, orderInfo, orderType, language, returnUrl } = req.body || {};

        if (!orderId || !amount) {
            return res.status(400).json({ success: false, message: "Thiếu orderId hoặc amount" });
        }

        const numericAmount = Number(amount);
        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({ success: false, message: "Số tiền không hợp lệ" });
        }

        const clientIp = getClientIp(req);
        const normalizedReturnUrl = normalizeUrl(returnUrl || DEFAULT_RETURN_URL);

        const { params, txnRef, expireDate } = buildVNPayParams({
            orderId,
            amount: numericAmount,
            orderInfo,
            orderType,
            language,
            bankCode: "VNPAYQR",
            returnUrl: normalizedReturnUrl,
            clientIp,
        });

        const signedParams = signVNPayParams(params);
        const paymentUrl = `${VNP_URL}?${qs.stringify(signedParams, {
            encode: true,
        })}`;
        const qrCode = await QRCode.toDataURL(paymentUrl);

        return res.status(200).json({
            success: true,
            message: "Tạo QR VNPay thành công",
            data: {
                paymentUrl,
                qrCode,
                txnRef,
                expireDate,
                params: signedParams,
            },
        });
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error("[VNPay][route] create-qr error:", error);
        }
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi tạo QR VNPay',
        });
    }
});

router.get("/vnpay/return", (req, res) => {
    try {
        const response = buildCallbackResponse(req.query || {});
        if (!response.isValidSignature) {
            return res.status(400).json({
                success: false,
                message: "Chữ ký VNPay không hợp lệ",
                data: response,
            });
        }

        return res.status(200).json({
            success: response.isSuccess,
            message: response.isSuccess ? "Thanh toán thành công" : "Thanh toán thất bại",
            data: response,
        });
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error("[VNPay][route] return error:", error);
        }
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi xử lý VNPay return',
        });
    }
});

router.get("/vnpay/ipn", (req, res) => {
    try {
        const response = buildCallbackResponse(req.query || {});
        if (!response.isValidSignature) {
            return res.status(400).json({
                RspCode: "97",
                Message: "Invalid signature",
            });
        }

        return res.status(200).json({
            RspCode: response.isSuccess ? "00" : "02",
            Message: response.isSuccess ? "Success" : "Failed",
            data: response,
        });
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error("[VNPay][route] ipn error:", error);
        }
        return res.status(500).json({
            RspCode: "99",
            Message: "Exception",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
});

function ensureConfig() {
    const errors = [];
    if (!VNP_TMNCODE) errors.push("Thiếu VNP_TMNCODE");
    if (!VNP_HASHSECRET) errors.push("Thiếu VNP_HASHSECRET");
    if (!VNP_URL) errors.push("Thiếu VNP_URL");
    return errors;
}

function getClientIp(req) {
    let ip =
        (req.headers["x-forwarded-for"] &&
            req.headers["x-forwarded-for"].split(",")[0].trim()) ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        (req.connection && req.connection.socket && req.connection.socket.remoteAddress) ||
        req.ip ||
        "127.0.0.1";

    if (ip === "::1" || ip === "::ffff:127.0.0.1") {
        ip = "127.0.0.1";
    }

    if (ip.includes(":")) {
        const ipv4 = ip.split(":").pop();
        if (ipv4 && ipv4.match(/^\d{1,3}(\.\d{1,3}){3}$/)) ip = ipv4;
        else ip = "127.0.0.1";
    }

    return ip;
    }

function normalizeUrl(url) {
    if (!url) return "";
    return url
        .toString()
        .trim()
        .replace(/\s+/g, "")
        .replace(/([^:]\/)\/+/g, "$1")
        .replace(/:\/{3,}/g, "://")
        .replace(/\/+$/, "");
}

function sanitizeOrderInfo(info, fallback = "") {
    const base =
        info ||
        fallback ||
        `Thanh toan don hang ${moment().format("YYYYMMDDHHmmss")}`;
    return base
        .toString()
        .replace(/[\r\n]+/g, " ")
        .replace(/[^0-9a-zA-ZÀ-ỹ\s\-,._]/g, "")
        .trim()
        .slice(0, 255);
}

function buildVNPayParams({
    orderId,
    amount,
    orderInfo,
    orderType,
    language,
    bankCode,
    returnUrl,
    clientIp,
}) {
    const now = moment();
    const txnRef = orderId.toString();
    const createDate = now.format("YYYYMMDDHHmmss");
    const expireDate = now.clone().add(15, "minutes").format("YYYYMMDDHHmmss");

    const params = {
        vnp_Version: "2.1.0",
        vnp_Command: "pay",
        vnp_TmnCode: VNP_TMNCODE,
        vnp_Locale: (language || "vn").toLowerCase(),
        vnp_CurrCode: "VND",
        vnp_TxnRef: txnRef,
        vnp_OrderInfo: sanitizeOrderInfo(orderInfo, orderId),
        vnp_OrderType: orderType || "other",
        vnp_Amount: Math.round(amount * 100),
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: clientIp,
        vnp_CreateDate: createDate,
        vnp_ExpireDate: expireDate,
    };

    if (bankCode) params.vnp_BankCode = bankCode;

    return { params, txnRef, expireDate };
}

function signVNPayParams(params) {
    const sorted = sortParams(params);
    const signData = qs.stringify(sorted, { encode: false });
    const secureHash = crypto
        .createHmac("sha512", VNP_HASHSECRET)
        .update(Buffer.from(signData, "utf-8"))
        .digest("hex");
    return {
        ...sorted,
        vnp_SecureHashType: "SHA512",
        vnp_SecureHash: secureHash,
    };
}

function sortParams(obj) {
    const sorted = {};
    Object.keys(obj)
        .sort()
        .forEach((key) => {
            sorted[key] = obj[key];
        });
    return sorted;
}

function buildCallbackResponse(query) {
    const data = { ...query };
    const secureHash = data.vnp_SecureHash;
    delete data.vnp_SecureHash;
    delete data.vnp_SecureHashType;

    const sorted = sortParams(data);
    const signData = qs.stringify(sorted, { encode: false });
    const calculatedHash = crypto
        .createHmac("sha512", VNP_HASHSECRET || "")
        .update(Buffer.from(signData, "utf-8"))
        .digest("hex");

    const isValidSignature =
        secureHash && calculatedHash && secureHash === calculatedHash;
    const responseCode = data.vnp_ResponseCode;

    return {
        rawData: query,
        data: sorted,
        secureHash,
        calculatedHash,
        isValidSignature,
        responseCode,
        isSuccess: isValidSignature && responseCode === "00",
    };
}

module.exports = router;

