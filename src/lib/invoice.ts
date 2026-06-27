'use client';

import jsPDF from 'jspdf';

interface InvoiceItem {
  name: string;
  qty: number;
  price: number;
}

interface InvoiceData {
  orderNumber: number;
  restaurantName: string;
  restaurantSlug: string;
  date: Date;
  items: InvoiceItem[];
  total: number;
  customerName?: string;
  tableName?: string;
  carNumber?: string;
}

/**
 * Generate and download a PDF invoice for an order.
 */
export function downloadInvoice(data: InvoiceData) {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();

  // Colors (Dokan dark theme)
  const bg = '#0f0e0c';
  const amber = '#f59e0b';
  const white = '#fafaf9';
  const gray = '#a8a29e';

  // ── Background ──
  doc.setFillColor(15, 14, 12);
  doc.rect(0, 0, pageW, doc.internal.pageSize.getHeight(), 'F');

  // ── Header ──
  doc.setTextColor(245, 158, 11);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Dokan', pageW / 2, 30, { align: 'center' });

  doc.setTextColor(250, 250, 249);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(data.restaurantName, pageW / 2, 42, { align: 'center' });

  // ── Divider ──
  doc.setDrawColor(42, 40, 37);
  doc.line(20, 50, pageW - 20, 50);

  // ── Invoice Info ──
  doc.setFontSize(10);
  doc.setTextColor(168, 162, 158);
  doc.setFont('helvetica', 'bold');
  const labels = [
    [`رقم الفاتورة: #${String(data.orderNumber).padStart(5, '0')}`, `التاريخ: ${data.date.toLocaleDateString('ar-BH')}`],
  ];
  if (data.tableName) labels.push([`طاولة: ${data.tableName}`, '']);
  if (data.carNumber) labels.push([`سيارة: #${data.carNumber}`, '']);
  if (data.customerName) labels.push([`العميل: ${data.customerName}`, '']);

  let y = 60;
  for (const [l, r] of labels) {
    doc.setTextColor(168, 162, 158);
    doc.text(l, 20, y);
    if (r) {
      doc.setTextColor(250, 250, 249);
      doc.text(r, pageW - 20, y, { align: 'right' });
    }
    y += 8;
  }

  // ── Table Header ──
  y += 8;
  doc.setFillColor(26, 25, 22);
  doc.rect(20, y - 5, pageW - 40, 10, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 158, 11);
  doc.text('الصنف', 25, y + 1);
  doc.text('الكمية', pageW / 2 - 10, y + 1);
  doc.text('السعر', pageW - 70, y + 1, { align: 'right' });
  doc.text('الإجمالي', pageW - 25, y + 1, { align: 'right' });

  // ── Items ──
  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(250, 250, 249);
  doc.setFontSize(9);

  for (const item of data.items) {
    if (y > 260) break; // page overflow
    doc.text(item.name, 25, y);
    doc.text(String(item.qty), pageW / 2 - 10, y, { align: 'center' });
    doc.text(`${item.price.toFixed(3)}`, pageW - 70, y, { align: 'right' });
    doc.text(`${(item.qty * item.price).toFixed(3)}`, pageW - 25, y, { align: 'right' });

    // subtle divider
    doc.setDrawColor(26, 25, 22);
    doc.line(20, y + 3, pageW - 20, y + 3);
    y += 10;
  }

  // ── Total ──
  y += 8;
  doc.setDrawColor(245, 158, 11);
  doc.line(20, y - 5, pageW - 20, y - 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(245, 158, 11);
  doc.text('الإجمالي:', pageW - 70, y + 5, { align: 'right' });
  doc.text(`${data.total.toFixed(3)} د.ب`, pageW - 25, y + 5, { align: 'right' });

  // ── Footer ──
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(87, 83, 78);
  doc.text(`Dokan · ${data.restaurantSlug}`, pageW / 2, doc.internal.pageSize.getHeight() - 15, { align: 'center' });
  doc.text('شكراً لزيارتك', pageW / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

  // ── Save ──
  doc.save(`invoice-${data.orderNumber}.pdf`);
}
