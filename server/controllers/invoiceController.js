const fs = require('fs');
const path = require('path');
const Invoice = require('../models/Invoice');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Download an invoice PDF
 * @route   GET /api/invoices/:id
 * @access  Private
 */
const downloadInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id).populate('user', 'name email');

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  // Ensure invoice belongs to user or user is admin
  if (invoice.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('Not authorized to download this invoice', 403);
  }

  // Check if PDF file exists
  if (!invoice.pdfPath || !fs.existsSync(invoice.pdfPath)) {
    throw new AppError('Invoice PDF not found', 404);
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
  res.sendFile(path.resolve(invoice.pdfPath));
});

module.exports = { downloadInvoice };