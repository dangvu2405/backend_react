const mongoose = require('mongoose');
const GioHang = require('../models/GioHang');
const SanPham = require('../models/SanPham');
const { successResponse, errorResponse } = require('../../utils/response');
const { HTTP_STATUS, MESSAGES } = require('../../constants');

const resolveCartOwnerId = (req) => {
    return req.user?.id
        || req.headers['x-cart-owner']
        || req.headers['x-guest-id']
        || req.query?.userId
        || req.query?.guestId
        || req.cookies?.guestId
        || req.body?.userId
        || req.body?.guestId
        || null;
};

const normalizeVolumeInput = (input) => {
    if (input === null || input === undefined) {
        return null;
    }

    if (typeof input === 'number' || typeof input === 'string') {
        return { value: input };
    }

    if (typeof input === 'object') {
        return {
            value: input.value ?? input.Value ?? input.dungTich ?? input.DungTich,
            label: input.label ?? input.Label
        };
    }

    return null;
};

const resolveProductVolumeSelection = (product, rawInput) => {
    const normalizedOptions = SanPham.normalizeVolumeOptions(
        Array.isArray(product.DungTichOptions) ? product.DungTichOptions : [],
        product.DungTich
    );

    if (!normalizedOptions.length) {
        return { option: null, options: [], explicitRequest: Boolean(rawInput) };
    }

    const normalizedInput = normalizeVolumeInput(rawInput);
    if (!normalizedInput || (normalizedInput.value === undefined && !normalizedInput.label)) {
        const defaultOption = normalizedOptions.find(opt => opt.isDefault) || normalizedOptions[0];
        return { option: defaultOption, options: normalizedOptions, explicitRequest: false };
    }

    const candidateValue = normalizedInput.value;
    let selected = null;

    if (candidateValue !== undefined && candidateValue !== null && candidateValue !== '') {
        selected = normalizedOptions.find(opt => Number(opt.value) === Number(candidateValue));
    }

    if (!selected && normalizedInput.label) {
        const labelText = String(normalizedInput.label).toLowerCase();
        selected = normalizedOptions.find(opt => opt.label?.toLowerCase() === labelText);
    }

    return {
        option: selected || null,
        options: normalizedOptions,
        explicitRequest: true
    };
};

const formatSelectedVolumePayload = (option) => {
    if (!option) {
        return undefined;
    }

    return {
        value: option.value,
        label: option.label,
        priceDiff: Number(option.priceDiff) || 0,
        sku: option.sku || ''
    };
};

const computeVariantPrice = (product, selectedOption) => {
    const basePrice = Number(product.Gia) + Number(selectedOption?.priceDiff || 0);
    const discount = Number(product.KhuyenMai) || 0;
    const finalPrice = discount > 0 ? Math.round(basePrice * (1 - discount / 100)) : basePrice;

    return {
        basePrice,
        discount,
        finalPrice
    };
};

class GioHangController {
    async addToCart(req, res) {
        try {
            const ownerId = resolveCartOwnerId(req) || req.body?.userId;
            const { productId, quantity } = req.body;

            // ✅ Validate input
            if (!ownerId || !productId) {
                return errorResponse(res, 'Thiếu thông tin người dùng hoặc sản phẩm', HTTP_STATUS.BAD_REQUEST);
            }

            if (!mongoose.Types.ObjectId.isValid(productId)) {
                return errorResponse(res, 'ID sản phẩm không hợp lệ', HTTP_STATUS.BAD_REQUEST);
            }

            const qty = parseInt(quantity) || 1;
            if (qty <= 0 || !Number.isInteger(qty)) {
                return errorResponse(res, 'Số lượng phải là số nguyên dương', HTTP_STATUS.BAD_REQUEST);
            }

            // ✅ Kiểm tra sản phẩm tồn tại
            const product = await SanPham.findById(productId);
            if (!product) {
                return errorResponse(res, 'Sản phẩm không tồn tại', HTTP_STATUS.NOT_FOUND);
            }

            // ✅ Kiểm tra tồn kho
            if (!product.hasStock(qty)) {
                return errorResponse(
                    res,
                    `Sản phẩm "${product.TenSanPham}" chỉ còn ${product.SoLuong} sản phẩm`,
                    HTTP_STATUS.BAD_REQUEST
                );
            }

            const selectionInput = req.body.selectedDungTich || req.body.selectedVolume || req.body.volume;
            const { option: resolvedVolume, options: volumeOptions, explicitRequest } = resolveProductVolumeSelection(product, selectionInput);

            if (volumeOptions.length && explicitRequest && !resolvedVolume) {
                return errorResponse(res, 'Dung tích đã chọn không hợp lệ', HTTP_STATUS.BAD_REQUEST);
            }

            const { finalPrice } = computeVariantPrice(product, resolvedVolume);
            const selectedVolumePayload = formatSelectedVolumePayload(resolvedVolume);
            const selectedVolumeValue = resolvedVolume ? Number(resolvedVolume.value) : null;

            // ✅ Tìm hoặc tạo giỏ hàng
            let cart = await GioHang.findOne({ IdKhachHang: ownerId });
            
            if (!cart) {
                cart = await GioHang.create({
                    IdKhachHang: ownerId,
                    Items: []
                });
            }

            // ✅ Tìm item trong giỏ hàng
            const existingItemIndex = cart.Items.findIndex(item => {
                const sameProduct = item.IdSanPham?.toString() === productId;
                if (!sameProduct) return false;
                const itemVolumeValue = item.SelectedDungTich?.value !== undefined && item.SelectedDungTich?.value !== null
                    ? Number(item.SelectedDungTich.value)
                    : null;
                return itemVolumeValue === (selectedVolumeValue ?? null);
            });

            if (existingItemIndex >= 0) {
                // ✅ Cập nhật số lượng nếu đã có
                const newQuantity = cart.Items[existingItemIndex].SoLuong + qty;
                
                // Kiểm tra tồn kho lại
                if (!product.hasStock(newQuantity)) {
                    return errorResponse(
                        res,
                        `Số lượng vượt quá tồn kho. Hiện tại có ${product.SoLuong} sản phẩm`,
                        HTTP_STATUS.BAD_REQUEST
                    );
                }

                cart.Items[existingItemIndex].SoLuong = newQuantity;
                if (selectedVolumePayload) {
                    cart.Items[existingItemIndex].SelectedDungTich = selectedVolumePayload;
                }
                cart.Items[existingItemIndex].Gia = finalPrice;
                cart.Items[existingItemIndex].ThanhTien = finalPrice * newQuantity;
            } else {
                // ✅ Thêm item mới
                cart.Items.push({
                    IdSanPham: productId,
                    TenSanPham: product.TenSanPham,
                    Gia: finalPrice,
                    SoLuong: qty,
                    ThanhTien: finalPrice * qty,
                    SelectedDungTich: selectedVolumePayload
                });
            }

            await cart.save();

            // ✅ Populate và trả về
            const updatedCart = await GioHang.findById(cart._id)
                .populate('Items.IdSanPham', 'TenSanPham Gia KhuyenMai HinhAnhChinh MaLoaiSanPham DungTichOptions DungTich')
                .lean();

            return successResponse(res, { cart: updatedCart }, 'Đã thêm vào giỏ hàng', HTTP_STATUS.OK);
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Lỗi khi thêm vào giỏ hàng: ', error);
            }
            return errorResponse(res, 'Lỗi khi thêm vào giỏ hàng', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    // lấy giỏ hàng api
    async getCart(req, res) {
        try{
            const userId = resolveCartOwnerId(req);
            if (!userId) {
                return successResponse(res, { cart: { Items: [] } }, 'Đã lấy giỏ hàng (guest)', HTTP_STATUS.OK);
            }
            // Sử dụng model GioHang với IdKhachHang
            const cart = await GioHang.findOne({ IdKhachHang: userId })
                .populate('Items.IdSanPham', 'TenSanPham Gia KhuyenMai HinhAnhChinh MaLoaiSanPham DungTichOptions DungTich TrangThai')
                .lean();
            
            if (!cart) {
                // Trả về cart rỗng nếu chưa có
                return successResponse(res, { cart: { Items: [] } }, 'Đã lấy giỏ hàng', HTTP_STATUS.OK);
            }
            
            // ✅ Giá không cố định - cập nhật giá từ DB hiện tại
            // Lọc bỏ sản phẩm đã bị xóa và cập nhật giá
            const updatedItems = [];
            let needsUpdate = false;
            
            for (const item of cart.Items) {
                const product = item.IdSanPham;
                
                // Bỏ qua sản phẩm đã bị xóa hoặc không tồn tại
                if (!product || (product.TrangThai && product.TrangThai === 'deleted')) {
                    needsUpdate = true;
                    continue;
                }
                
                // Tính lại giá từ DB hiện tại
                const selectionInput = item.SelectedDungTich;
                const { option: resolvedVolume } = resolveProductVolumeSelection(product, selectionInput);
                const { finalPrice } = computeVariantPrice(product, resolvedVolume);
                
                // Nếu giá thay đổi, cập nhật
                if (item.Gia !== finalPrice || item.ThanhTien !== (finalPrice * item.SoLuong)) {
                    item.Gia = finalPrice;
                    item.ThanhTien = finalPrice * item.SoLuong;
                    needsUpdate = true;
                }
                
                updatedItems.push(item);
            }
            
            // Nếu có thay đổi, lưu lại
            if (needsUpdate) {
                const cartDoc = await GioHang.findById(cart._id);
                if (cartDoc) {
                    cartDoc.Items = updatedItems.map(item => ({
                        IdSanPham: item.IdSanPham._id || item.IdSanPham,
                        TenSanPham: item.TenSanPham,
                        Gia: item.Gia,
                        SoLuong: item.SoLuong,
                        ThanhTien: item.ThanhTien,
                        SelectedDungTich: item.SelectedDungTich
                    }));
                    await cartDoc.save();
                    
                    // Populate lại để trả về
                    const updatedCart = await GioHang.findById(cart._id)
                        .populate('Items.IdSanPham', 'TenSanPham Gia KhuyenMai HinhAnhChinh MaLoaiSanPham DungTichOptions DungTich TrangThai')
                        .lean();
                    return successResponse(res, { cart: updatedCart }, 'Đã lấy giỏ hàng (đã cập nhật giá)', HTTP_STATUS.OK);
                }
            }
            
            return successResponse(res, { cart: { ...cart, Items: updatedItems } }, 'Đã lấy giỏ hàng', HTTP_STATUS.OK);
        }
        catch(error){
            if (process.env.NODE_ENV === 'development') {
                console.error('Lỗi khi lấy giỏ hàng: ', error);
            }
            return errorResponse(res, 'Lỗi khi lấy giỏ hàng', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
    async updateCart(req, res) {
        try {
            const userId = resolveCartOwnerId(req);
            if (!userId) {
                return errorResponse(res, 'Không xác định được người dùng/khách', HTTP_STATUS.BAD_REQUEST);
            }

            // items là array các sản phẩm từ localStorage
            const { items } = req.body;
            
            if (!Array.isArray(items)) {
                return errorResponse(res, 'Dữ liệu giỏ hàng không hợp lệ', HTTP_STATUS.BAD_REQUEST);
            }

            // Sử dụng model GioHang với IdKhachHang và Items
            // Tìm hoặc tạo giỏ hàng
            let cart = await GioHang.findOne({ IdKhachHang: userId });
            
            if (!cart) {
                // Tạo giỏ hàng mới nếu chưa có
                cart = await GioHang.create({
                    IdKhachHang: userId,
                    Items: []
                });
            }

            // Map items từ localStorage format sang database format
            // Cần lấy thông tin sản phẩm từ database để có TenSanPham, Gia
            const mappedItems = [];
            
            for (const item of items) {
                try {
                    const productId = item.productId || item.IdSanPham || item.id;
                    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
                        return errorResponse(res, 'Sản phẩm trong giỏ hàng không hợp lệ', HTTP_STATUS.BAD_REQUEST);
                    }

                    // ✅ Luôn lấy giá hiện tại từ DB (không tin giá từ client)
                    const product = await SanPham.findOne({ 
                        _id: productId,
                        TrangThai: { $ne: 'deleted' } // Không lấy sản phẩm đã xóa
                    }).select('TenSanPham Gia KhuyenMai DungTichOptions DungTich TrangThai');
                    
                    if (!product) {
                        // Bỏ qua sản phẩm không tồn tại hoặc đã xóa
                        continue;
                    }
                    
                    const selectionInput = item.selectedDungTich || item.selectedVolume || item.volume;
                    const { option: resolvedVolume, options: volumeOptions, explicitRequest } = resolveProductVolumeSelection(product, selectionInput);

                    if (volumeOptions.length && explicitRequest && !resolvedVolume) {
                        return errorResponse(res, `Dung tích đã chọn cho sản phẩm ${product.TenSanPham} không hợp lệ`, HTTP_STATUS.BAD_REQUEST);
                    }

                    // ✅ Tính giá từ DB hiện tại
                    const finalGiaData = computeVariantPrice(product, resolvedVolume);
                    const finalGia = finalGiaData.finalPrice;
                        
                    const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);

                    mappedItems.push({
                        IdSanPham: product._id,
                        TenSanPham: product.TenSanPham || item.tenSP || 'Sản phẩm',
                        Gia: finalGia,
                        SoLuong: quantity,
                        ThanhTien: finalGia * quantity,
                        SelectedDungTich: formatSelectedVolumePayload(resolvedVolume)
                    });
                } catch (err) {
                    if (process.env.NODE_ENV === 'development') {
                        console.error(`Error processing product ${item.id}:`, err.message);
                    }
                    // Skip invalid products
                }
            }

            // Cập nhật toàn bộ giỏ hàng
            cart.Items = mappedItems;
            await cart.save();

            // Populate để trả về đầy đủ thông tin
            const updatedCart = await GioHang.findById(cart._id)
                .populate('Items.IdSanPham', 'TenSanPham Gia KhuyenMai HinhAnhChinh MaLoaiSanPham DungTichOptions DungTich')
                .lean();

            return successResponse(res, { cart: updatedCart }, 'Đã cập nhật giỏ hàng thành công', HTTP_STATUS.OK);
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Lỗi khi cập nhật giỏ hàng: ', error);
            }
            return errorResponse(res, 'Lỗi khi cập nhật giỏ hàng', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
    async deleteCart(req, res) {
        try {
            const userId = resolveCartOwnerId(req);
            if (!userId) {
                return errorResponse(res, 'Không xác định được người dùng/khách', HTTP_STATUS.BAD_REQUEST);
            }

            const { id } = req.params;
            if (!id || !mongoose.Types.ObjectId.isValid(id)) {
                return errorResponse(res, 'ID sản phẩm không hợp lệ', HTTP_STATUS.BAD_REQUEST);
            }

            // ✅ Tìm giỏ hàng
            const cart = await GioHang.findOne({ IdKhachHang: userId });
            if (!cart) {
                return errorResponse(res, 'Không tìm thấy giỏ hàng', HTTP_STATUS.NOT_FOUND);
            }

            // ✅ Xóa item khỏi mảng Items
            cart.Items = cart.Items.filter(
                item => item.IdSanPham?.toString() !== id
            );

            await cart.save();

            // ✅ Populate và trả về
            const updatedCart = await GioHang.findById(cart._id)
                .populate('Items.IdSanPham', 'TenSanPham Gia KhuyenMai HinhAnhChinh MaLoaiSanPham')
                .lean();

            return successResponse(res, { cart: updatedCart }, 'Đã xóa sản phẩm khỏi giỏ hàng', HTTP_STATUS.OK);
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Lỗi khi xóa giỏ hàng: ', error);
            }
            return errorResponse(res, 'Lỗi khi xóa giỏ hàng', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
    async deleteAllCart(req, res) {
        try {
            const userId = resolveCartOwnerId(req);
            if (!userId) {
                return errorResponse(res, 'Không xác định được người dùng/khách', HTTP_STATUS.BAD_REQUEST);
            }

            // ✅ Tìm và xóa toàn bộ giỏ hàng
            const cart = await GioHang.findOneAndDelete({ IdKhachHang: userId });
            
            if (!cart) {
                return errorResponse(res, 'Không tìm thấy giỏ hàng', HTTP_STATUS.NOT_FOUND);
            }

            return successResponse(res, { cart }, 'Đã xóa tất cả sản phẩm trong giỏ hàng', HTTP_STATUS.OK);
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Lỗi khi xóa tất cả sản phẩm trong giỏ hàng: ', error);
            }
            return errorResponse(res, 'Lỗi khi xóa giỏ hàng', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
}
module.exports = new GioHangController();