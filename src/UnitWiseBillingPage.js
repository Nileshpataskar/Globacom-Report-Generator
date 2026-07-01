import { useState, useEffect, useRef } from 'react';
import axiosInstance from './services/axiosInstance';
import UnitWiseBillingReport from './UnitWiseBillingReport';

// Date helpers — convert picker value (YYYY-MM-DD) to API UTC timestamps using local timezone
// (matches original: moment(date).startOf('day').utc() / moment(date).endOf('day').utc())
function toApiFromDate(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`); // local midnight
  return d.toISOString().replace('.000Z', '.000Z'); // already ISO UTC
}
function toApiToDate(dateStr) {
  const d = new Date(`${dateStr}T23:59:59`); // local end-of-day
  return d.toISOString().replace('.999Z', '.999Z');
}

// ─── Searchable Select ────────────────────────────────────────────────────────
function SearchableSelect({ label, options, value, onChange, getKey, getLabel, placeholder, disabled }) {
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

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1 }}>
      <div
        style={{ ...SD.wrap, cursor: disabled ? 'not-allowed' : 'pointer' }}
        onClick={() => !disabled && setOpen((p) => !p)}
      >
        <label style={SD.label}>{label}</label>
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
function DateField({ label, value, onChange }) {
  const inputRef = useRef(null);
  return (
    <div style={{ flex: 1 }}>
      <div style={{ ...SD.wrap, cursor: 'pointer' }} onClick={() => inputRef.current?.click()}>
        <label style={SD.label}>{label}</label>
        <input
          ref={inputRef}
          type="date"
          style={{ ...SD.input, color: value ? '#222' : '#aaa', cursor: 'pointer' }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <span style={{ ...SD.arrow, fontSize: '16px', color: '#555' }}>&#128197;</span>
      </div>
    </div>
  );
}

// ─── Multi-select checkboxes (Bill Post Status) ───────────────────────────────
function MultiCheckField({ label, options, selected, onChange }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ ...SD.wrap, padding: '8px 12px', minHeight: '52px' }}>
        <label style={{ ...SD.label, position: 'static', display: 'block', marginBottom: '6px' }}>{label}</label>
        <div style={{ display: 'flex', gap: '16px' }}>
          {options.map((o) => (
            <label key={o.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={selected.includes(o.id)}
                onChange={(e) => {
                  if (e.target.checked) onChange([...selected, o.id]);
                  else onChange(selected.filter((v) => v !== o.id));
                }}
                style={{ cursor: 'pointer' }}
              />
              {o.name}
            </label>
          ))}
        </div>
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
            <option key={String(o.id)} value={String(o.id)}>{o.name}</option>
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

// Mirrors original: bill post status ids
const BILL_POST_OPTIONS = [
  { id: 0, name: 'Unposted' },
  { id: 1, name: 'Posted' },
];

export default function UnitWiseBillingPage() {
  const [estates,        setEstates]        = useState([]);
  const [estatesLoading, setEstatesLoading] = useState(true);
  const [selectedEstate, setSelectedEstate] = useState(null);

  const [fromDate, setFromDate] = useState('');
  const [toDate,   setToDate]   = useState('');

  // Multi-select: array of ids (0=Unposted, 1=Posted)
  const [postStatus, setPostStatus] = useState([]);

  // isBillMonthWiseReport: mirrors original SelectField
  const [billMonthWise, setBillMonthWise] = useState('true');

  const [rows,          setRows]          = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError,   setReportError]   = useState('');
  const [reportReady,   setReportReady]   = useState(false);

  // Mirrors original billingOptions logic:
  // only show "Bill Post Month" when only Posted is selected
  const onlyPostedSelected = postStatus.length === 1 && postStatus[0] === 1;
  const billingOptions = onlyPostedSelected
    ? [{ id: 'true', name: 'Bill Month' }, { id: 'false', name: 'Bill Post Month' }]
    : [{ id: 'true', name: 'Bill Month' }];

  // Reset billMonthWise to true when options collapse back to one
  useEffect(() => {
    if (!onlyPostedSelected) setBillMonthWise('true');
  }, [onlyPostedSelected]);

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
      // Mirrors original isBillPost logic exactly:
      // only-Posted → true, only-Unposted → false, both or none → null (omit)
      let isBillPost = null;
      if (postStatus.length === 1) {
        isBillPost = postStatus[0] === 1;
      }

      const params = {
        estateKey:             selectedEstate.estateKey,
        fromDate:              toApiFromDate(fromDate),
        toDate:                toApiToDate(toDate),
        isBillMonthWiseReport: billMonthWise === 'true',
      };
      if (isBillPost !== null) params.isBillPost = isBillPost;

      // Use relative path through axiosInstance (portal base URL) — same pattern as TaxInvoice
      const { data } = await axiosInstance.get('/MISReports/unitWiseBillingReport', { params });
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
          label="Tower Name"
          options={estates}
          value={selectedEstate?.estateKey || ''}
          onChange={(o) => { setSelectedEstate(o); setReportReady(false); setRows([]); }}
          getKey={(o) => o.estateKey}
          getLabel={(o) => o.estateName}
          placeholder="Select tower…"
          disabled={estatesLoading}
        />
        <MultiCheckField
          label="Bill Post Status"
          options={BILL_POST_OPTIONS}
          selected={postStatus}
          onChange={setPostStatus}
        />
        <SimpleSelect
          label="Billing Option"
          options={billingOptions}
          value={billMonthWise}
          onChange={setBillMonthWise}
        />
        <DateField label="From Date" value={fromDate} onChange={setFromDate} />
        <DateField label="To Date"   value={toDate}   onChange={setToDate}   />
      </div>

      <div style={S.body}>
        {!reportReady && !reportLoading && !reportError && (
          <div style={S.placeholder}>
            Select a tower and date range, then click <strong>Generate Report</strong>.
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
