import { useState } from "react";
import StatementOfAccountPage from "./reportPage";
import TaxInvoicePage from "./TaxInvoicePage";
import UnitWiseBillingPage from "./UnitWiseBillingPage";
import TowerWiseCollectionPage from "./TowerWiseCollectionPage";
import LoginPage from "./LoginPage";
import { isAuthenticated, clearTokens } from "./services/authService";

const MENU = [
  { id: "tax-invoice",          label: "Tax Invoice" },
  { id: "statement-of-account", label: "Statement of Account" },
  { id: "unit-wise-billing",    label: "Unit Wise Billing Report" },
  { id: "collection-report",    label: "Collection Report" },
];

const S = {
  app: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "Arial, Helvetica, sans-serif",
    background: "#f4f4f4",
  },
  sidebar: {
    width: "220px",
    minWidth: "220px",
    background: "#1e2a38",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
  },
  sidebarLogo: {
    padding: "20px 18px 16px",
    fontSize: "14px",
    fontWeight: "bold",
    borderBottom: "1px solid #2e3d50",
    letterSpacing: "0.02em",
    color: "#c9d6e3",
  },
  nav: {
    flex: 1,
    paddingTop: "8px",
  },
  navItem: (active) => ({
    display: "block",
    width: "100%",
    padding: "11px 18px",
    border: "none",
    background: active ? "#2e4a6b" : "transparent",
    color: active ? "#fff" : "#a8bdd0",
    textAlign: "left",
    fontSize: "13px",
    cursor: "pointer",
    borderLeft: active ? "3px solid #4c9ede" : "3px solid transparent",
    fontFamily: "Arial, Helvetica, sans-serif",
    transition: "background 0.15s",
  }),
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "auto",
  },
  placeholder: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#aaa",
    fontSize: "15px",
  },
};

// function PlaceholderPage({ title }) {
//   return (
//     <div style={S.placeholder}>
//       {title} — coming soon
//     </div>
//   );
// }

export default function App() {
  const [loggedIn, setLoggedIn] = useState(isAuthenticated());
  const [active, setActive] = useState("tax-invoice");

  if (!loggedIn) {
    return <LoginPage onLoginSuccess={() => setLoggedIn(true)} />;
  }

  function handleLogout() {
    clearTokens();
    setLoggedIn(false);
  }

  return (
    <div style={S.app}>
      <aside style={S.sidebar}>
        <div style={S.sidebarLogo}>Globacom Report Generator</div>
        <nav style={S.nav}>
          {MENU.map((item) => (
            <button
              key={item.id}
              style={S.navItem(active === item.id)}
              onClick={() => setActive(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          style={{
            margin: "16px",
            padding: "8px 12px",
            background: "transparent",
            border: "1px solid #3a5068",
            borderRadius: "4px",
            color: "#a8bdd0",
            fontSize: "12px",
            cursor: "pointer",
            fontFamily: "Arial, Helvetica, sans-serif",
          }}
        >
          Sign Out
        </button>
      </aside>

      <main style={S.main}>
        {active === "tax-invoice"          && <TaxInvoicePage />}
        {active === "statement-of-account" && <StatementOfAccountPage />}
        {active === "unit-wise-billing"    && <UnitWiseBillingPage />}
        {active === "collection-report"    && <TowerWiseCollectionPage />}
      </main>
    </div>
  );
}
