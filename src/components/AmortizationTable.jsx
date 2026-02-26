import { formatCurrency } from "../utils";

/**
 * Amortization Table Component
 * Displays the month-by-month loan repayment schedule.
 */
export default function AmortizationTable({ schedule }) {
    if (!schedule || schedule.length === 0) return null;

    return (
        <section className="amortization-section">
            <h2 className="section-title">
                Loan Amortization Schedule
                <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "var(--text-muted)", marginLeft: "12px" }}>
                    ({schedule.length} months)
                </span>
            </h2>
            <div className="table-wrapper">
                <table className="amortization-table">
                    <thead>
                        <tr>
                            <th>Month</th>
                            <th>EMI (₹)</th>
                            <th>Principal (₹)</th>
                            <th>Interest (₹)</th>
                            <th>Balance (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {schedule.map((row) => (
                            <tr
                                key={row.month}
                                style={{ animationDelay: `${row.month * 0.015}s` }}
                            >
                                <td>{row.month}</td>
                                <td>{formatCurrency(row.emi)}</td>
                                <td>{formatCurrency(row.principalPayment)}</td>
                                <td>{formatCurrency(row.interestPayment)}</td>
                                <td>{formatCurrency(row.balance)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
