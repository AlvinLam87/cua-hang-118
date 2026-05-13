const sequelize = require('../config/database');
const Category = require('./Category');
const Service = require('./Service');
const Product = require('./Product');
const Customer = require('./Customer');
const RepairOrder = require('./RepairOrder');
const RepairStep = require('./RepairStep');
const Booking = require('./Booking');
const User = require('./User');

const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Review = require('./Review');
const Voucher = require('./Voucher');
const Supplier = require('./Supplier');
const StockMovement = require('./StockMovement');

// ─── Associations ────────────────────────────────────────────

// Category <-> Service (1:N)
Category.hasMany(Service, { foreignKey: 'category_id', as: 'services' });
Service.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

// Category <-> Product (1:N)
Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

// Category self-association (Parent-Child)
Category.hasMany(Category, { foreignKey: 'parent_id', as: 'children' });
Category.belongsTo(Category, { foreignKey: 'parent_id', as: 'parent' });

// Customer <-> RepairOrder (1:N)
Customer.hasMany(RepairOrder, { foreignKey: 'customer_id', as: 'repairOrders' });
RepairOrder.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

// RepairOrder <-> RepairStep (1:N)
RepairOrder.hasMany(RepairStep, { foreignKey: 'repair_order_id', as: 'steps' });
RepairStep.belongsTo(RepairOrder, { foreignKey: 'repair_order_id', as: 'repairOrder' });

// User <-> Order (1:N)
User.hasMany(Order, { foreignKey: 'customer_id', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'customer_id', as: 'customer' });

// Order <-> OrderItem (1:N)
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// Product <-> OrderItem (1:N)
Product.hasMany(OrderItem, { foreignKey: 'product_id', as: 'orderItems' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Booking <-> User (1:N - Khách mong muốn KTV nào)
User.hasMany(Booking, { foreignKey: 'preferred_technician_id', as: 'requested_bookings' });
Booking.belongsTo(User, { foreignKey: 'preferred_technician_id', as: 'preferredTechnician' });

// Product <-> Review (1:N)
Product.hasMany(Review, { foreignKey: 'product_id', as: 'reviews' });
Review.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// User <-> Review (1:N)
User.hasMany(Review, { foreignKey: 'user_id', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User <-> Voucher (1:N)
User.hasMany(Voucher, { foreignKey: 'user_id', as: 'vouchers' });
Voucher.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Product <-> StockMovement (1:N)
Product.hasMany(StockMovement, { foreignKey: 'product_id', as: 'movements' });
StockMovement.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Supplier <-> StockMovement (1:N)
Supplier.hasMany(StockMovement, { foreignKey: 'supplier_id', as: 'movements' });
StockMovement.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });

module.exports = {
  sequelize,
  Category,
  Service,
  Product,
  Customer,
  RepairOrder,
  RepairStep,
  Booking,
  User,
  Order,
  OrderItem,
  Review,
  Voucher,
  Supplier,
  StockMovement,
};
