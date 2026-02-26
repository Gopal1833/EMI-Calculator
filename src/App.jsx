import { useState, useCallback, useEffect } from "react";
import EmiForm from "./components/EmiForm";
import ResultsDisplay from "./components/ResultsDisplay";
import AmortizationTable from "./components/AmortizationTable";
import LoanCompare from "./components/LoanCompare";
import {
  calculateEMI,
  formatCurrency,
  generateAmortizationData,
  downloadPDFReport,
  loanLabels,
} from "./utils";

/**
 * Main App Component
 * Manages global state, theme, tabs, and orchestrates all child components.
 */
export default function App() {
  // ===== Theme State =====
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("emi-theme") || "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("emi-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  // ===== Tab State =====
  const [activeTab, setActiveTab] = useState("calculator");

  // ===== Calculation State =====
  const [result, setResult] = useState(null);
  const [schedule, setSchedule] = useState([]);

  // ===== Handle Calculation =====
  const handleCalculate = useCallback((formData) => {
    if (!formData) {
      setResult(null);
      setSchedule([]);
      return;
    }

    const { loanType, principal, annualRate, tenureYears } = formData;
    const monthlyRate = annualRate / 12 / 100;
    const totalMonths = tenureYears * 12;
    const emi = calculateEMI(principal, monthlyRate, totalMonths);
    const totalPayment = emi * totalMonths;
    const totalInterest = totalPayment - principal;

    const calcResult = {
      loanType: loanLabels[loanType],
      principal,
      annualRate,
      tenureYears,
      totalMonths,
      emi,
      totalPayment,
      totalInterest,
    };

    const amortization = generateAmortizationData(principal, monthlyRate, totalMonths, emi);

    setResult(calcResult);
    setSchedule(amortization);

    // Smooth scroll to results
    setTimeout(() => {
      const el = document.querySelector(".results-section");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, []);

  // ===== Handle PDF Download =====
  const handleDownload = async () => {
    if (!result) return;
    await downloadPDFReport(result, schedule);
  };

  return (
    <>
      {/* Background Animated Blobs */}
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>
      <div className="bg-blob blob-3"></div>

      {/* Main Container */}
      <div className="container">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <div className="logo">
              <svg className="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <h1>Smart Loan EMI Calculator</h1>
            </div>
            <p className="subtitle">Plan your finances with precision — calculate EMI, total interest &amp; more.</p>
          </div>

          {/* Theme Toggle */}
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme" title="Toggle dark/light theme">
            {theme === "dark" ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </header>

        {/* Tab Navigation */}
        <nav className="tab-nav">
          <button
            className={`tab-btn ${activeTab === "calculator" ? "active" : ""}`}
            onClick={() => setActiveTab("calculator")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="2" width="16" height="20" rx="2" />
              <line x1="8" y1="6" x2="16" y2="6" />
              <line x1="8" y1="10" x2="16" y2="10" />
              <line x1="8" y1="14" x2="12" y2="14" />
            </svg>
            Calculator
          </button>
          <button
            className={`tab-btn ${activeTab === "compare" ? "active" : ""}`}
            onClick={() => setActiveTab("compare")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            Compare
          </button>
        </nav>

        {/* Calculator Tab */}
        {activeTab === "calculator" && (
          <>
            <main className="calculator-card">
              <EmiForm onCalculate={handleCalculate} />
              <ResultsDisplay data={result} />

              {/* Download PDF Button */}
              {result && (
                <button id="downloadBtn" className="btn btn-secondary" onClick={handleDownload}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-icon">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download EMI Report (PDF)
                </button>
              )}
            </main>

            {/* Amortization Table */}
            <AmortizationTable schedule={schedule} />
          </>
        )}

        {/* Compare Tab */}
        {activeTab === "compare" && <LoanCompare />}

        {/* Footer */}
        <footer className="footer">
          <p>&copy; 2026 Smart Loan EMI Calculator. Built with React.</p>
        </footer>
      </div>
    </>
  );
}
