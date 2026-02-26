import { useState, useMemo } from "react";
import { formatCurrency, calculateEMI, suggestedRates } from "../utils";

/**
 * EMI Form Component
 * Handles loan input, validation, and live EMI preview.
 */
export default function EmiForm({ onCalculate }) {
    const [loanType, setLoanType] = useState("");
    const [loanAmount, setLoanAmount] = useState("");
    const [interestRate, setInterestRate] = useState("");
    const [loanTenure, setLoanTenure] = useState("");
    const [errors, setErrors] = useState({});

    // Live EMI preview calculation
    const liveEmi = useMemo(() => {
        const p = parseFloat(loanAmount);
        const r = parseFloat(interestRate);
        const t = parseInt(loanTenure);
        if (p > 0 && r > 0 && t > 0) {
            const monthlyRate = r / 12 / 100;
            const totalMonths = t * 12;
            return calculateEMI(p, monthlyRate, totalMonths);
        }
        return null;
    }, [loanAmount, interestRate, loanTenure]);

    // Auto-fill suggested interest rate on loan type change
    const handleLoanTypeChange = (value) => {
        setLoanType(value);
        if (suggestedRates[value] && !interestRate) {
            setInterestRate(String(suggestedRates[value]));
        }
        setErrors((prev) => ({ ...prev, loanType: "" }));
    };

    const validate = () => {
        const newErrors = {};

        if (!loanType) newErrors.loanType = "Please select a loan type.";

        const principal = parseFloat(loanAmount);
        if (!loanAmount || isNaN(principal) || principal <= 0) {
            newErrors.loanAmount = "Please enter a valid loan amount greater than 0.";
        }

        const rate = parseFloat(interestRate);
        if (!interestRate || isNaN(rate) || rate < 0.1 || rate > 50) {
            newErrors.interestRate = "Please enter a valid interest rate (0.1% - 50%).";
        }

        const tenure = parseInt(loanTenure);
        if (!loanTenure || isNaN(tenure) || tenure < 1 || tenure > 30) {
            newErrors.loanTenure = "Please enter tenure between 1 and 30 years.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;

        onCalculate({
            loanType,
            principal: parseFloat(loanAmount),
            annualRate: parseFloat(interestRate),
            tenureYears: parseInt(loanTenure),
        });
    };

    const handleReset = () => {
        setLoanType("");
        setLoanAmount("");
        setInterestRate("");
        setLoanTenure("");
        setErrors({});
        onCalculate(null);
    };

    return (
        <form className="form-section" onSubmit={handleSubmit} noValidate>
            <h2 className="section-title">Loan Details</h2>

            {/* Loan Type */}
            <div className="form-group">
                <label htmlFor="loanType">Loan Type</label>
                <select
                    id="loanType"
                    className={errors.loanType ? "error" : ""}
                    value={loanType}
                    onChange={(e) => handleLoanTypeChange(e.target.value)}
                >
                    <option value="" disabled>— Select Loan Type —</option>
                    <option value="home">🏠 Home Loan</option>
                    <option value="car">🚗 Car Loan</option>
                    <option value="education">🎓 Education Loan</option>
                    <option value="personal">💳 Personal Loan</option>
                </select>
                {errors.loanType && <span className="error-message">{errors.loanType}</span>}
            </div>

            {/* Loan Amount */}
            <div className="form-group">
                <label htmlFor="loanAmount">Loan Amount (₹)</label>
                <input
                    type="number"
                    id="loanAmount"
                    className={errors.loanAmount ? "error" : ""}
                    placeholder="e.g. 500000"
                    min="1"
                    value={loanAmount}
                    onChange={(e) => {
                        setLoanAmount(e.target.value);
                        setErrors((prev) => ({ ...prev, loanAmount: "" }));
                    }}
                />
                {errors.loanAmount && <span className="error-message">{errors.loanAmount}</span>}
            </div>

            {/* Interest Rate */}
            <div className="form-group">
                <label htmlFor="interestRate">Interest Rate (% per annum)</label>
                <input
                    type="number"
                    id="interestRate"
                    className={errors.interestRate ? "error" : ""}
                    placeholder="e.g. 8.5"
                    min="0.1"
                    max="50"
                    step="0.1"
                    value={interestRate}
                    onChange={(e) => {
                        setInterestRate(e.target.value);
                        setErrors((prev) => ({ ...prev, interestRate: "" }));
                    }}
                />
                {errors.interestRate && <span className="error-message">{errors.interestRate}</span>}
            </div>

            {/* Loan Tenure */}
            <div className="form-group">
                <label htmlFor="loanTenure">Loan Tenure (Years)</label>
                <input
                    type="number"
                    id="loanTenure"
                    className={errors.loanTenure ? "error" : ""}
                    placeholder="e.g. 5"
                    min="1"
                    max="30"
                    value={loanTenure}
                    onChange={(e) => {
                        setLoanTenure(e.target.value);
                        setErrors((prev) => ({ ...prev, loanTenure: "" }));
                    }}
                />
                {errors.loanTenure && <span className="error-message">{errors.loanTenure}</span>}
            </div>

            {/* Live Preview */}
            {liveEmi !== null && (
                <div className="live-preview">
                    <div className="live-dot"></div>
                    <span>Live EMI Preview</span>
                    <span className="live-value">{formatCurrency(liveEmi)}</span>
                </div>
            )}

            {/* Buttons */}
            <div className="btn-group">
                <button type="submit" id="calculateBtn" className="btn btn-primary">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-icon">
                        <rect x="4" y="2" width="16" height="20" rx="2" />
                        <line x1="8" y1="6" x2="16" y2="6" />
                        <line x1="8" y1="10" x2="16" y2="10" />
                        <line x1="8" y1="14" x2="12" y2="14" />
                    </svg>
                    Calculate EMI
                </button>
                <button type="button" className="btn btn-reset" onClick={handleReset}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-icon">
                        <polyline points="1 4 1 10 7 10" />
                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                    </svg>
                    Reset
                </button>
            </div>
        </form>
    );
}
