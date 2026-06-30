import { useState, useEffect, useRef, useCallback } from 'react';
import TaxInvoice from './TaxInvoice';
import axiosInstance from './services/axiosInstance';

// ─── Constants ────────────────────────────────────────────────────────────────
const TIMEZONE = 'Asia/Calcutta';
const DEFAULT_INVOICE_TYPE_KEY = 'A1B093AC-CF9B-47A8-BC96-F1660E9936C3';

// ─── Bill cycle helpers ───────────────────────────────────────────────────────
// Mirrors getBillCycleRange(billMonth, billStartDay) from react-js-plugins
// billMonth = "YYYY-MM" string, billStartDay = number
// stopTime  = one day before billStartDay of next month
//   e.g. billStartDay=17, June → July 16
//   e.g. billStartDay=1,  June → June 30  (new Date(y, m, 0))
function getBillCycleRange(billMonth, billStartDay) {
  const [year, month] = billMonth.split('-').map(Number);
  const stopTime = new Date(year, month, billStartDay - 1);
  return { stopTime };
}

function fmtDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getStopDate(billMonth, billCycleByEstate, estateKey) {
  if (!billMonth || !estateKey) return '';
  const billStartDay = billCycleByEstate[estateKey] ?? 1;
  const { stopTime } = getBillCycleRange(billMonth, billStartDay);
  return fmtDate(stopTime);
}

// ─── Reusable Searchable Select ───────────────────────────────────────────────
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
          style={{ ...SD.input, opacity: disabled ? 0.5 : 1 }}
          value={open ? search : (selected ? getLabel(selected) : '')}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => { setOpen(true); setSearch(''); }}
          placeholder={disabled ? '—' : (placeholder || 'Select…')}
          disabled={disabled}
          onClick={(e) => e.stopPropagation()}
        />
        <span style={SD.arrow}>▾</span>
      </div>
      {error && <div style={SD.errMsg}>{error}</div>}
      {open && !disabled && (
        <div style={SD.dropdown}>
          {filtered.length === 0
            ? <div style={SD.noResult}>No results</div>
            : filtered.map((o) => (
                <div
                  key={getKey(o)}
                  style={{ ...SD.option, background: getKey(o) === value ? '#e8f4ff' : '#fff', fontWeight: getKey(o) === value ? 'bold' : 'normal' }}
                  onMouseDown={() => { onChange(o); setOpen(false); setSearch(''); }}
                >
                  {getLabel(o)}
                </div>
              ))
          }
        </div>
      )}
    </div>
  );
}

// ─── Month Picker ─────────────────────────────────────────────────────────────
function MonthField({ label, value, onChange, disabled }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ ...SD.wrap, cursor: disabled ? 'not-allowed' : 'text' }}>
        <label style={SD.label}>{label}</label>
        <input
          type="month"
          style={{ ...SD.input, color: value ? '#222' : '#aaa', cursor: 'pointer' }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

const SD = {
  wrap: { position: 'relative', border: '1px solid #bbb', borderRadius: '4px', padding: '18px 36px 6px 12px', background: '#fff', boxSizing: 'border-box' },
  label: { position: 'absolute', top: '6px', left: '12px', fontSize: '11px', color: '#777', pointerEvents: 'none' },
  input: { width: '100%', border: 'none', outline: 'none', fontSize: '14px', fontFamily: 'Arial, Helvetica, sans-serif', color: '#222', background: 'transparent', padding: 0 },
  arrow: { position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: '#666', cursor: 'pointer', userSelect: 'none' },
  dropdown: { position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', border: '1px solid #bbb', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', maxHeight: '240px', overflowY: 'auto', zIndex: 200 },
  option: { padding: '9px 14px', fontSize: '13px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' },
  noResult: { padding: '10px 14px', fontSize: '13px', color: '#999' },
  errMsg: { fontSize: '11px', color: '#ef4444', marginTop: '3px', paddingLeft: '2px' },
};

// ─── Page Styles ──────────────────────────────────────────────────────────────
const S = {
  root: { fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '13px', color: '#222', minHeight: '100vh', background: '#f4f4f4' },
  header: { background: '#1e2a38', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '52px' },
  headerTitle: { fontSize: '16px', fontWeight: 'bold', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' },
  genBtn: (ok) => ({
    display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px',
    background: ok ? '#2563eb' : '#6b7280', color: '#fff', border: 'none', borderRadius: '4px',
    fontSize: '13px', fontWeight: 'bold', fontFamily: 'Arial, Helvetica, sans-serif',
    cursor: ok ? 'pointer' : 'not-allowed', opacity: ok ? 1 : 0.7,
  }),
  filterCard: { background: '#fff', border: '1px solid #dde1e7', borderRadius: '6px', margin: '20px 24px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' },
  filterRow: { display: 'flex', gap: '16px', alignItems: 'flex-start' },
  body: { padding: '0 24px 24px' },
  placeholder: { textAlign: 'center', padding: '60px 20px', color: '#aaa', fontSize: '14px', background: '#fff', border: '1px solid #ddd', borderRadius: '4px' },
  hint: { fontSize: '11px', color: '#555', marginTop: '4px', paddingLeft: '2px' },
};

const get = (url, params) => axiosInstance.get(url, { params }).then((r) => r.data);

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function TaxInvoicePage() {
  const [services,         setServices]         = useState([]);
  const [selectedService,  setSelectedService]  = useState(null);

  const [estates,          setEstates]          = useState([]);
  const [estatesLoading,   setEstatesLoading]   = useState(false);
  const [selectedEstate,   setSelectedEstate]   = useState(null);

  // { [estateKey]: billStartDay } — loaded once on mount
  const [billCycleByEstate, setBillCycleByEstate] = useState({});

  const [units,            setUnits]            = useState([]);
  const [unitsLoading,     setUnitsLoading]     = useState(false);
  const [selectedUnit,     setSelectedUnit]     = useState(null);

  const [agreements,       setAgreements]       = useState([]);
  const [agreementsLoading,setAgreementsLoading]= useState(false);
  const [selectedAgreement,setSelectedAgreement]= useState(null);

  const [billMonth,        setBillMonth]        = useState(''); // "YYYY-MM"

  const [invoiceTypes,     setInvoiceTypes]     = useState([]);
  const [invTypesLoading,  setInvTypesLoading]  = useState(false);
  const [selectedInvType,  setSelectedInvType]  = useState(null);

  const [errors,           setErrors]           = useState({});

  const [header,           setHeader]           = useState({});
  const [details,          setDetails]          = useState([]);
  const [reportLoading,    setReportLoading]    = useState(false);
  const [reportError,      setReportError]      = useState('');
  const [reportReady,      setReportReady]      = useState(false);

  // ── Mount: services + bill cycles ──────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      get('/Configuration/servics'),
      get('/Configuration/contractBillCycles'),
    ]).then(([svcs, cycles]) => {
      setServices(Array.isArray(svcs) ? svcs.filter((x) => x.isActive) : []);
      // Build { [estateKey]: billStartDay }, prefer isDefault entries
      const map = {};
      (Array.isArray(cycles) ? cycles : [])
        .filter((x) => x?.isActive)
        .forEach((x) => {
          if (x?.estateKey && (x.isDefault || map[x.estateKey] === undefined)) {
            map[x.estateKey] = Number(x.billStartDay) || 1;
          }
        });
      setBillCycleByEstate(map);
    }).catch(console.error);
  }, []);

  // ── fetchInvoiceType — mirrors original: calculates stopTime internally ────
  // Depends on billCycleByEstate so it always uses the latest map.
  const fetchInvoiceTypes = useCallback(async (bMonth, saKey, estKey) => {
    if (!bMonth || !saKey) {
      setInvoiceTypes([]);
      setSelectedInvType(null);
      return;
    }
    const billStartDay = estKey ? (billCycleByEstate[estKey] ?? 1) : 1;
    const { stopTime } = getBillCycleRange(bMonth, billStartDay);
    const formattedStop = fmtDate(stopTime);

    setInvTypesLoading(true);
    setInvoiceTypes([]);
    setSelectedInvType(null);
    try {
      const res = await get('/InvoiceType/invoiceTypesForReport', {
        billMonth: formattedStop,
        serviceagreementKey: saKey,
      });
      setInvoiceTypes(Array.isArray(res) ? res : []);
      console.log('res',res)
    } catch (err) {
      console.error(err);
    } finally {
      setInvTypesLoading(false);
    }
  }, [billCycleByEstate]);

  // ── Re-fetch invoice types when any dependent field changes ────────────────
  // Mirrors original useEffect deps: billMonth, serviceKey, estateKey, unitID,
  // serviceAgreementKey, billCycleByEstate
  useEffect(() => {
    if (billMonth && selectedAgreement?.serviceAgreementKey) {
      fetchInvoiceTypes(billMonth, selectedAgreement.serviceAgreementKey, selectedEstate?.estateKey);
    } else {
      setInvoiceTypes([]);
      setSelectedInvType(null);
    }
  }, [
    billMonth,
    selectedService,
    selectedEstate,
    selectedUnit,
    selectedAgreement,
    billCycleByEstate,   // re-runs once cycles load from API
    fetchInvoiceTypes,
  ]);

  // ── Derived bill date for UI hint ──────────────────────────────────────────
  const billDate = getStopDate(billMonth, billCycleByEstate, selectedEstate?.estateKey);

  // ── Service selected ───────────────────────────────────────────────────────
  const handleServiceChange = async (o) => {
    setSelectedService(o);
    setSelectedEstate(null); setSelectedUnit(null); setSelectedAgreement(null);
    setEstates([]); setUnits([]); setAgreements([]);
    setErrors((e) => ({ ...e, service: '' }));
    setReportReady(false);
    setEstatesLoading(true);
    try {
      const res = await get(`/Configuration/estatesByService/${o.serviceKey}`);
      setEstates(Array.isArray(res) ? res.filter((x) => x.isActive) : []);
    } catch (err) { console.error(err); }
    finally { setEstatesLoading(false); }
  };

  // ── Estate selected ────────────────────────────────────────────────────────
  const handleEstateChange = async (o) => {
    setSelectedEstate(o);
    setSelectedUnit(null); setSelectedAgreement(null);
    setUnits([]); setAgreements([]);
    setErrors((e) => ({ ...e, estate: '' }));
    setReportReady(false);
    setUnitsLoading(true);
    try {
      const res = await get(`/Configuration/unitsByEstateKey/${o.estateKey}`);
      setUnits(Array.isArray(res) ? res.filter((x) => x.isActive) : []);
    } catch (err) { console.error(err); }
    finally { setUnitsLoading(false); }
  };

  // ── Unit selected ──────────────────────────────────────────────────────────
  const handleUnitChange = async (o) => {
    setSelectedUnit(o);
    setSelectedAgreement(null);
    setAgreements([]);
    setErrors((e) => ({ ...e, unit: '' }));
    setReportReady(false);
    setAgreementsLoading(true);
    try {
      const res = await get(`/Configuration/serviceAgreementByUnit/${o.unitID}`);
      const all = Array.isArray(res) ? res : [];
      // Filter by selected service — mirrors original handleUnitChange
      const filtered = selectedService
        ? all.filter((sa) => sa.serviceKey === selectedService.serviceKey)
        : all;
      setAgreements(filtered);
    } catch (err) { console.error(err); }
    finally { setAgreementsLoading(false); }
  };

  // ── Generate ───────────────────────────────────────────────────────────────
  async function handleGenerate() {
    const errs = {};
    if (!selectedService)    errs.service   = 'Service is required';
    if (!selectedEstate)     errs.estate    = 'Tower is required';
    if (!selectedUnit)       errs.unit      = 'Unit is required';
    if (!selectedAgreement)  errs.agreement = 'Service Agreement is required';
    if (!billMonth)          errs.billMonth = 'Bill Month is required';
    if (!selectedInvType)    errs.invType   = 'Invoice Type is required';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setReportLoading(true);
    setReportError('');
    setReportReady(false);

    // invoiceTypeKey from API = "{invoiceTypeKey}_{invoiceStatusKey}" combined
    // Split on _ to get the two separate params for the report API
    const rawKey = selectedInvType?.invoiceTypeKey || DEFAULT_INVOICE_TYPE_KEY;
    const [invoiceTypeKey, invoiceStatusKey] = rawKey.split('_');

    const params = {
      billDate,
      serviceAgreementKey: selectedAgreement.serviceAgreementKey,
      invoiceTypeKey,
      invoiceStatusKey,   // undefined if no _ in key (e.g. DEFAULT fallback)
      timeZoneId: TIMEZONE,
      languageCode: 'en',
    };

    try {
      const [hRes, dRes] = await Promise.all([
        axiosInstance.get('/InvoiceReport/taxInvoiceReportHeader', { params }),
        axiosInstance.get('/InvoiceReport/taxInvoiceReportDetail', { params }),
      ]);
      setHeader(hRes.data || {});
      // Detail response shape: { data: [...], labels: {} }
      setDetails(Array.isArray(dRes.data?.data) ? dRes.data.data : []);
      setReportReady(true);
    } catch (err) {
      setReportError(
        err?.response?.data?.errors?.[0]?.errorMessage ||
        err?.response?.data?.title ||
        'Failed to load invoice.'
      );
    } finally {
      setReportLoading(false);
    }
  }

  const canGenerate = !!(selectedService && selectedEstate && selectedUnit && selectedAgreement && billMonth && selectedInvType && !reportLoading);

  return (
    <div style={S.root}>

      <header style={S.header}>
        <h1 style={S.headerTitle}>&#128203; Tax Invoice Report</h1>
        <button style={S.genBtn(canGenerate)} onClick={handleGenerate} disabled={!canGenerate}>
          &#128196; {reportLoading ? 'Generating…' : 'Generate Report'}
        </button>
      </header>

      <div style={S.filterCard}>

        {/* Row 1: Service | Tower | Unit | Service Agreement */}
        <div style={S.filterRow}>
          <SearchableSelect
            label="Service"
            options={services}
            value={selectedService?.serviceKey || ''}
            onChange={handleServiceChange}
            getKey={(o) => o.serviceKey}
            getLabel={(o) => o.serviceName || ''}
            error={errors.service}
          />
          <SearchableSelect
            label="Tower"
            options={estates}
            value={selectedEstate?.estateKey || ''}
            onChange={handleEstateChange}
            getKey={(o) => o.estateKey}
            getLabel={(o) => o.estateName || ''}
            disabled={!selectedService || estatesLoading}
            error={errors.estate}
          />
          <SearchableSelect
            label="Unit Name"
            options={units}
            value={selectedUnit ? String(selectedUnit.unitID) : ''}
            onChange={handleUnitChange}
            getKey={(o) => String(o.unitID)}
            getLabel={(o) => o.unitName || ''}
            disabled={!selectedEstate || unitsLoading}
            error={errors.unit}
          />
          <SearchableSelect
            label="Service Agreement No"
            options={agreements}
            value={selectedAgreement?.serviceAgreementKey || ''}
            onChange={(o) => { setSelectedAgreement(o); setErrors((e) => ({ ...e, agreement: '' })); setReportReady(false); }}
            getKey={(o) => o.serviceAgreementKey}
            getLabel={(o) => o.consumerUnitName || ''}
            disabled={!selectedUnit || agreementsLoading}
            error={errors.agreement}
          />
        </div>

        {/* Row 2: Bill Month | Invoice Type */}
        <div style={{ ...S.filterRow, maxWidth: '50%' }}>
          <div style={{ flex: 1 }}>
            <MonthField
              label="Bill Month"
              value={billMonth}
              onChange={(v) => { setBillMonth(v); setErrors((e) => ({ ...e, billMonth: '' })); setReportReady(false); }}
              disabled={!selectedEstate}
            />
            {billDate && <div style={S.hint}>Bill date: <strong>{billDate}</strong></div>}
            {errors.billMonth && <div style={SD.errMsg}>{errors.billMonth}</div>}
          </div>
          <SearchableSelect
            label="Invoice Type"
            options={invoiceTypes}
            value={selectedInvType?.invoiceTypeKey || ''}
            onChange={(o) => { setSelectedInvType(o); setErrors((e) => ({ ...e, invType: '' })); setReportReady(false); }}
            getKey={(o) => o.invoiceTypeKey}
            getLabel={(o) => o.invoiceTypeName || ''}
            disabled={!selectedAgreement || !billMonth || invTypesLoading}
            error={errors.invType}
          />
        </div>

      </div>

      <div style={S.body}>
        {!reportLoading && !reportReady && !reportError && (
          <div style={S.placeholder}>Fill in all filters and click <strong>Generate Report</strong>.</div>
        )}
        {reportLoading && <div style={S.placeholder}>Generating invoice…</div>}
        {reportError && !reportLoading && (
          <div style={{ ...S.placeholder, color: '#b91c1c' }}>{reportError}</div>
        )}
        {reportReady && !reportLoading && (
          <TaxInvoice header={header} details={details} />
        )}
      </div>

    </div>
  );
}
