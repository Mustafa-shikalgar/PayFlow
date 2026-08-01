const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Invoice = require('../models/Invoice');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const INVOICES_DIR = path.join(UPLOADS_DIR, 'invoices');

// Ensure directories exist
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(INVOICES_DIR)) fs.mkdirSync(INVOICES_DIR, { recursive: true });

/**
 * Generate a unique invoice number.
 */
const generateInvoiceNumber = async () => {
  const year = new Date().getFullYear();
  const count = await Invoice.countDocuments();
  const seq = String(count + 1).padStart(6, '0');
  return `INV-${year}-${seq}`;
};

/**
 * Generate an invoice PDF for a payment.
 * @param {Object} payment - Payment document (populated with user & order)
 * @returns {Promise<Object>} - { invoice, filePath }
 */
const generateInvoicePDF = async (payment) => {
  const invoiceNumber = await generateInvoiceNumber();
  const fileName = `${invoiceNumber}.pdf`;
  const filePath = path.join(INVOICES_DIR, fileName);

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  const user = payment.user;
  const order = payment.order;
  const amount = (payment.amount / 100).toFixed(2);
  const currency = payment.currency || 'INR';

  // Header
  doc.rect(0, 0, doc.page.width, 120).fill('#6366f1');
  doc.fill('#ffffff').fontSize(28).font('Helvetica-Bold').text('PayFlow', 50, 40);
  doc.fontSize(12).font('Helvetica').text('Payment Gateway', 50, 75);
  doc.fontSize(10).text('support@payflow.com | +91 00000 00000', 50, 95);

  // Invoice title
  doc.fill('#1f2937').fontSize(20).font('Helvetica-Bold').text('INVOICE', 50, 150);
  doc.fontSize(10).font('Helvetica').fill('#6b7280').text(`Invoice #: ${invoiceNumber}`, 50, 180);
  doc.text(`Date: ${new Date(payment.createdAt).toLocaleDateString()}`, 50, 195);
  doc.text(`Payment ID: ${payment.paymentId}`, 50, 210);

  // Bill To
  doc.fill('#1f2937').fontSize(12).font('Helvetica-Bold').text('BILL TO', 50, 250);
  doc.fontSize(10).font('Helvetica').fill('#4b5563');
  doc.text(user.name, 50, 270);
  doc.text(user.email, 50, 285);
  if (user.phone) doc.text(user.phone, 50, 300);

  // Order details
  doc.fill('#1f2937').fontSize(12).font('Helvetica-Bold').text('ORDER DETAILS', 350, 250);
  doc.fontSize(10).font('Helvetica').fill('#4b5563');
  doc.text(`Order ID: ${order.orderId}`, 350, 270);
  doc.text(`Razorpay Order: ${payment.razorpayOrderId}`, 350, 285);
  if (order.description) doc.text(`Description: ${order.description}`, 350, 300);

  // Table header
  const tableTop = 360;
  doc.rect(50, tableTop, 495, 25).fill('#f3f4f6');
  doc.fill('#374151').fontSize(10).font('Helvetica-Bold');
  doc.text('Description', 60, tableTop + 8);
  doc.text('Method', 250, tableTop + 8);
  doc.text('Status', 350, tableTop + 8);
  doc.text('Amount', 450, tableTop + 8, { width: 85, align: 'right' });

  // Table row
  const rowTop = tableTop + 25;
  doc.fill('#4b5563').fontSize(10).font('Helvetica');
  doc.text(order.description || 'Payment', 60, rowTop + 8);
  doc.text(payment.method, 250, rowTop + 8);
  doc.text(payment.status, 350, rowTop + 8);
  doc.text(`${currency} ${amount}`, 450, rowTop + 8, { width: 85, align: 'right' });

  // Divider
  doc.moveTo(50, rowTop + 40).lineTo(545, rowTop + 40).stroke('#e5e7eb');

  // Total
  const totalTop = rowTop + 55;
  doc.fill('#1f2937').fontSize(12).font('Helvetica-Bold').text('TOTAL', 400, totalTop);
  doc.text(`${currency} ${amount}`, 450, totalTop, { width: 85, align: 'right' });

  // Footer
  doc.fill('#9ca3af').fontSize(9).font('Helvetica').text(
    'Thank you for your business! This is a system-generated invoice.',
    50,
    doc.page.height - 100,
    { width: 495, align: 'center' }
  );
  doc.text('PayFlow • Payment Gateway', 50, doc.page.height - 80, { width: 495, align: 'center' });

  doc.end();

  // Wait for stream to finish
  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  // Create invoice record
  const invoice = await Invoice.create({
    invoiceNumber,
    payment: payment._id,
    user: payment.user._id,
    pdfUrl: `/uploads/invoices/${fileName}`,
    pdfPath: filePath,
    amount: payment.amount,
    currency,
  });

  return { invoice, filePath };
};

module.exports = { generateInvoicePDF, generateInvoiceNumber };