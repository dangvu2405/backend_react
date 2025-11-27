const mongoose = require('mongoose');

const PaymentItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'SanPham' },
    quantity: { type: Number, default: 1 },
    price: { type: Number, default: 0 },
    name: { type: String },
    image: { type: String },
    selectedDungTich: {
      value: Number,
      label: String,
      priceDiff: Number,
      sku: String,
    },
  },
  { _id: false }
);

const PaymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Taikhoan', required: true },
    products: [{ type: mongoose.Schema.Types.Mixed }],
    totalPrice: { type: Number, default: 0 },
    finalPrice: { type: Number, default: 0 },
    fullName: String,
    phoneNumber: String,
    address: String,
    email: String,
    couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher' },
    paymentMethod: {
      type: String,
      enum: ['cod', 'vnpay', 'momo', 'bank', 'card'],
      default: 'cod',
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'paid', 'failed', 'canceled'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
    collection: 'Payments',
  }
);

module.exports = mongoose.model('Payment', PaymentSchema);


