import { useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


const SAMPLE_DATA =  await loadData();

async function loadData() {
  try {
    const response = await fetch('/dummydata.json'); 
    if (!response.ok) throw new Error('Network response was not ok');
    console.log(response[1])
    const data = await response.json()
    return data


  } catch (error) {
    console.error('Error reading JSON:', error);
  }
  
}


function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatAmount(value) {
  const num = parseFloat(value);
  if (value === null || value === undefined || isNaN(num)) return "";
  return num.toFixed(2);
}

function formatBalance(value) {
  const num = parseFloat(value);
  if (value === null || value === undefined || isNaN(num)) return "";
  return num.toFixed(2);
}

const S = {
  page: {
    boxSizing: "border-box",
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: "13px",
    color: "#222",
    margin: "30px",
  },
  toolbar: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginBottom: "16px",
  },
  btn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "7px 16px",
    border: "1px solid #444",
    borderRadius: "4px",
    background: "#fff",
    fontSize: "13px",
    fontFamily: "Arial, Helvetica, sans-serif",
    cursor: "pointer",
  },
  report: {
    width: "100%",
    border: "1px solid #444",
    padding: "18px",
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px",
  },
  title: {
    textAlign: "center",
    fontSize: "28px",
    fontWeight: "bold",
    flex: 1,
  },
  logo: {
    width: "120px",
    textAlign: "right",
  },
  info: {
    marginTop: "15px",
    marginBottom: "25px",
    lineHeight: 2,
  },
  infoRow: {
    display: "block",
  },
  infoLabel: {
    display: "inline-block",
    width: "170px",
    fontWeight: "bold",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    background: "#ffffff",
    border: "1px solid #000",
    padding: "8px",
    fontSize: "13px",
    textAlign: "center",
    fontWeight: "bold",
  },
  td: {
    border: "1px solid #000",
    padding: "8px",
    verticalAlign: "top",
    fontSize: "13px",
  },
  tdRight: {
    border: "1px solid #000",
    padding: "8px",
    verticalAlign: "top",
    fontSize: "13px",
    textAlign: "right",
  },
  tdCenter: {
    border: "1px solid #000",
    padding: "8px",
    verticalAlign: "top",
    fontSize: "13px",
    textAlign: "center",
  },
  tfootTd: {
    border: "1px solid #000",
    padding: "8px",
    verticalAlign: "top",
    fontSize: "13px",
    fontWeight: "bold",
    background: "#f5f5f5",
  },
  tfootTdRight: {
    border: "1px solid #000",
    padding: "8px",
    verticalAlign: "top",
    fontSize: "13px",
    fontWeight: "bold",
    background: "#f5f5f5",
    textAlign: "right",
  },
  statusMsg: (ok) => ({
    marginTop: "10px",
    fontSize: "12px",
    color: ok ? "#16a34a" : "#b91c1c",
    textAlign: "right",
  }),
};

export default function StatementOfAccount({
  transactions = SAMPLE_DATA,
  unitName = "Unit A - Tower 1",
  consumerName = "John Smith",
  serviceAgreementNo = "B936EDF4-9A4C",
  logoUrl = "/output.png",
}) {
  const [status, setStatus] = useState("");
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [loadingExcel, setLoadingExcel] = useState(false);
   // const [transactions, setTransactions] = useState([]);


  const totalDebit = transactions.reduce((s, r) => s + (r.Debit_Amount || 0), 0);
  const totalCredit = transactions.reduce((s, r) => s + (r.Credit_Amount || 0), 0);
  const lastBalance = transactions.length ? transactions[transactions.length - 1].RunningBalance : 0;



  function exportExcel() {
    setLoadingExcel(true);
    setStatus("");
    try {
      const wb = XLSX.utils.book_new();
      const metaRows = [
        ["Statement of Account Report"],
        [],
        ["Unit Name:", unitName],
        ["Consumer Name:", consumerName],
        ["Service Agreement No:", serviceAgreementNo],
        [],
      ];
      const headerRow = ["Date", "Entry Type", "Reference No", "Description", "Debit (AED)", "Credit (AED)", "Balance (AED)"];
      const dataRows = transactions.map((r) => [
        formatDate(r.TransactionDate),
        r.CollectionName + (r.PaymentName ? ` - ${r.PaymentName}` : ""),
        r.ReferenceNumber || "",
        r.Description,
        r.Debit_Amount || 0,
        r.Credit_Amount || 0,
        r.RunningBalance,
      ]);
      const totalRow = ["", "", "", "Total",
        parseFloat(totalDebit.toFixed(2)),
        parseFloat(totalCredit.toFixed(2)),
        parseFloat(lastBalance.toFixed(2)),
      ];
      const ws = XLSX.utils.aoa_to_sheet([...metaRows, headerRow, ...dataRows, totalRow]);
      ws["!cols"] = [{ wch: 14 }, { wch: 28 }, { wch: 38 }, { wch: 55 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, ws, "Statement");
      XLSX.writeFile(wb, "statement_of_account.xlsx");
      setStatus("✓ Excel downloaded.");
    } catch (err) {
      console.error(err);
      setStatus("Excel export failed.");
    } finally {
      setLoadingExcel(false);
    }
  }

  function exportPDF() {
    setLoadingPDF(true);
    setStatus("");
    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

      // Title
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Statement Of Account Report", 148, 18, { align: "center" });

      // Logo
      if (logoUrl) {
        doc.addImage(logoUrl, "PNG", 258, 8, 25, 14);
      }

      // Meta
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);

      const metaLines = [
        ["Unit Name:", unitName],
        ["Consumer Name:", consumerName],
        ["Service Agreement No:", serviceAgreementNo],
      ];
      metaLines.forEach(([label, value], i) => {
        const y = 28 + i * 7;
        doc.setFont("helvetica", "bold");
        doc.text(label, 14, y);
        doc.setFont("helvetica", "normal");
        doc.text(value, 55, y);
      });

      // Table
      const head = [["Date", "Entry Type", "Reference No", "Description", "Debit (AED)", "Credit (AED)", "Balance (AED)"]];
      const body = transactions.map((r) => [
        formatDate(r.TransactionDate),
        r.CollectionName + (r.PaymentName ? ` - ${r.PaymentName}` : ""),
        r.ReferenceNumber || "",
        r.Description,
        formatAmount(r.Debit_Amount),
        formatAmount(r.Credit_Amount),
        formatBalance(r.RunningBalance),
      ]);

      autoTable(doc, {
        head,
        body,
        foot: [["", "", "", "Total",
          formatAmount(totalDebit),
          formatAmount(totalCredit),
          formatBalance(lastBalance),
        ]],
        startY: 50,
        styles: {
          fontSize: 8,
          cellPadding: 3,
          lineColor: [0, 0, 0],
          lineWidth: 0.3,
          textColor: [0, 0, 0],
          font: "helvetica",
        },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: "bold",
          halign: "center",
          lineColor: [0, 0, 0],
          lineWidth: 0.3,
        },
        footStyles: {
          fillColor: [245, 245, 245],
          textColor: [0, 0, 0],
          fontStyle: "bold",
          lineColor: [0, 0, 0],
          lineWidth: 0.3,
        },
        alternateRowStyles: { fillColor: [255, 255, 255] },
        columnStyles: {
          0: { cellWidth: 22, halign: "center" },
          1: { cellWidth: 36 },
          2: { cellWidth: 36 },
          3: { cellWidth: 84 },
          4: { cellWidth: 22, halign: "right" },
          5: { cellWidth: 22, halign: "right" },
          6: { cellWidth: 22, halign: "right" },
        },
      });

      doc.save("statement_of_account.pdf");
      setStatus("✓ PDF downloaded.");
    } catch (err) {
      console.error(err);
      setStatus("PDF export failed.");
    } finally {
      setLoadingPDF(false);
    }
  }

  return (
    <div style={S.page}>

      {/* Export buttons */}
      <div style={S.toolbar}>
        <button style={S.btn} onClick={exportExcel} disabled={loadingExcel}>
          ⬇ {loadingExcel ? "Exporting…" : "Export Excel"}
        </button>
        <button style={S.btn} onClick={exportPDF} disabled={loadingPDF}>
          ⬇ {loadingPDF ? "Exporting…" : "Export PDF"}
        </button>
      </div>

      <div style={S.report}>

        <div style={S.header}>
          <div style={S.title}>Statement Of Account Report</div>
          <div style={S.logo}>
            {logoUrl
              ? <img src={logoUrl} alt="Logo" style={{ maxWidth: "100%", maxHeight: "70px" }} />
              : <img src="https://via.placeholder.com/120x70?text=Logo" alt="Logo" style={{ maxWidth: "100%", maxHeight: "70px" }} />
            }
          </div>
        </div>

        <div style={S.info}>
          <div style={S.infoRow}>
            <strong style={S.infoLabel}>Unit Name:</strong>
            {unitName}
          </div>
          <div style={S.infoRow}>
            <strong style={S.infoLabel}>Consumer Name:</strong>
            {consumerName}
          </div>
          <div style={S.infoRow}>
            <strong style={S.infoLabel}>Service Agreement No:</strong>
            {serviceAgreementNo}
          </div>
        </div>

        <table style={S.table}>
          <thead>
            <tr>
              <th style={{ ...S.th, width: "10%" }}>Date</th>
              <th style={{ ...S.th, width: "14%", textAlign: "left" }}>Entry Type</th>
              <th style={{ ...S.th, width: "12%" }}>Reference No</th>
              <th style={{ ...S.th, width: "38%", textAlign: "left" }}>Description</th>
              <th style={{ ...S.th, width: "9%", textAlign: "right" }}>Debit (AED)</th>
              <th style={{ ...S.th, width: "9%", textAlign: "right" }}>Credit (AED)</th>
              <th style={{ ...S.th, width: "8%", textAlign: "right" }}>Balance (AED)</th>
            </tr>
          </thead>

          <tbody>
            {transactions.map((row) => (
              <tr key={row.StatementOfAccountID}>
                <td style={S.tdCenter}>{formatDate(row.TransactionDate)}</td>
                <td style={S.td}>
                  {row.CollectionName || ""}
                  {row.PaymentName ? ` - ${row.PaymentName}` : ""}
                </td>
                <td style={S.tdCenter}>{row.ReferenceNumber || ""}</td>
                <td style={S.td}>{row.Description}</td>
                <td style={S.tdRight}>{formatAmount(row.Debit_Amount)}</td>
                <td style={S.tdRight}>{formatAmount(row.Credit_Amount)}</td>
                <td style={S.tdRight}>{formatBalance(row.RunningBalance)}</td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr>
              <td colSpan={4} style={S.tfootTd}>Total</td>
              <td style={S.tfootTdRight}>{formatAmount(totalDebit)}</td>
              <td style={S.tfootTdRight}>{formatAmount(totalCredit)}</td>
              <td style={S.tfootTdRight}>{formatBalance(lastBalance)}</td>
            </tr>
          </tfoot>
        </table>

      </div>

      {status && (
        <div style={S.statusMsg(status.startsWith("✓"))}>{status}</div>
      )}
    </div>
  );
}