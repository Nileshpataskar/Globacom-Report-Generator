import { useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Field names match the actual API response exactly (including API typos like SecurityDeposite, EneryConsumptionAmount)
const COLUMNS = [
  { key: 'UnitNumber',              label: 'Unit No.',                                                  pdfLabel: 'Unit\nNo.',        align: 'left',   isNum: false },
  { key: 'ConsumerName',            label: 'Consumer Name',                                             pdfLabel: 'Consumer\nName',   align: 'left',   isNum: false },
  { key: 'AccountNo',               label: 'Account No',                                                pdfLabel: 'Account\nNo',      align: 'left',   isNum: false },
  { key: 'InvoiceNumber',           label: 'Invoice No.',                                               pdfLabel: 'Invoice\nNo.',     align: 'left',   isNum: false },
  { key: 'BillFromDate',            label: 'Bill Start Date',                                           pdfLabel: 'Bill\nStart',      align: 'center', isNum: false },
  { key: 'BillToDate',              label: 'Bill End Date',                                             pdfLabel: 'Bill\nEnd',        align: 'center', isNum: false },
  { key: 'BillDate',                label: 'Bill Date',                                                 pdfLabel: 'Bill\nDate',       align: 'center', isNum: false },
  { key: 'SecurityDeposite',        label: 'Security Deposit (AED)',                                    pdfLabel: 'Sec.\nDeposit',    align: 'right',  isNum: true  },
  { key: 'RegistrationFee',         label: 'Registration Fee (AED)',                                    pdfLabel: 'Reg.\nFee',        align: 'right',  isNum: true  },
  { key: 'EneryConsumptionAmount',  label: 'Energy Consumption Amount (AED)',                           pdfLabel: 'Energy\nConsump.', align: 'right',  isNum: true  },
  { key: 'CapacityCharges',         label: 'Capacity Charges (AED)',                                    pdfLabel: 'Capacity\nChgs',   align: 'right',  isNum: true  },
  { key: 'FuelSubCharges',          label: 'Fuel Surcharge (AED)',                                      pdfLabel: 'Fuel\nSurchg.',    align: 'right',  isNum: true  },
  { key: 'BillingFee',              label: 'Billing Fee (AED)',                                         pdfLabel: 'Billing\nFee',     align: 'right',  isNum: true  },
  { key: 'LateFee',                 label: 'Late Fee (AED)',                                            pdfLabel: 'Late\nFee',        align: 'right',  isNum: true  },
  { key: 'ReturnedChequeFee',       label: 'Returned Cheque Fee (AED)',                                 pdfLabel: 'Returned\nCheque', align: 'right',  isNum: true  },
  { key: 'ReconnectionCharges',     label: 'Reconnection Charges (AED)',                                pdfLabel: 'Reconn.\nChgs',    align: 'right',  isNum: true  },
  { key: 'InspectionCharges',       label: 'Inspection Charges (AED)',                                  pdfLabel: 'Insp.\nChgs',      align: 'right',  isNum: true  },
  { key: 'VATOnUtility',            label: 'VAT on Utility, Capacity Charges & Fuel Surcharges (AED)', pdfLabel: 'VAT\nUtility',     align: 'right',  isNum: true  },
  { key: 'VATOnOtherFee',           label: 'VAT On Other Fees (AED)',                                   pdfLabel: 'VAT\nOther',       align: 'right',  isNum: true  },
  { key: 'TotalAmount',             label: 'Total Amount (AED)',                                        pdfLabel: 'Total\nAmt',       align: 'right',  isNum: true  },
  { key: 'TotalVATAmount',          label: 'Total VAT Amount (AED)',                                    pdfLabel: 'Total\nVAT',       align: 'right',  isNum: true  },
  { key: 'BilledAmount',            label: 'Billed Amount (AED)',                                       pdfLabel: 'Billed\nAmt',      align: 'right',  isNum: true  },
  { key: 'OpeningPreviousBalance',  label: 'Opening/Previous Balance (AED)',                            pdfLabel: 'Prev.\nBalance',   align: 'right',  isNum: true  },
  { key: 'AdvanceAmount',           label: 'Advance Amount (AED)',                                      pdfLabel: 'Advance\nAmt',     align: 'right',  isNum: true  },
  { key: 'TotalAdjustmentAmount',   label: 'Total Adjustment Amount (AED)',                             pdfLabel: 'Adj.\nAmt',        align: 'right',  isNum: true  },
  { key: 'TotalBillingAmount',      label: 'Total Billed Amount (AED)',                                 pdfLabel: 'Total\nBilled',    align: 'right',  isNum: true  },
];

// Columns for the Line Item Adjustment Summary (ends at TotalVATAmount — matches API response)
const SUMMARY_COLUMNS = [
  { key: 'UnitNumber',             label: 'Unit No.',                                                  align: 'left',   isNum: false },
  { key: 'ConsumerName',           label: 'Consumer Name',                                             align: 'left',   isNum: false },
  { key: 'AccountNo',              label: 'Account No',                                                align: 'left',   isNum: false },
  { key: 'InvoiceNumber',          label: 'Invoice No.',                                               align: 'left',   isNum: false },
  { key: 'BillFromDate',           label: 'Bill Start Date',                                           align: 'center', isNum: false },
  { key: 'BillToDate',             label: 'Bill End Date',                                             align: 'center', isNum: false },
  { key: 'BillDate',               label: 'Bill Date',                                                 align: 'center', isNum: false },
  { key: 'SecurityDeposite',       label: 'Security Deposit (AED)',                                    align: 'right',  isNum: true  },
  { key: 'RegistrationFee',        label: 'Registration Fee (AED)',                                    align: 'right',  isNum: true  },
  { key: 'EneryConsumptionAmount', label: 'Energy Consumption Amount (AED)',                           align: 'right',  isNum: true  },
  { key: 'CapacityCharges',        label: 'Capacity Charges (AED)',                                    align: 'right',  isNum: true  },
  { key: 'FuelSubCharges',         label: 'Fuel Surcharge (AED)',                                      align: 'right',  isNum: true  },
  { key: 'BillingFee',             label: 'Billing Fee (AED)',                                         align: 'right',  isNum: true  },
  { key: 'LateFee',                label: 'Late Fee (AED)',                                            align: 'right',  isNum: true  },
  { key: 'ReturnedChequeFee',      label: 'Returned Cheque Fee (AED)',                                 align: 'right',  isNum: true  },
  { key: 'ReconnectionCharges',    label: 'Reconnection Charges (AED)',                                align: 'right',  isNum: true  },
  { key: 'InspectionCharges',      label: 'Inspection Charges (AED)',                                  align: 'right',  isNum: true  },
  { key: 'VATOnUtility',           label: 'VAT on Utility, Capacity Charges & Fuel Surcharges (AED)', align: 'right',  isNum: true  },
  { key: 'VATOnOtherFee',          label: 'VAT On Other Fees (AED)',                                   align: 'right',  isNum: true  },
  { key: 'TotalVATAmount',         label: 'Total VAT Amount (AED)',                                    align: 'right',  isNum: true  },
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
    textAlign: 'right',
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
    minWidth: '2200px',
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
  td: {
    border: '1px solid #000',
    padding: '5px 4px',
    verticalAlign: 'top',
    fontSize: '11px',
    whiteSpace: 'nowrap',
  },
  tdRight: {
    border: '1px solid #000',
    padding: '5px 4px',
    verticalAlign: 'top',
    fontSize: '11px',
    textAlign: 'right',
    whiteSpace: 'nowrap',
  },
  tdCenter: {
    border: '1px solid #000',
    padding: '5px 4px',
    verticalAlign: 'top',
    fontSize: '11px',
    textAlign: 'center',
    whiteSpace: 'nowrap',
  },
  tfoot: {
    border: '1px solid #000',
    padding: '5px 4px',
    fontWeight: 'bold',
    background: '#f5f5f5',
    fontSize: '11px',
    whiteSpace: 'nowrap',
  },
  tfootRight: {
    border: '1px solid #000',
    padding: '5px 4px',
    fontWeight: 'bold',
    background: '#f5f5f5',
    fontSize: '11px',
    textAlign: 'right',
    whiteSpace: 'nowrap',
  },
  // Sticky left columns — Unit No. (col 0) and Consumer Name (col 1)
  thSticky0: { position: 'sticky', left: 0,     zIndex: 3, background: '#fff', minWidth: '80px'  },
  thSticky1: { position: 'sticky', left: '80px', zIndex: 3, background: '#fff', minWidth: '160px' },
  tdSticky0: { position: 'sticky', left: 0,     zIndex: 1, background: '#fff', minWidth: '80px'  },
  tdSticky1: { position: 'sticky', left: '80px', zIndex: 1, background: '#fff', minWidth: '160px' },
  statusMsg: (ok) => ({
    marginTop: '10px',
    fontSize: '12px',
    color: ok ? '#16a34a' : '#b91c1c',
    textAlign: 'right',
  }),
};

export default function UnitWiseBillingReport({ rows, summaryRows = [], estateName, fromDate, toDate }) {
  const [status, setStatus] = useState('');
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [loadingExcel, setLoadingExcel] = useState(false);

  // GeneratedBy and GeneratedOn come directly from the API response
  const firstRow = rows[0] || {};
  const generatedBy = firstRow.GeneratedBy || '';
  const generatedOn = firstRow.GeneratedOn || '';

  // Title mirrors Telerik: estateName + " billing report " + "from " + startDate + " to " + stopDate
  const title = `${estateName} billing report from ${displayDate(fromDate)} to ${displayDate(toDate)}`;

  function cellStyle(col) {
    if (col.align === 'right') return S.tdRight;
    if (col.align === 'center') return S.tdCenter;
    return S.td;
  }

  function cellValue(row, col) {
    if (col.isNum) return fmt2(row[col.key]);
    return fmtDate(row[col.key]) || row[col.key] || '';
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
      const dataRows = rows.map((r) =>
        COLUMNS.map((c) => {
          if (c.isNum) {
            const n = parseFloat(r[c.key]);
            return isNaN(n) ? '' : parseFloat(n.toFixed(2));
          }
          return fmtDate(r[c.key]) || r[c.key] || '';
        })
      );
      const totalRow = COLUMNS.map((c, i) => {
        if (i === 0) return 'Total';
        if (i < 4) return '';
        if (c.isNum) return parseFloat(sumCol(rows, c.key).toFixed(2));
        return '';
      });

      const ws = XLSX.utils.aoa_to_sheet([...metaRows, headerRow, ...dataRows, totalRow]);
      ws['!cols'] = COLUMNS.map((c) => ({
        wch: c.isNum ? 14 : c.key === 'ConsumerName' ? 30 : c.key === 'VATOnUtilityCapacityAndFuelSurcharge' ? 45 : 18,
      }));
      XLSX.utils.book_append_sheet(wb, ws, 'Unit Wise Billing');
      XLSX.writeFile(wb, `${estateName.replace(/\s+/g, '_')}_Unit_Wise_Billing.xlsx`);
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

      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(title, doc.internal.pageSize.getWidth() / 2, 14, { align: 'center' });

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated By: ${generatedBy}    Generated On: ${generatedOn}`, doc.internal.pageSize.getWidth() - 14, 20, { align: 'right' });

      const head = [COLUMNS.map((c) => c.pdfLabel)];

      const body = rows.map((r) =>
        COLUMNS.map((c) => {
          if (c.isNum) return fmt2(r[c.key]);
          return fmtDate(r[c.key]) || r[c.key] || '';
        })
      );

      const foot = [
        COLUMNS.map((c, i) => {
          if (i === 0) return 'Total';
          if (i < 4) return '';
          if (c.isNum) return sumCol(rows, c.key).toFixed(2);
          return '';
        }),
      ];

      const colStyles = {};
      COLUMNS.forEach((c, i) => {
        colStyles[i] = {
          halign: c.align === 'right' ? 'right' : c.align === 'center' ? 'center' : 'left',
          cellWidth: i === 1 ? 22 : i === 0 ? 12 : i < 4 ? 17 : i < 7 ? 14 : 12,
        };
      });

      autoTable(doc, {
        head,
        body,
        foot,
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

      doc.save(`${estateName.replace(/\s+/g, '_')}_Unit_Wise_Billing.pdf`);
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
          {generatedBy && <>Generated By: {generatedBy} &nbsp;&nbsp;</>}
          {generatedOn && <>Generated On: {generatedOn}</>}
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
                    {i < 3 ? '' : c.isNum ? sumCol(rows, c.key).toFixed(2) : ''}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>

      </div>

      {summaryRows.length > 0 && (
        <div style={{ ...S.report, marginTop: '28px' }}>
          <div style={{ ...S.reportTitle, fontSize: '15px', marginBottom: '12px' }}>
            Line Item Adjustment Summary
          </div>

          <div style={S.tableWrap}>
            <table style={{ ...S.table, minWidth: '1600px' }}>
              <thead>
                <tr>
                  {SUMMARY_COLUMNS.map((c, i) => (
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
                {summaryRows.map((row, idx) => (
                  <tr key={idx}>
                    {SUMMARY_COLUMNS.map((c, i) => {
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
                  {SUMMARY_COLUMNS.slice(1).map((c, i) => (
                    <td
                      key={c.key}
                      style={i === 0 ? { ...(c.isNum ? S.tfootRight : S.tfoot), ...S.tdSticky1 } : c.isNum ? S.tfootRight : S.tfoot}
                    >
                      {i < 3 ? '' : c.isNum ? sumCol(summaryRows, c.key).toFixed(2) : ''}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {status && (
        <div style={S.statusMsg(status.startsWith('✓'))}>{status}</div>
      )}
    </div>
  );
}
