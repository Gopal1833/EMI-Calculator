import { useState, useMemo } from "react";
import { calculateEMI, formatCurrency, loanLabels, suggestedRates } from "../utils";

/**
 * Loan Comparison Component
 * Allows side-by-side comparison of two loan scenarios.
 */
export default function LoanCompare() {
    const [loanA, setLoanA] = useState({
        loanType: "home",
        amount: "2000000",
        rate: "8.5",
        tenure: "20",
    });

    const [loanB, setLoanB] = useState({
        loanType: "home",
        amount: "2000000",
        rate: "9.5",
        tenure: "15",
    });

    const calcLoan = (loan) => {
        const p = parseFloat(loan.amount);
        const r = parseFloat(loan.rate);
        const t = parseInt(loan.tenure);
        if (p > 0 && r > 0 && t > 0) {
            const monthlyRate = r / 12 / 100;
            const totalMonths = t * 12;
            const emi = calculateEMI(p, monthlyRate, totalMonths);
            const totalPayment = emi * totalMonths;
            const totalInterest = totalPayment - p;
            return { emi, totalPayment, totalInterest, totalMonths };
        }
        return null;
    };

    const resultA = useMemo(() => calcLoan(loanA), [loanA]);
    const resultB = useMemo(() => calcLoan(loanB), [loanB]);

    const winner = useMemo(() => {
        if (resultA && resultB) {
            const savingsA = resultA.totalInterest;
            const savingsB = resultB.totalInterest;
            if (savingsA < savingsB) return { name: "Loan A", savings: savingsB - savingsA };
            if (savingsB < savingsA) return { name: "Loan B", savings: savingsA - savingsB };
            return null;
        }
        return null;
    }, [resultA, resultB]);

    const handleTypeChange = (setter, value) => {
        setter((prev) => ({
            ...prev,
            loanType: value,
            rate: String(suggestedRates[value] || prev.rate),
        }));
    };

    const renderColumn = (loan, setLoan, label) => (
        <div className="compare-column">
            <div className="compare-column-title">{label}</div>

            <div className="form-group">
                <label>Loan Type</label>
                <select value={loan.loanType} onChange={(e) => handleTypeChange(setLoan, e.target.value)}>
                    {Object.entries(loanLabels).map(([key, name]) => (
                        <option key={key} value={key}>{name}</option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label>Loan Amount (₹)</label>
                <input
                    type="number"
                    placeholder="e.g. 2000000"
                    value={loan.amount}
                    onChange={(e) => setLoan((prev) => ({ ...prev, amount: e.target.value }))}
                />
            </div>

            <div className="form-group">
                <label>Interest Rate (%)</label>
                <input
                    type="number"
                    placeholder="e.g. 8.5"
                    step="0.1"
                    value={loan.rate}
                    onChange={(e) => setLoan((prev) => ({ ...prev, rate: e.target.value }))}
                />
            </div>

            <div className="form-group">
                <label>Tenure (Years)</label>
                <input
                    type="number"
                    placeholder="e.g. 20"
                    value={loan.tenure}
                    onChange={(e) => setLoan((prev) => ({ ...prev, tenure: e.target.value }))}
                />
            </div>
        </div>
    );

    const renderResults = (result, label) => {
        if (!result) return null;
        return (
            <div className="compare-results">
                <div className="compare-row">
                    <span className="compare-row-label">Monthly EMI</span>
                    <span className="compare-row-value highlight-emi">{formatCurrency(result.emi)}</span>
                </div>
                <div className="compare-row">
                    <span className="compare-row-label">Total Payment</span>
                    <span className="compare-row-value highlight-total">{formatCurrency(result.totalPayment)}</span>
                </div>
                <div className="compare-row">
                    <span className="compare-row-label">Total Interest</span>
                    <span className="compare-row-value highlight-interest">{formatCurrency(result.totalInterest)}</span>
                </div>
                <div className="compare-row">
                    <span className="compare-row-label">Duration</span>
                    <span className="compare-row-value">{result.totalMonths} months</span>
                </div>
            </div>
        );
    };

    return (
        <section className="compare-section">
            <h2 className="section-title">Compare Loan Scenarios</h2>

            <div className="compare-grid">
                {renderColumn(loanA, setLoanA, "Loan A")}
                {renderColumn(loanB, setLoanB, "Loan B")}
            </div>

            {(resultA || resultB) && (
                <>
                    <h2 className="section-title" style={{ marginTop: "32px" }}>Comparison Results</h2>
                    <div className="compare-grid">
                        <div className="compare-column">{renderResults(resultA, "Loan A")}</div>
                        <div className="compare-column">{renderResults(resultB, "Loan B")}</div>
                    </div>
                </>
            )}

            {winner && (
                <div className="compare-winner">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    {winner.name} saves you {formatCurrency(winner.savings)} in total interest!
                </div>
            )}
        </section>
    );
}
