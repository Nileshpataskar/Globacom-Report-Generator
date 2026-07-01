import { useState, useEffect, useRef } from 'react';
import axiosInstance from './services/axiosInstance';
import UnitWiseBillingReport from './UnitWiseBillingReport';

const MIS_BASE = process.env.REACT_APP_MIS_BASE_URL || 'https://globatech.net/RelayCSPAmalCommunityPreProd/api';

const BILL_POST_OPTIONS = [
  { label: 'Both',     value: 'both' },
  { label: 'Posted',   value: 'posted' },
  { label: 'Unposted', value: 'unposted' },
];

function toApiFromDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const prev = new Date(Date.UTC(y, m - 1, d - 1));
  const y2 = prev.getUTCFullYear();
  const m2 = String(prev.getUTCMonth() + 1).padStart(2, '0');
  const d2 = String(prev.getUTCDate()).padStart(2, '0');
  return `${y2}-${m2}-${d2}T18:30:00.000Z`;
}

function toApiToDate(dateStr) {
  return `${dateStr}T18:29:59.999Z`;
}

// ─── Searchable Select ────────────────────────────────────────────────────────
function SearchableSelect({ label, options, value, onChange, getKey, getLabel, placeholder, disabled, error }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  const selected = options.find((o) => getKey(o) === value);
  const filtered = options.filter((o) =>
    (getLabel(o) || '').toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function close(e) {
      if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setSearch(''); }
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const border = error ? '#ef4444' : open ? '#2563eb' : '#bbb';

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1 }}>
      <div
        style={{ ...SD.wrap, borderColor: border, cursor: disabled ? 'not-allowed' : 'pointer' }}
        onClick={() => !disabled && setOpen((p) => !p)}
      >
        <label style={{ ...SD.label, color: error ? '#ef4444' : '#777' }}>{label}</label>
        <input
          style={{ ...SD.input, cursor: disabled ? 'not-allowed' : 'text' }}
          value={open ? search : (selected ? getLabel(selected) : '')}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => { if (!disabled) { setOpen(true); setSearch(''); } }}
          placeholder={disabled ? 'Loading…' : placeholder}
          readOnly={!open}
          disabled={disabled}
        />
        <span style={SD.arrow}>▾</span>
      </div>

      {open && !disabled && (
        <div style={SD.dropdown}>
          {filtered.length === 0 ? (
            <div style={SD.noResult}>No results found</div>
          ) : (
            filtered.map((o) => (
              <div
                key={getKey(o)}
                style={{ ...SD.option, background: getKey(o) === value ? '#e8f4ff' : '#fff', fontWeight: getKey(o) === value ? 'bold' : 'normal' }}
                onMouseDown={() => { onChange(o); setOpen(false); setSearch(''); }}
              >
                {getLabel(o)}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Date Field ───────────────────────────────────────────────────────────────
function DateField({ label, value, onChange, disabled }) {
  const inputRef = useRef(null);
  return (
    <div style={{ flex: 1 }}>
      <div
        style={{ ...SD.wrap, cursor: disabled ? 'not-allowed' : 'pointer' }}
        onClick={() => inputRef.current?.click()}
      >
        <label style={SD.label}>{label}</label>
        <input
          ref={inputRef}
          type="date"
          style={{ ...SD.input, color: value ? '#222' : '#aaa', cursor: 'pointer' }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
        <span style={{ ...SD.arrow, fontSize: '16px', color: '#555' }}>&#128197;</span>
      </div>
    </div>
  );
}

// ─── Simple Select ────────────────────────────────────────────────────────────
function SimpleSelect({ label, options, value, onChange }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={SD.wrap}>
        <label style={SD.label}>{label}</label>
        <select
          style={{ ...SD.input, cursor: 'pointer', background: 'transparent' }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

const SD = {
  wrap: {
    position: 'relative',
    border: '1px solid #bbb',
    borderRadius: '4px',
    padding: '18px 36px 6px 12px',
    background: '#fff',
  },
  label: {
    position: 'absolute',
    top: '6px',
    left: '12px',
    fontSize: '11px',
    color: '#777',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    border: 'none',
    outline: 'none',
    fontSize: '14px',
    fontFamily: 'Arial, Helvetica, sans-serif',
    color: '#222',
    background: 'transparent',
    padding: 0,
  },
  arrow: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '14px',
    color: '#666',
    cursor: 'pointer',
    userSelect: 'none',
    pointerEvents: 'none',
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    right: 0,
    background: '#fff',
    border: '1px solid #bbb',
    borderRadius: '4px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
    maxHeight: '240px',
    overflowY: 'auto',
    zIndex: 100,
  },
  option: {
    padding: '9px 14px',
    fontSize: '13px',
    cursor: 'pointer',
    borderBottom: '1px solid #f0f0f0',
  },
  noResult: {
    padding: '10px 14px',
    fontSize: '13px',
    color: '#999',
  },
};

const S = {
  root: {
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: '13px',
    color: '#222',
    minHeight: '100vh',
    background: '#f4f4f4',
  },
  header: {
    background: '#1e2a38',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '52px',
  },
  headerTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#fff',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  generateBtn: (ok) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 18px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: 'bold',
    fontFamily: 'Arial, Helvetica, sans-serif',
    cursor: ok ? 'pointer' : 'not-allowed',
    opacity: ok ? 1 : 0.6,
  }),
  filterCard: {
    background: '#fff',
    border: '1px solid #dde1e7',
    borderRadius: '6px',
    margin: '20px 24px',
    padding: '20px',
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  body: { padding: '0 0 24px' },
  placeholder: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#aaa',
    fontSize: '14px',
    background: '#fff',
    border: '1px solid #ddd',
    borderRadius: '4px',
    margin: '0 24px',
  },
};

export default function UnitWiseBillingPage() {
  const [estates,        setEstates]        = useState([]);
  const [estatesLoading, setEstatesLoading] = useState(true);
  const [selectedEstate, setSelectedEstate] = useState(null);

  const [fromDate, setFromDate] = useState('');
  const [toDate,   setToDate]   = useState('');
  const [billPost, setBillPost] = useState('both');

  const [rows,         setRows]         = useState([]);
  const [reportLoading,setReportLoading]= useState(false);
  const [reportError,  setReportError]  = useState('');
  const [reportReady,  setReportReady]  = useState(false);

  useEffect(() => {
    axiosInstance.get('/Configuration/estates', { params: { reqestFor: 'LIST' } })
      .then((r) => setEstates(Array.isArray(r.data) ? r.data : []))
      .catch(() => setEstates([]))
      .finally(() => setEstatesLoading(false));
  }, []);

  async function handleGenerate() {
    if (!selectedEstate || !fromDate || !toDate) return;
    setReportLoading(true);
    setReportError('');
    setReportReady(false);
    try {
      const params = {
        estateKey:             selectedEstate.estateKey,
        fromDate:              toApiFromDate(fromDate),
        toDate:                toApiToDate(toDate),
        isBillMonthWiseReport: true,
      };
      if (billPost === 'posted')   params.isBillPost = true;
      if (billPost === 'unposted') params.isBillPost = false;

      const { data } = await axiosInstance.get(`${MIS_BASE}/MISReports/unitWiseBillingReport`, { params });
      const result = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
      setRows(result);
      setReportReady(true);
    } catch (err) {
      const msg =
        err?.response?.data?.errors?.[0]?.errorMessage ||
        err?.response?.data?.title ||
        'Failed to load report. Please try again.';
      setReportError(msg);
    } finally {
      setReportLoading(false);
    }
  }

  const canGenerate = !!selectedEstate && !!fromDate && !!toDate && !reportLoading;

  return (
    <div style={S.root}>

      <header style={S.header}>
        <h1 style={S.headerTitle}>
          <span>&#128196;</span>
          Unit Wise Billing Report
        </h1>
        <button
          style={S.generateBtn(canGenerate)}
          onClick={handleGenerate}
          disabled={!canGenerate}
        >
          &#128196; {reportLoading ? 'Generating…' : 'Generate Report'}
        </button>
      </header>

      <div style={S.filterCard}>
        <SearchableSelect
          label="Estate"
          options={estates}
          value={selectedEstate?.estateKey || ''}
          onChange={(o) => { setSelectedEstate(o); setReportReady(false); setRows([]); }}
          getKey={(o) => o.estateKey}
          getLabel={(o) => o.estateName}
          placeholder="Select estate…"
          disabled={estatesLoading}
        />
        <DateField label="From Date" value={fromDate} onChange={setFromDate} />
        <DateField label="To Date"   value={toDate}   onChange={setToDate}   />
        <SimpleSelect
          label="Bill Post Status"
          options={BILL_POST_OPTIONS}
          value={billPost}
          onChange={setBillPost}
        />
      </div>

      <div style={S.body}>
        {!reportReady && !reportLoading && !reportError && (
          <div style={S.placeholder}>
            Select an estate and date range, then click <strong>Generate Report</strong>.
          </div>
        )}

        {reportLoading && (
          <div style={S.placeholder}>Generating report…</div>
        )}

        {reportError && !reportLoading && (
          <div style={{ ...S.placeholder, color: '#b91c1c' }}>{reportError}</div>
        )}

        {reportReady && !reportLoading && rows.length === 0 && (
          <div style={S.placeholder}>No data found for the selected filters.</div>
        )}

        {reportReady && !reportLoading && rows.length > 0 && (
          <UnitWiseBillingReport
            rows={rows}
            estateName={selectedEstate?.estateName || ''}
            fromDate={fromDate}
            toDate={toDate}
          />
        )}
      </div>

    </div>
  );
}
