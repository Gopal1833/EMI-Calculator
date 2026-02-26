/**
 * ============================================================
 * EMI CALCULATOR — Utility Functions
 * ============================================================
 * Pure utility functions for EMI calculation, currency formatting,
 * amortization schedule generation, and PDF report export.
 * ============================================================
 */

// ===== Loan Type Labels =====
export const loanLabels = {
    home: "Home Loan",
    car: "Car Loan",
    education: "Education Loan",
    personal: "Personal Loan",
};

// ===== Suggested Interest Rates =====
export const suggestedRates = {
    home: 8.5,
    car: 9.5,
    education: 10.5,
    personal: 14.0,
};

/**
 * Calculates Equated Monthly Installment (EMI).
 * Formula: EMI = (P × R × (1+R)^N) / ((1+R)^N − 1)
 *
 * @param {number} P - Principal loan amount
 * @param {number} R - Monthly interest rate (decimal)
 * @param {number} N - Total number of monthly installments
 * @returns {number} Monthly EMI amount
 */
export function calculateEMI(P, R, N) {
    if (R === 0) return P / N;
    const factor = Math.pow(1 + R, N);
    return (P * R * factor) / (factor - 1);
}

/**
 * Formats a number as Indian Rupee currency string.
 * Example: 50000 → "₹50,000.00"
 *
 * @param {number} amount - The numeric amount
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount) {
    if (isNaN(amount) || !isFinite(amount)) return "₹0.00";
    return (
        "₹" +
        amount.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })
    );
}

/**
 * Generates amortization schedule data.
 *
 * @param {number} principal   - Original loan amount
 * @param {number} monthlyRate - Monthly interest rate (decimal)
 * @param {number} totalMonths - Total installment count
 * @param {number} emi         - Calculated EMI value
 * @returns {Array} Array of monthly breakdown objects
 */
export function generateAmortizationData(principal, monthlyRate, totalMonths, emi) {
    const schedule = [];
    let balance = principal;

    for (let month = 1; month <= totalMonths; month++) {
        const interestPayment = balance * monthlyRate;
        const principalPayment = emi - interestPayment;
        balance -= principalPayment;
        if (balance < 0) balance = 0;

        schedule.push({
            month,
            emi,
            principalPayment,
            interestPayment,
            balance,
        });
    }
    return schedule;
}

/**
 * Generates and downloads a PDF report using jsPDF.
 *
 * @param {Object} data - Calculation data
 * @param {Array} schedule - Amortization schedule
 */
export async function downloadPDFReport(data, schedule) {
    const { jsPDF } = await import("jspdf");
    await import("jspdf-autotable");

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // --- Title ---
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(99, 102, 241);
    doc.text("Smart Loan EMI Report", pageWidth / 2, 22, { align: "center" });

    // --- Decorative line ---
    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(0.5);
    doc.line(20, 28, pageWidth - 20, 28);

    // --- Loan Details ---
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(50, 50, 50);
    doc.text("Loan Details", 20, 40);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);

    const details = [
        ["Loan Type", data.loanType],
        ["Principal Amount", formatCurrency(data.principal)],
        ["Annual Interest Rate", data.annualRate + "%"],
        ["Tenure", data.tenureYears + " Years (" + data.totalMonths + " Months)"],
    ];

    let yPos = 48;
    details.forEach(([label, value]) => {
        doc.setFont("helvetica", "bold");
        doc.text(label + ":", 20, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(String(value), 85, yPos);
        yPos += 8;
    });

    // --- EMI Summary ---
    yPos += 6;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(50, 50, 50);
    doc.text("EMI Summary", 20, yPos);
    yPos += 10;

    doc.setFontSize(11);
    const summary = [
        ["Monthly EMI", formatCurrency(data.emi)],
        ["Total Payment", formatCurrency(data.totalPayment)],
        ["Total Interest", formatCurrency(data.totalInterest)],
    ];

    summary.forEach(([label, value]) => {
        doc.setFont("helvetica", "bold");
        doc.text(label + ":", 20, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(value, 85, yPos);
        yPos += 8;
    });

    // --- Amortization Table ---
    yPos += 8;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(50, 50, 50);
    doc.text("Amortization Schedule", 20, yPos);

    const tableRows = schedule.map((row) => [
        String(row.month),
        formatCurrency(row.emi),
        formatCurrency(row.principalPayment),
        formatCurrency(row.interestPayment),
        formatCurrency(row.balance),
    ]);

    doc.autoTable({
        startY: yPos + 6,
        head: [["Month", "EMI (₹)", "Principal (₹)", "Interest (₹)", "Balance (₹)"]],
        body: tableRows,
        theme: "grid",
        headStyles: {
            fillColor: [99, 102, 241],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            halign: "center",
        },
        bodyStyles: {
            textColor: [60, 60, 60],
            halign: "right",
            fontSize: 9,
        },
        columnStyles: {
            0: { halign: "center" },
        },
        alternateRowStyles: {
            fillColor: [245, 245, 255],
        },
        styles: {
            cellPadding: 4,
            fontSize: 9,
        },
        margin: { left: 20, right: 20 },
    });

    // --- Footer ---
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
            "Generated by Smart Loan EMI Calculator | Page " + i + " of " + pageCount,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: "center" }
        );
    }

    doc.save("EMI_Report_" + data.loanType.replace(/\s+/g, "_") + ".pdf");
}
