import { useState, useEffect, useRef } from "react";
import StatementOfAccount from "./statement_of_account";
import axiosInstance from "./services/axiosInstance";

// ─── Searchable Dropdown ──────────────────────────────────────────────────────
function SearchableSelect({ options, value, onChange, placeholder, disabled }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);

  const selected = options.find((o) => o.serviceAgreementKey === value);
  const filtered = options.filter((o) =>
    (o.serviceAgreementNumber || "").toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function handleOutsideClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  function handleSelect(key) {
    onChange(key);
    setOpen(false);
    setSearch("");
  }

  return (
    <div ref={containerRef} style={{ position: "relative", flex: 1 }}>
      <div style={SD.fieldWrap}>
        <label style={SD.floatLabel}>Service Agreement No</label>
        <input
          style={SD.input}
          value={open ? search : (selected?.serviceAgreementNumber || "")}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => { setOpen(true); setSearch(""); }}
          placeholder={disabled ? "Loading…" : placeholder}
          disabled={disabled}
        />
        <span style={SD.arrow} onClick={() => !disabled && setOpen((p) => !p)}>▾</span>
      </div>

      {open && (
        <div style={SD.dropdown}>
          {filtered.length === 0 ? (
            <div style={SD.noResult}>No results found</div>
          ) : (
            filtered.map((o) => (
              <div
                key={o.serviceAgreementKey}
                style={{
                  ...SD.option,
                  background: o.serviceAgreementKey === value ? "#e8f4ff" : "#fff",
                  fontWeight: o.serviceAgreementKey === value ? "bold" : "normal",
                }}
                onMouseDown={() => handleSelect(o.serviceAgreementKey)}
              >
                {o.serviceAgreementNumber}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const SD = {
  fieldWrap: {
    position: "relative",
    border: "1px solid #bbb",
    borderRadius: "4px",
    padding: "18px 36px 6px 12px",
    background: "#fff",
    cursor: "text",
  },
  floatLabel: {
    position: "absolute",
    top: "6px",
    left: "12px",
    fontSize: "11px",
    color: "#777",
    pointerEvents: "none",
  },
  input: {
    width: "100%",
    border: "none",
    outline: "none",
    fontSize: "14px",
    fontFamily: "Arial, Helvetica, sans-serif",
    color: "#222",
    background: "transparent",
    padding: 0,
  },
  arrow: {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "14px",
    color: "#666",
    cursor: "pointer",
    userSelect: "none",
  },
  dropdown: {
    position: "absolute",
    top: "calc(100% + 4px)",
    left: 0,
    right: 0,
    background: "#fff",
    border: "1px solid #bbb",
    borderRadius: "4px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
    maxHeight: "240px",
    overflowY: "auto",
    zIndex: 100,
  },
  option: {
    padding: "9px 14px",
    fontSize: "13px",
    cursor: "pointer",
    borderBottom: "1px solid #f0f0f0",
  },
  noResult: {
    padding: "10px 14px",
    fontSize: "13px",
    color: "#999",
  },
};

// ─── Date Field ───────────────────────────────────────────────────────────────
function DateField({ label, value, onChange }) {
  const inputRef = useRef(null);
  return (
    <div style={{ flex: 1 }}>
      <div style={{ ...SD.fieldWrap, cursor: "pointer" }} onClick={() => inputRef.current?.click()}>
        <label style={SD.floatLabel}>{label}</label>
        <input
          ref={inputRef}
          type="date"
          style={{ ...SD.input, color: value ? "#222" : "#aaa" }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <span style={{ ...SD.arrow, fontSize: "16px", color: "#555" }}>&#128197;</span>
      </div>
    </div>
  );
}

// ─── Page Styles ──────────────────────────────────────────────────────────────
const S = {
  root: {
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: "13px",
    color: "#222",
    minHeight: "100vh",
    background: "#f4f4f4",
  },
  header: {
    background: "#1e2a38",
    padding: "0 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: "52px",
  },
  headerTitle: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#fff",
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  generateBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 18px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    fontSize: "13px",
    fontWeight: "bold",
    fontFamily: "Arial, Helvetica, sans-serif",
    cursor: "pointer",
  },
  generateBtnDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  filterCard: {
    background: "#fff",
    border: "1px solid #dde1e7",
    borderRadius: "6px",
    margin: "20px 24px",
    padding: "20px",
    display: "flex",
    gap: "16px",
    alignItems: "flex-start",
  },
  body: {
    padding: "0 24px 24px",
  },
  placeholder: {
    textAlign: "center",
    padding: "60px 20px",
    color: "#aaa",
    fontSize: "14px",
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: "4px",
  },
};

// ─── API calls ────────────────────────────────────────────────────────────────
async function fetchServiceAgreements() {
  const { data } = await axiosInstance.get("/Configuration/serviceAgreement", {
    params: { reqestFor: "LIST" },
  });
  return Array.isArray(data) ? data : [];
}

async function fetchTransactions(serviceAgreementKey, startTime, stopTime) {
  const timeZoneId = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const params = { serviceAgreementKey, timeZoneId };
  if (startTime) params.startTime = `${startTime}T00:00:00`;
  if (stopTime)  params.stopTime  = `${stopTime}T23:59:59`;

  const { data } = await axiosInstance.get("/Configuration/statementOfAccountDetails", { params });
  return Array.isArray(data) ? data : [];
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StatementOfAccountPage() {
  const [agreements, setAgreements]           = useState([]);
  const [agreementsLoading, setAgreementsLoading] = useState(true);
  const [agreementsError, setAgreementsError] = useState("");

  const [selectedKey, setSelectedKey]         = useState("");
  const [selectedAgreement, setSelectedAgreement] = useState(null);
  const [startTime, setStartTime]             = useState("");
  const [stopTime, setStopTime]               = useState("");

  const [transactions, setTransactions]       = useState([]);
  const [reportLoading, setReportLoading]     = useState(false);
  const [reportError, setReportError]         = useState("");
  const [reportReady, setReportReady]         = useState(false);

  // Load dropdown list on mount
  useEffect(() => {
    setAgreementsLoading(true);
    fetchServiceAgreements()
      .then((data) => setAgreements(data))
      .catch((err) => {
        const msg =
          err?.response?.data?.errors?.[0]?.errorMessage ||
          err?.response?.data?.title ||
          "Failed to load service agreements.";
        setAgreementsError(msg);
      })
      .finally(() => setAgreementsLoading(false));
  }, []);

  // Track selected agreement object for report meta
  useEffect(() => {
    setSelectedAgreement(agreements.find((a) => a.serviceAgreementKey === selectedKey) || null);
    setReportReady(false);
    setTransactions([]);
    setReportError("");
  }, [selectedKey, agreements]);

  async function handleGenerate() {
    if (!selectedKey) return;
    setReportLoading(true);
    setReportError("");
    setReportReady(false);
    try {
      const data = await fetchTransactions(selectedKey, startTime, stopTime);
      setTransactions(data);
      setReportReady(true);
    } catch (err) {
      const msg =
        err?.response?.data?.errors?.[0]?.errorMessage ||
        err?.response?.data?.title ||
        "Failed to load report. Please try again.";
      setReportError(msg);
    } finally {
      setReportLoading(false);
    }
  }

  const canGenerate = !!selectedKey && !reportLoading;

  return (
    <div style={S.root}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header style={S.header}>
        <h1 style={S.headerTitle}>
          <span>&#128196;</span>
          Statement Of Account Report
        </h1>
        <button
          style={{ ...S.generateBtn, ...(canGenerate ? {} : S.generateBtnDisabled) }}
          onClick={handleGenerate}
          disabled={!canGenerate}
        >
          &#128196; {reportLoading ? "Generating…" : "Generate Report"}
        </button>
      </header>

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <div style={S.filterCard}>
        {agreementsError ? (
          <span style={{ color: "#b91c1c", fontSize: "12px" }}>{agreementsError}</span>
        ) : (
          <SearchableSelect
            options={agreements}
            value={selectedKey}
            onChange={setSelectedKey}
            placeholder="Search agreement number…"
            disabled={agreementsLoading}
          />
        )}
        <DateField label="Start Time" value={startTime} onChange={setStartTime} />
        <DateField label="Stop Time"  value={stopTime}  onChange={setStopTime}  />
      </div>

      {/* ── Report Area ───────────────────────────────────────────────────── */}
      <div style={S.body}>
        {!selectedKey && !reportLoading && (
          <div style={S.placeholder}>
            Select a service agreement and click <strong>Generate Report</strong>.
          </div>
        )}

        {reportLoading && (
          <div style={S.placeholder}>Generating report…</div>
        )}

        {reportError && !reportLoading && (
          <div style={{ ...S.placeholder, color: "#b91c1c" }}>{reportError}</div>
        )}

        {reportReady && !reportLoading && transactions.length === 0 && (
          <div style={S.placeholder}>No transactions found for the selected period.</div>
        )}

        {reportReady && !reportLoading && transactions.length > 0 && (
          <StatementOfAccount
            transactions={transactions}
            unitName={selectedAgreement?.unitName ?? ""}
            consumerName={selectedAgreement?.consumerName ?? ""}
            serviceAgreementNo={selectedAgreement?.serviceAgreementNumber ?? ""}
          />
        )}
      </div>

    </div>
  );
}
