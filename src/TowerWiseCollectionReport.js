import { useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Field names from Telerik designer
const COLUMNS = [
  { key: 'CollectionDate',    label: 'Collection Date',       pdfLabel: 'Collection\nDate',    align: 'center', isNum: false },
  { key: 'BillGeneratedDate', label: 'Bill Generated Date',   pdfLabel: 'Bill\nGenerated',     align: 'center', isNum: false },
  { key: 'InvoiceNumber',     label: 'Invoice No.',           pdfLabel: 'Invoice\nNo.',        align: 'left',   isNum: false },
  { key: 'AccountNo',         label: 'Account No.',           pdfLabel: 'Account\nNo.',        align: 'left',   isNum: false },
  { key: 'UnitNumber',        label: 'Unit No.',              pdfLabel: 'Unit\nNo.',           align: 'left',   isNum: false },
  { key: 'ConsumerName',      label: 'Customer Name',         pdfLabel: 'Customer\nName',      align: 'left',   isNum: false },
  { key: 'PaymentType',       label: 'Payment Type',          pdfLabel: 'Payment\nType',       align: 'left',   isNum: false },
  { key: 'AdjustmentType',    label: 'Adjustment Type',       pdfLabel: 'Adjustment\nType',    align: 'left',   isNum: false },
  { key: 'Comments',          label: 'Comments',              pdfLabel: 'Comments',            align: 'left',   isNum: false },
  { key: 'DepositHeld',       label: 'Deposit Held (AED)',    pdfLabel: 'Deposit\nHeld',       align: 'right',  isNum: true  },
  { key: 'AdminFee',          label: 'Admin Fee (AED)',       pdfLabel: 'Admin\nFee',          align: 'right',  isNum: true  },
  { key: 'UtilityCharges',    label: 'Utility Charges (AED)', pdfLabel: 'Utility\nCharges',   align: 'right',  isNum: true  },
  { key: 'CapacityCharges',   label: 'Capacity Charges (AED)',pdfLabel: 'Capacity\nCharges',  align: 'right',  isNum: true  },
  { key: 'BillingFee',        label: 'Billing Fee (AED)',     pdfLabel: 'Billing\nFee',        align: 'right',  isNum: true  },
  { key: 'OpeningBalance',    label: 'Opening Balance (AED)', pdfLabel: 'Opening\nBalance',   align: 'right',  isNum: true  },
  { key: 'LateFee',           label: 'Late Fee (AED)',        pdfLabel: 'Late\nFee',           align: 'right',  isNum: true  },
  { key: 'OtherFee',          label: 'Other Fee (AED)',       pdfLabel: 'Other\nFee',          align: 'right',  isNum: true  },
  { key: 'Vat5Per',           label: 'VAT 5% (AED)',          pdfLabel: 'VAT\n5%',             align: 'right',  isNum: true  },
  { key: 'AdvanceAmount',     label: 'Advance Amount (AED)',  pdfLabel: 'Advance\nAmt',        align: 'right',  isNum: true  },
  { key: 'AdjustmentAmount',  label: 'Adjustment Amount (AED)', pdfLabel: 'Adjustment\nAmt',  align: 'right',  isNum: true  },
  { key: 'Total',             label: 'Total (AED)',           pdfLabel: 'Total\n(AED)',         align: 'right',  isNum: true  },
];

function fmt2(value) {
  const n = parseFloat(value);
  if (value === null || value === undefined || isNaN(n)) return '';
  return n.toFixed(2);
}

function fmtDate(value) {
  if (!value) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(String(value))) return value;
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function displayDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function sumCol(rows, key) {
  return rows.reduce((s, r) => s + (parseFloat(r[key]) || 0), 0);
}

const S = {
  page: {
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: '13px',
    color: '#222',
    margin: '20px 24px',
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginBottom: '16px',
  },
  btn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 16px',
    border: '1px solid #444',
    borderRadius: '4px',
    background: '#fff',
    fontSize: '13px',
    fontFamily: 'Arial, Helvetica, sans-serif',
    cursor: 'pointer',
  },
  report: {
    border: '1px solid #444',
    padding: '18px',
    background: '#fff',
  },
  reportTitle: {
    textAlign: 'center',
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '4px',
  },
  meta: {
    fontSize: '11px',
    color: '#555',
    marginBottom: '16px',
  },
  tableWrap: {
    overflowX: 'auto',
    overflowY: 'auto',
    maxHeight: 'calc(100vh - 300px)',
    position: 'relative',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '11px',
    minWidth: '2400px',
  },
  th: {
    background: '#fff',
    border: '1px solid #000',
    padding: '5px 4px',
    fontSize: '11px',
    textAlign: 'center',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    verticalAlign: 'bottom',
    position: 'sticky',
    top: 0,
    zIndex: 2,
  },
  // Sticky left: Collection Date (col 0) and Invoice No. (col 2, via Unit No. col 4 — freeze first 2)
  thSticky0: { position: 'sticky', left: 0,      zIndex: 3, background: '#fff', minWidth: '100px' },
  thSticky1: { position: 'sticky', left: '100px', zIndex: 3, background: '#fff', minWidth: '120px' },
  tdSticky0: { position: 'sticky', left: 0,      zIndex: 1, background: '#fff', minWidth: '100px' },
  tdSticky1: { position: 'sticky', left: '100px', zIndex: 1, background: '#fff', minWidth: '120px' },
  td:      { border: '1px solid #000', padding: '5px 4px', verticalAlign: 'top', fontSize: '11px', whiteSpace: 'nowrap' },
  tdRight: { border: '1px solid #000', padding: '5px 4px', verticalAlign: 'top', fontSize: '11px', textAlign: 'right',  whiteSpace: 'nowrap' },
  tdCenter:{ border: '1px solid #000', padding: '5px 4px', verticalAlign: 'top', fontSize: '11px', textAlign: 'center', whiteSpace: 'nowrap' },
  tfoot:      { border: '1px solid #000', padding: '5px 4px', fontWeight: 'bold', background: '#f5f5f5', fontSize: '11px', whiteSpace: 'nowrap' },
  tfootRight: { border: '1px solid #000', padding: '5px 4px', fontWeight: 'bold', background: '#f5f5f5', fontSize: '11px', textAlign: 'right', whiteSpace: 'nowrap' },
  statusMsg: (ok) => ({ marginTop: '10px', fontSize: '12px', color: ok ? '#16a34a' : '#b91c1c', textAlign: 'right' }),
};

export default function TowerWiseCollectionReport({ rows, estateName, fromDate, toDate }) {
  const [status,       setStatus]       = useState('');
  const [loadingPDF,   setLoadingPDF]   = useState(false);
  const [loadingExcel, setLoadingExcel] = useState(false);

  const firstRow   = rows[0] || {};
  const generatedBy = firstRow.GeneratedBy || '';
  const generatedOn = firstRow.GeneratedOn  || '';

  const title = `${estateName} Collection Report From ${displayDate(fromDate)} to ${displayDate(toDate)}`;

  function cellStyle(col) {
    if (col.align === 'right')  return S.tdRight;
    if (col.align === 'center') return S.tdCenter;
    return S.td;
  }

  function cellValue(row, col) {
    if (col.isNum) return fmt2(row[col.key]);
    const rawDate = ['CollectionDate', 'BillGeneratedDate'].includes(col.key);
    if (rawDate) return fmtDate(row[col.key]);
    return row[col.key] || '';
  }

  function exportExcel() {
    setLoadingExcel(true);
    setStatus('');
    try {
      const wb = XLSX.utils.book_new();
      const metaRows = [
        [title],
        [],
        [`Generated By: ${generatedBy}`, `Generated On: ${generatedOn}`],
        [],
      ];
      const headerRow = COLUMNS.map((c) => c.label);
      const dataRows  = rows.map((r) =>
        COLUMNS.map((c) => {
          if (c.isNum) {
            const n = parseFloat(r[c.key]);
            return isNaN(n) ? '' : parseFloat(n.toFixed(2));
          }
          const rawDate = ['CollectionDate', 'BillGeneratedDate'].includes(c.key);
          return rawDate ? fmtDate(r[c.key]) : (r[c.key] || '');
        })
      );
      const totalRow = COLUMNS.map((c, i) => {
        if (i === 0) return 'Total';
        if (!c.isNum) return '';
        return parseFloat(sumCol(rows, c.key).toFixed(2));
      });

      const ws = XLSX.utils.aoa_to_sheet([...metaRows, headerRow, ...dataRows, totalRow]);
      ws['!cols'] = COLUMNS.map((c) => ({
        wch: c.key === 'ConsumerName' ? 28 : c.key === 'Comments' ? 35 : c.isNum ? 14 : 18,
      }));
      XLSX.utils.book_append_sheet(wb, ws, 'Collection Report');
      XLSX.writeFile(wb, `${estateName.replace(/\s+/g, '_')}_Collection_Report.xlsx`);
      setStatus('✓ Excel downloaded.');
    } catch (err) {
      console.error(err);
      setStatus('Excel export failed.');
    } finally {
      setLoadingExcel(false);
    }
  }

  function exportPDF() {
    setLoadingPDF(true);
    setStatus('');
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });
      const pw = doc.internal.pageSize.getWidth();

      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(title, pw / 2, 14, { align: 'center' });

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated By: ${generatedBy}    Generated On: ${generatedOn}`, pw - 14, 20, { align: 'right' });

      const head = [COLUMNS.map((c) => c.pdfLabel)];
      const body = rows.map((r) =>
        COLUMNS.map((c) => {
          if (c.isNum) return fmt2(r[c.key]);
          const rawDate = ['CollectionDate', 'BillGeneratedDate'].includes(c.key);
          return rawDate ? fmtDate(r[c.key]) : (r[c.key] || '');
        })
      );
      const foot = [
        COLUMNS.map((c, i) => {
          if (i === 0) return 'Total';
          if (!c.isNum) return '';
          return sumCol(rows, c.key).toFixed(2);
        }),
      ];

      const colStyles = {};
      COLUMNS.forEach((c, i) => {
        colStyles[i] = {
          halign: c.align === 'right' ? 'right' : c.align === 'center' ? 'center' : 'left',
          cellWidth: i === 5 ? 22 : i === 8 ? 28 : i < 9 ? 14 : 12,
        };
      });

      autoTable(doc, {
        head, body, foot,
        startY: 24,
        styles: {
          fontSize: 6,
          cellPadding: 2,
          lineColor: [0, 0, 0],
          lineWidth: 0.2,
          textColor: [0, 0, 0],
          font: 'helvetica',
          overflow: 'linebreak',
        },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          lineColor: [0, 0, 0],
          lineWidth: 0.2,
          valign: 'bottom',
        },
        footStyles: {
          fillColor: [245, 245, 245],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          lineColor: [0, 0, 0],
          lineWidth: 0.2,
        },
        alternateRowStyles: { fillColor: [255, 255, 255] },
        columnStyles: colStyles,
        margin: { left: 5, right: 5 },
      });

      doc.save(`${estateName.replace(/\s+/g, '_')}_Collection_Report.pdf`);
      setStatus('✓ PDF downloaded.');
    } catch (err) {
      console.error(err);
      setStatus('PDF export failed.');
    } finally {
      setLoadingPDF(false);
    }
  }

  return (
    <div style={S.page}>
      <div style={S.toolbar}>
        <button style={S.btn} onClick={exportExcel} disabled={loadingExcel}>
          ⬇ {loadingExcel ? 'Exporting…' : 'Export Excel'}
        </button>
        <button style={S.btn} onClick={exportPDF} disabled={loadingPDF}>
          ⬇ {loadingPDF ? 'Exporting…' : 'Export PDF'}
        </button>
      </div>

      <div style={S.report}>
        <div style={S.reportTitle}>{title}</div>
        <div style={S.meta}>
          {generatedOn && <div>Generated On: {generatedOn}</div>}
          {generatedBy && <div>Generated By: {generatedBy}</div>}
        </div>

        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                {COLUMNS.map((c, i) => (
                  <th
                    key={c.key}
                    style={i === 0 ? { ...S.th, ...S.thSticky0 } : i === 1 ? { ...S.th, ...S.thSticky1 } : S.th}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx}>
                  {COLUMNS.map((c, i) => {
                    const base = cellStyle(c);
                    const sticky = i === 0 ? S.tdSticky0 : i === 1 ? S.tdSticky1 : null;
                    return (
                      <td key={c.key} style={sticky ? { ...base, ...sticky } : base}>
                        {cellValue(row, c)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td style={{ ...S.tfoot, ...S.tdSticky0 }}>Total</td>
                {COLUMNS.slice(1).map((c, i) => (
                  <td
                    key={c.key}
                    style={i === 0 ? { ...(c.isNum ? S.tfootRight : S.tfoot), ...S.tdSticky1 } : c.isNum ? S.tfootRight : S.tfoot}
                  >
                    {c.isNum ? sumCol(rows, c.key).toFixed(2) : ''}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {status && <div style={S.statusMsg(status.startsWith('✓'))}>{status}</div>}
    </div>
  );
}
