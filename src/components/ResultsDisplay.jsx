import { formatCurrency } from "../utils";

/**
 * Results Display Component
 * Shows EMI summary cards and a donut chart breakdown.
 */
export default function ResultsDisplay({ data }) {
    if (!data) return null;

    const { emi, totalPayment, totalInterest, principal } = data;

    // Donut chart calculations
    const total = principal + totalInterest;
    const principalPercent = (principal / total) * 100;
    const interestPercent = (totalInterest / total) * 100;

    // SVG circle parameters
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const principalDash = (principalPercent / 100) * circumference;
    const interestDash = (interestPercent / 100) * circumference;

    return (
        <section className="results-section">
            <h2 className="section-title">EMI Summary</h2>

            {/* Result Cards */}
            <div className="result-cards">
                <div className="result-card card-emi" style={{ animationDelay: "0s" }}>
                    <span className="result-label">Monthly EMI</span>
                    <span id="monthlyEmi" className="result-value">{formatCurrency(emi)}</span>
                </div>
                <div className="result-card card-total" style={{ animationDelay: "0.1s" }}>
                    <span className="result-label">Total Payment</span>
                    <span id="totalPayment" className="result-value">{formatCurrency(totalPayment)}</span>
                </div>
                <div className="result-card card-interest" style={{ animationDelay: "0.2s" }}>
                    <span className="result-label">Total Interest</span>
                    <span id="totalInterest" className="result-value">{formatCurrency(totalInterest)}</span>
                </div>
            </div>

            {/* Donut Chart */}
            <div className="chart-container">
                <div className="donut-chart">
                    <svg viewBox="0 0 200 200">
                        {/* Interest arc */}
                        <circle
                            cx="100"
                            cy="100"
                            r={radius}
                            stroke="#f59e0b"
                            strokeDasharray={`${circumference} ${circumference}`}
                            strokeDashoffset="0"
                            strokeLinecap="round"
                        />
                        {/* Principal arc */}
                        <circle
                            cx="100"
                            cy="100"
                            r={radius}
                            stroke="#6366f1"
                            strokeDasharray={`${principalDash} ${circumference - principalDash}`}
                            strokeDashoffset="0"
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="donut-center">
                        <div className="donut-amount">{formatCurrency(totalPayment)}</div>
                        <div className="donut-label">Total Payment</div>
                    </div>
                </div>

                <div className="chart-legend">
                    <div className="legend-item">
                        <span className="legend-dot" style={{ background: "#6366f1" }}></span>
                        Principal
                        <span className="legend-value">{principalPercent.toFixed(1)}%</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-dot" style={{ background: "#f59e0b" }}></span>
                        Interest
                        <span className="legend-value">{interestPercent.toFixed(1)}%</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
