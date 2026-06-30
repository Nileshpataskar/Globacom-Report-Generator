import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

const BLUE = '#154360';

// Format currency amounts to 2dp
function fmt2(value) {
  const n = parseFloat(value);
  if (value === null || value === undefined || isNaN(n)) return '';
  return n.toFixed(2);
}

// Show raw value from API as-is (preserves "(E)", "0.00000" etc.)
function raw(value) {
  if (value === null || value === undefined || value === '') return '';
  return String(value);
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const S = {
  wrap: { fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '13px', color: '#222', margin: '20px' },
  toolbar: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '16px' },
  btn: {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '7px 16px', border: '1px solid #444', borderRadius: '4px',
    background: '#fff', fontSize: '13px', fontFamily: 'Arial, Helvetica, sans-serif', cursor: 'pointer',
  },
  box: { border: '1px solid #666', padding: '20px', marginBottom: '20px', boxSizing: 'border-box' },
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' },
  companyName: { fontSize: '14px', fontWeight: 'bold', color: BLUE },
  companyAddr: { fontSize: '11px', color: BLUE, marginTop: '4px', lineHeight: 1.5 },
  titleCenter: { flex: 1, textAlign: 'center' },
  titleEn: { fontSize: '22px', fontWeight: 'bold', color: BLUE },
  titleAr: { fontSize: '15px', color: BLUE, direction: 'rtl' },
  logoWrap: { width: '130px', textAlign: 'right' },
  infoRow: { display: 'flex', gap: '16px', marginBottom: '18px' },
  infoTable: { flex: 1, width: '100%', borderCollapse: 'collapse' },
  iTd: { border: '1px solid #aaa', padding: '5px 8px', fontSize: '12px', verticalAlign: 'top' },
  iLabel: { color: BLUE, fontWeight: 'bold', width: '42%', whiteSpace: 'nowrap' },
  iAr: { fontSize: '10px', color: BLUE, direction: 'rtl', marginTop: '2px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    border: '1px solid #000', padding: '6px 4px', fontSize: '11px',
    textAlign: 'center', fontWeight: 'bold', background: '#fff', verticalAlign: 'top',
  },
  td: { border: '1px solid #000', padding: '6px 5px', fontSize: '12px', verticalAlign: 'middle' },
  tdR: { border: '1px solid #000', padding: '6px 5px', fontSize: '12px', textAlign: 'right', verticalAlign: 'middle' },
  arSub: { direction: 'rtl', fontSize: '10px', color: '#555', marginTop: '2px' },
  sumTd: { border: '1px solid #000', padding: '6px 5px', fontSize: '12px', fontWeight: 'bold', verticalAlign: 'middle' },
  sumTdR: { border: '1px solid #000', padding: '6px 5px', fontSize: '12px', fontWeight: 'bold', textAlign: 'right', verticalAlign: 'middle' },
  footer: { display: 'flex', justifyContent: 'space-between', gap: '24px', marginTop: '14px', fontSize: '11px' },
};

const S2 = {
  box: { border: '1px solid #666', padding: '20px', marginBottom: '20px', fontFamily: 'Arial, Helvetica, sans-serif' },
  twoCol: { display: 'flex', gap: '40px', marginBottom: '20px' },
  col: { flex: 1 },
  secTitle: { fontSize: '13px', fontWeight: 'bold', color: BLUE, marginBottom: '8px' },
  secTitleAr: { fontSize: '11px', color: BLUE, direction: 'rtl', marginBottom: '8px' },
  bankRow: { display: 'flex', gap: '12px', marginBottom: '6px', fontSize: '12px' },
  bankLabel: { width: '140px', color: '#333' },
  bankVal: { color: '#111' },
  emailLink: { display: 'block', color: BLUE, fontSize: '12px', marginBottom: '5px', textDecoration: 'underline' },
  bullet: { display: 'flex', gap: '8px', marginBottom: '8px', fontSize: '12px', alignItems: 'flex-start' },
};

export default function TaxInvoice({ header = {}, details = [], logoUrl = '/output.png' }) {
  const [status, setStatus] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [xlLoading, setXlLoading] = useState(false);

  const reportRef = useRef(null);

  // Header response shape: { data: {...}, labels: {} }
  const d = header.data || {};

  // Totals and balances live in each detail row (same value on every row)
  const s = details[0] || {};
  const sumTaxable    = s.SumTaxableAmount ?? 0;
  const sumVAT        = s.SumVAT ?? 0;
  const sumTotal      = s.SumTotalAmount ?? 0;
  const prevBalance   = s.PreviousBalance ?? 0;
  const adjAmount     = s.AdjustmentAmount ?? 0;
  const advPayment    = s.AdvancePayment ?? 0;
  const totalPayable  = s.TotalAmountPayableWithinDueDate ?? 0;

  // ── PDF Export — renders the HTML directly so Arabic shows correctly ─────────
  async function exportPDF() {
    if (!reportRef.current) return;
    setPdfLoading(true);
    setStatus('');
    try {
      const el = reportRef.current;
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#fff' });
      const imgData = canvas.toDataURL('image/png');

      const pdfW = 210; // A4 width mm
      const pdfH = (canvas.height * pdfW) / canvas.width;
      const pageH = 297; // A4 height mm

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      let yOffset = 0;
      while (yOffset < pdfH) {
        if (yOffset > 0) doc.addPage();
        doc.addImage(imgData, 'PNG', 0, -yOffset, pdfW, pdfH);
        yOffset += pageH;
      }

      doc.save(`${d.AccountNumber || 'tax_invoice'}_Tax_Invoice.pdf`);
      setStatus('✓ PDF downloaded.');
    } catch (e) {
      console.error(e);
      setStatus('PDF export failed.');
    } finally {
      setPdfLoading(false);
    }
  }

  // ── Excel Export ─────────────────────────────────────────────────────────────
  function exportExcel() {
    setXlLoading(true);
    setStatus('');
    try {
      const wb = XLSX.utils.book_new();
      const meta = [
        ['TAX INVOICE'],
        [],
        ['Name:', d.ConsumerName || ''],
        ['Unit No.:', d.UnitNo || ''],
        ['Tower Name:', d.BuildingName || ''],
        ['Invoice Number:', d.InvoiceNumber || ''],
        ['Account Number:', d.AccountNumber || ''],
        ['Billing Date:', d.BillingDate || ''],
        ['Due Date:', d.DueDate || ''],
        ['Billing Period:', d.BillingPeriod || ''],
        [],
      ];
      const hdr = ['Description', 'Prev Reading (kWh)', 'Curr Reading (kWh)', 'Qty (kWh)', 'Rate (AED)', 'Taxable Amount (AED)', 'VAT (AED)', 'Total Amount (AED)'];
      const rows = details.map(r => [
        r.Description || '',
        raw(r.PrevReading),
        raw(r.CurrReading),
        raw(r.Qty),
        fmt2(r.Rate),
        fmt2(r.TaxableAmount),
        fmt2(r.VAT),
        fmt2(r.TotalAmount),
      ]);
      const ws = XLSX.utils.aoa_to_sheet([
        ...meta,
        hdr,
        ...rows,
        ['TOTAL', '', '', '', '', parseFloat(sumTaxable.toFixed(2)), parseFloat(sumVAT.toFixed(2)), parseFloat(sumTotal.toFixed(2))],
        ['Previous Balance', '', '', '', '', '', '', prevBalance],
        ['Adjustment Amount', '', '', '', '', '', '', adjAmount],
        ['Advance Payment', '', '', '', '', '', '', advPayment],
        ['Total Amount Payable Within Due Date', '', '', '', '', '', '', totalPayable],
      ]);
      ws['!cols'] = [{ wch: 40 }, { wch: 20 }, { wch: 20 }, { wch: 12 }, { wch: 14 }, { wch: 22 }, { wch: 14 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Tax Invoice');
      XLSX.writeFile(wb, `${d.AccountNumber || 'tax_invoice'}_Tax_Invoice.xlsx`);
      setStatus('✓ Excel downloaded.');
    } catch (e) {
      console.error(e);
      setStatus('Excel export failed.');
    } finally {
      setXlLoading(false);
    }
  }

  return (
    <div style={S.wrap}>
      {/* Toolbar */}
      <div style={S.toolbar}>
        <button style={S.btn} onClick={exportExcel} disabled={xlLoading}>
          ⬇ {xlLoading ? 'Exporting…' : 'Export Excel'}
        </button>
        <button style={S.btn} onClick={exportPDF} disabled={pdfLoading}>
          ⬇ {pdfLoading ? 'Exporting…' : 'Export PDF'}
        </button>
      </div>

      {/* ══ REPORT (captured for PDF) ══ */}
      <div ref={reportRef}>

      {/* ══ PAGE 1 ══ */}
      <div style={S.box}>

        {/* Top: Company | TAX INVOICE | Logo */}
        <div style={S.topRow}>
          <div>
            <div style={S.companyName}>LYNX District Cooling Services</div>
            {d.OperatingCompanyAddress && (
              <div style={S.companyAddr}>{d.OperatingCompanyAddress}</div>
            )}
          </div>
          <div style={S.titleCenter}>
            <div style={S.titleEn}>TAX INVOICE</div>
            <div style={S.titleAr}>فاتورة ضريبية</div>
          </div>
          <div style={S.logoWrap}>
            <img src={logoUrl} alt="Logo" style={{ maxWidth: '100%', maxHeight: '64px' }} />
          </div>
        </div>

        {/* Info tables */}
        <div style={S.infoRow}>
          <table style={S.infoTable}>
            <tbody>
              {[
                ['Name:', 'الاسم', d.ConsumerName || ''],
                ['Unit No.:', 'رقم الوحدة', d.UnitNo || ''],
                ['Tower Name:', 'اسم البرج', d.BuildingName || ''],
                ['Invoice Number:', 'رقم الفاتورة', d.InvoiceNumber || ''],
              ].map(([en, ar, val]) => (
                <tr key={en}>
                  <td style={{ ...S.iTd, ...S.iLabel }}>
                    <div>{en}</div>
                    <div style={S.iAr}>{ar}</div>
                  </td>
                  <td style={S.iTd}>{val}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <table style={S.infoTable}>
            <tbody>
              {[
                ['Account Number:', 'رقم الحساب', d.AccountNumber || ''],
                ['Billing Date:', 'تاريخ الفاتورة', d.BillingDate || ''],
                ['Due Date:', 'تاريخ الاستحقاق', d.DueDate || ''],
                ['Billing Period:', 'فترة الفوترة', d.BillingPeriod || ''],
              ].map(([en, ar, val]) => (
                <tr key={en}>
                  <td style={{ ...S.iTd, ...S.iLabel }}>
                    <div>{en}</div>
                    <div style={S.iAr}>{ar}</div>
                  </td>
                  <td style={S.iTd}>{val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Main items table */}
        <table style={S.table}>
          <thead>
            <tr>
              {[
                ['Description', 'البيان'],
                ['Previous Reading (kWh)', 'القراءة السابقة'],
                ['Current Reading (kWh)', 'القراءة الحالية'],
                ['Qty (kWh)', 'الكمية'],
                ['Rate (AED)', 'سعر الوحدة'],
                ['Taxable Amount (AED)', 'المبلغ الخاضع للضريبة'],
                ['VAT (AED)', 'ضريبة القيمة المضافة'],
                ['Total Amount (AED)', 'إجمالي المبلغ'],
              ].map(([en, ar]) => (
                <th key={en} style={S.th}>
                  <div>{en}</div>
                  <div style={{ ...S.arSub, textAlign: 'center' }}>{ar}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {details.map((row, i) => (
              <tr key={i}>
                <td style={S.td}>{row.Description || ''}</td>
                <td style={S.tdR}>{raw(row.PrevReading)}</td>
                <td style={S.tdR}>{raw(row.CurrReading)}</td>
                <td style={S.tdR}>{raw(row.Qty)}</td>
                <td style={S.tdR}>{fmt2(row.Rate)}</td>
                <td style={S.tdR}>{fmt2(row.TaxableAmount)}</td>
                <td style={S.tdR}>{fmt2(row.VAT)}</td>
                <td style={S.tdR}>{fmt2(row.TotalAmount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5} style={S.sumTd}>
                <div>TOTAL</div>
                <div style={S.arSub}>الإجمالي</div>
              </td>
              <td style={S.sumTdR}>{fmt2(sumTaxable)}</td>
              <td style={S.sumTdR}>{fmt2(sumVAT)}</td>
              <td style={S.sumTdR}>{fmt2(sumTotal)}</td>
            </tr>
            <tr>
              <td colSpan={7} style={S.sumTd}>
                <div>Previous Balance</div>
                <div style={S.arSub}>الرصيد السابق</div>
              </td>
              <td style={S.sumTdR}>{fmt2(prevBalance)}</td>
            </tr>
            <tr>
              <td colSpan={7} style={S.sumTd}>
                <div>Adjustment Amount</div>
                <div style={S.arSub}>مبلغ التعديل</div>
              </td>
              <td style={S.sumTdR}>{fmt2(adjAmount)}</td>
            </tr>
            <tr>
              <td colSpan={7} style={S.sumTd}>
                <div>Advance Payment</div>
                <div style={S.arSub}>دفعة مقدمة</div>
              </td>
              <td style={S.sumTdR}>{fmt2(advPayment)}</td>
            </tr>
            <tr>
              <td colSpan={7} style={S.sumTd}>
                <div>Total Amount Payable Within Due Date</div>
                <div style={S.arSub}>إجمالي المبلغ المستحق السداد قبل تاريخ الاستحقاق</div>
              </td>
              <td style={S.sumTdR}>{fmt2(totalPayable)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Page 1 footer */}
        <div style={S.footer}>
          <div>
            <div><strong>Ways to pay your Bill:</strong> &nbsp; <span style={S.arSub}>طرق سداد الفاتورة</span></div>
            <div style={{ marginTop: '4px' }}>Cash , Cheque , Bank Transfer, Payby Link</div>
            <div style={{ ...S.arSub, direction: 'rtl', marginTop: '2px' }}>PayBy نقداً، شيك، تحويل بنكي، رابط</div>
          </div>
          <div style={{ maxWidth: '55%' }}>
            <div><strong>Note:</strong> A Late Fee will be applied to unpaid accounts after the invoice Due Date</div>
            <div style={{ ...S.arSub, direction: 'rtl', marginTop: '2px' }}>ملاحظة: سيتم تطبيق غرامة تأخير على الحسابات غير المسددة بعد تاريخ استحقاق الفاتورة</div>
            <div style={{ marginTop: '6px' }}><strong>E</strong> = Estimated value due to missing or unreadable meter data.</div>
            <div style={{ ...S.arSub, direction: 'rtl', marginTop: '2px' }}>قيمة تقديرية بسبب عدم توفر أو عدم وضوح بيانات العداد = E</div>
          </div>
        </div>
      </div>

      {/* ══ PAGE 2 ══ */}
      <div style={S2.box}>
        <div style={S2.twoCol}>
          {/* Bank Details */}
          <div style={S2.col}>
            <div style={S2.secTitle}>Bank Details:</div>
            {[
              ['Account Title', 'LYNX TECHNICAL SERVICES LLC'],
              ['Account Number', '19101139550'],
              ['IBAN', 'AE44033000019101139550'],
              ['CIF Number', '14492376.00'],
              ['Bank Name', 'Mashreq Bank PSC'],
            ].map(([lbl, val]) => (
              <div key={lbl} style={S2.bankRow}>
                <span style={S2.bankLabel}>{lbl}</span>
                <span style={S2.bankVal}>{val}</span>
              </div>
            ))}
          </div>

          {/* Contact */}
          <div style={S2.col}>
            <div style={S2.secTitle}>Contact Informations:</div>
            {['Enquiries@lynxllc.ae', 'info@lynxllc.ae'].map((e) => (
              <a key={e} href={`mailto:${e}`} style={S2.emailLink}>{e}</a>
            ))}
            {header.ContactNumber  && <div style={{ fontSize: '12px', marginBottom: '4px' }}>{header.ContactNumber}</div>}
            {header.WhatsAppNumber && <div style={{ fontSize: '12px', marginBottom: '4px' }}>{header.WhatsAppNumber}</div>}
          </div>
        </div>

        <div style={S2.twoCol}>
          {/* Please Try to */}
          <div style={S2.col}>
            <div style={S2.secTitle}>Please Try to:</div>
            <div style={S2.secTitleAr}>يرجى محاولة</div>
            {[
              ['Keep filters clean:', 'الحفاظ على نظافة الفلاتر'],
              ['Set thermostat between 23°C and 25°C:', 'ضبط منظم الحرارة بين 23°م و25°م'],
              ['Keep vents unblocked:', 'إبقاء فتحات التهوية غير مغلقة'],
              ['Keep doors and windows closed:', 'إبقاء الأبواب والنوافذ مغلقة'],
              ['Undertake regular maintenance of the system:', 'إجراء صيانة دورية للنظام'],
            ].map(([en, ar]) => (
              <div key={en} style={S2.bullet}>
                <span>•</span>
                <span>
                  <div>{en}</div>
                  <div style={{ ...S.arSub, direction: 'rtl' }}>{ar}</div>
                </span>
              </div>
            ))}
          </div>

          {/* Please Do Not */}
          <div style={S2.col}>
            <div style={S2.secTitle}>Please Do Not:</div>
            <div style={S2.secTitleAr}>يرجى عدم</div>
            {[
              ['Set thermostat to 20°C or lower:', 'ضبط منظم الحرارة على 20°م أو أقل'],
              ['Block vents:', 'إغلاق فتحات التهوية'],
              ['Leave doors and windows open:', 'ترك الأبواب والنوافذ مفتوحة'],
              ['Leave heat-producing appliances near thermostats:', 'وضع الأجهزة المنتجة للحرارة بالقرب من منظم الحرارة'],
            ].map(([en, ar]) => (
              <div key={en} style={S2.bullet}>
                <span>•</span>
                <span>
                  <div>{en}</div>
                  <div style={{ ...S.arSub, direction: 'rtl' }}>{ar}</div>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      </div> {/* end reportRef wrapper */}

      {status && (
        <div style={{ textAlign: 'right', fontSize: '12px', color: status.startsWith('✓') ? '#16a34a' : '#b91c1c', marginTop: '8px' }}>
          {status}
        </div>
      )}
    </div>
  );
}
