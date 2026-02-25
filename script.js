/**
 * ============================================================
 * SMART LOAN EMI CALCULATOR — script.js
 * ============================================================
 * Features:
 *  - Manual interest rate input from user
 *  - EMI calculation using standard formula (submit event)
 *  - Amortization schedule generation
 *  - Input validation with user-friendly error messages
 *  - PDF report download using jsPDF + autoTable
 *
 * EMI Formula:
 *   EMI = (P × R × (1+R)^N) / ((1+R)^N − 1)
 *   Where P = Principal, R = Monthly Rate, N = Months
 * ============================================================
 */

// ===== 1. LOAN TYPE LABELS =====
// Friendly labels for each loan type (used in PDF report)

const loanLabels = {
  home: "Home Loan",
  car: "Car Loan",
  education: "Education Loan",
  personal: "Personal Loan"
};

// ===== 2. DOM ELEMENT REFERENCES =====
// Using getElementById for DOM manipulation as required
const loanTypeSelect = document.getElementById("loanType");
const loanAmountInput = document.getElementById("loanAmount");
const interestRateInput = document.getElementById("interestRate");
const loanTenureInput = document.getElementById("loanTenure");
const emiForm = document.getElementById("emiForm");
const resultsSection = document.getElementById("resultsSection");
const monthlyEmiEl = document.getElementById("monthlyEmi");
const totalPaymentEl = document.getElementById("totalPayment");
const totalInterestEl = document.getElementById("totalInterest");
const downloadBtn = document.getElementById("downloadBtn");
const amortizationSection = document.getElementById("amortizationSection");
const amortizationBody = document.getElementById("amortizationBody");

// ===== 3. GLOBAL STATE =====
// Stores the latest calculation results for PDF export
let lastCalculation = null;

// ===== 4. EVENT LISTENER — Loan Type Change =====
// Clear any previous error when user selects a loan type
loanTypeSelect.addEventListener("change", function () {
  clearError(loanTypeSelect);
});

// ===== 5. EVENT LISTENER — Form Submit =====
// Validates inputs and performs EMI calculation
emiForm.addEventListener("submit", function (e) {
  // Prevent default form submission (page reload)
  e.preventDefault();

  // --- Input Validation ---
  let isValid = true;

  // Validate Loan Type selection
  if (!loanTypeSelect.value) {
    showError(loanTypeSelect, "Please select a loan type.");
    isValid = false;
  } else {
    clearError(loanTypeSelect);
  }

  // Validate Loan Amount (must be a positive number)
  const principal = parseFloat(loanAmountInput.value);
  if (!loanAmountInput.value || isNaN(principal) || principal <= 0) {
    showError(loanAmountInput, "Please enter a valid loan amount greater than 0.");
    isValid = false;
  } else {
    clearError(loanAmountInput);
  }

  // Validate Interest Rate (must be a positive number between 0.1 and 50)
  const annualRate = parseFloat(interestRateInput.value);
  if (!interestRateInput.value || isNaN(annualRate) || annualRate < 0.1 || annualRate > 50) {
    showError(interestRateInput, "Please enter a valid interest rate (0.1% - 50%).");
    isValid = false;
  } else {
    clearError(interestRateInput);
  }

  // Validate Loan Tenure (must be between 1 and 30 years)
  const tenureYears = parseInt(loanTenureInput.value);
  if (!loanTenureInput.value || isNaN(tenureYears) || tenureYears < 1 || tenureYears > 30) {
    showError(loanTenureInput, "Please enter tenure between 1 and 30 years.");
    isValid = false;
  } else {
    clearError(loanTenureInput);
  }

  // Stop if any validation failed
  if (!isValid) return;

  // --- Retrieve Values ---
  const monthlyRate = annualRate / 12 / 100;              // Monthly rate (decimal)
  const totalMonths = tenureYears * 12;                   // Total months (N)

  // --- EMI Calculation ---
  // Formula: EMI = (P × R × (1+R)^N) / ((1+R)^N − 1)
  const emi = calculateEMI(principal, monthlyRate, totalMonths);
  const totalPayment = emi * totalMonths;                 // Total amount paid
  const totalInterest = totalPayment - principal;         // Total interest paid

  // --- Store results globally for PDF export ---
  lastCalculation = {
    loanType: loanLabels[loanTypeSelect.value],
    principal: principal,
    annualRate: annualRate,
    tenureYears: tenureYears,
    totalMonths: totalMonths,
    emi: emi,
    totalPayment: totalPayment,
    totalInterest: totalInterest
  };

  // --- Display Results ---
  monthlyEmiEl.textContent = formatCurrency(emi);
  totalPaymentEl.textContent = formatCurrency(totalPayment);
  totalInterestEl.textContent = formatCurrency(totalInterest);

  // Show the results section with animation
  resultsSection.classList.remove("hidden");

  // --- Generate Amortization Table ---
  generateAmortizationTable(principal, monthlyRate, totalMonths, emi);

  // Show the amortization section
  amortizationSection.classList.remove("hidden");

  // Smooth scroll to results
  resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
});

// ===== 6. EMI CALCULATION FUNCTION =====
/**
 * Calculates the Equated Monthly Installment (EMI).
 *
 * @param {number} P - Principal loan amount
 * @param {number} R - Monthly interest rate (decimal, e.g. 0.00625)
 * @param {number} N - Total number of monthly installments
 * @returns {number} Monthly EMI amount
 */
function calculateEMI(P, R, N) {
  // Edge case: if interest rate is 0, simple division
  if (R === 0) {
    return P / N;
  }

  // Standard EMI formula
  const factor = Math.pow(1 + R, N);       // (1 + R)^N
  const emi = (P * R * factor) / (factor - 1);
  return emi;
}

// ===== 7. AMORTIZATION TABLE GENERATOR =====
/**
 * Generates the month-by-month amortization schedule
 * and populates the HTML table body.
 *
 * @param {number} principal    - Original loan amount
 * @param {number} monthlyRate  - Monthly interest rate (decimal)
 * @param {number} totalMonths  - Total installment count
 * @param {number} emi          - Calculated EMI value
 */
function generateAmortizationTable(principal, monthlyRate, totalMonths, emi) {
  // Clear any existing rows in the table body
  amortizationBody.innerHTML = "";

  let balance = principal; // Remaining balance starts at full principal

  for (let month = 1; month <= totalMonths; month++) {
    // Interest for this month = remaining balance × monthly rate
    const interestPayment = balance * monthlyRate;

    // Principal portion = EMI − interest portion
    const principalPayment = emi - interestPayment;

    // Update remaining balance
    balance -= principalPayment;

    // Prevent floating-point negative near zero
    if (balance < 0) balance = 0;

    // Create a table row element
    const row = document.createElement("tr");

    // Stagger the row animation delay for visual effect
    row.style.animationDelay = `${month * 0.02}s`;

    // Populate the row with month data
    row.innerHTML = `
            <td>${month}</td>
            <td>${formatCurrency(emi)}</td>
            <td>${formatCurrency(principalPayment)}</td>
            <td>${formatCurrency(interestPayment)}</td>
            <td>${formatCurrency(balance)}</td>
        `;

    // Append the row to the table body
    amortizationBody.appendChild(row);
  }
}

// ===== 8. PDF DOWNLOAD =====
// Event listener for the Download button
downloadBtn.addEventListener("click", function () {
  // Guard: ensure calculation has been performed
  if (!lastCalculation) {
    alert("Please calculate EMI first before downloading the report.");
    return;
  }

  // Access jsPDF from the global scope (loaded via CDN)
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const data = lastCalculation;
  const pageWidth = doc.internal.pageSize.getWidth();

  // --- PDF Title ---
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(99, 102, 241); // Indigo color
  doc.text("Smart Loan EMI Report", pageWidth / 2, 22, { align: "center" });

  // --- Decorative line ---
  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(0.5);
  doc.line(20, 28, pageWidth - 20, 28);

  // --- Loan Details Section ---
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
    ["Tenure", data.tenureYears + " Years (" + data.totalMonths + " Months)"]
  ];

  let yPos = 48;
  details.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(label + ":", 20, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(value, 85, yPos);
    yPos += 8;
  });

  // --- EMI Summary Section ---
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
    ["Total Interest", formatCurrency(data.totalInterest)]
  ];

  summary.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(label + ":", 20, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(value, 85, yPos);
    yPos += 8;
  });

  // --- Amortization Table in PDF ---
  yPos += 8;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(50, 50, 50);
  doc.text("Amortization Schedule", 20, yPos);

  // Build table data from DOM
  const tableRows = [];
  const rows = amortizationBody.querySelectorAll("tr");
  rows.forEach((row) => {
    const cells = row.querySelectorAll("td");
    tableRows.push([
      cells[0].textContent,
      cells[1].textContent,
      cells[2].textContent,
      cells[3].textContent,
      cells[4].textContent
    ]);
  });

  // Use jsPDF autoTable plugin to render the table
  doc.autoTable({
    startY: yPos + 6,
    head: [["Month", "EMI (₹)", "Principal (₹)", "Interest (₹)", "Balance (₹)"]],
    body: tableRows,
    theme: "grid",
    headStyles: {
      fillColor: [99, 102, 241],   // Indigo header
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center"
    },
    bodyStyles: {
      textColor: [60, 60, 60],
      halign: "right",
      fontSize: 9
    },
    columnStyles: {
      0: { halign: "center" }       // Center the month column
    },
    alternateRowStyles: {
      fillColor: [245, 245, 255]    // Light indigo zebra stripes
    },
    styles: {
      cellPadding: 4,
      fontSize: 9
    },
    margin: { left: 20, right: 20 }
  });

  // --- Footer on each page ---
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

  // --- Save / Download the PDF ---
  doc.save("EMI_Report_" + data.loanType.replace(/\s+/g, "_") + ".pdf");
});

// ===== 9. UTILITY FUNCTIONS =====

/**
 * Formats a number as Indian Rupee currency string.
 * Example: 50000 → "₹50,000.00"
 *
 * @param {number} amount - The numeric amount to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
  return "₹" + amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Displays a validation error message below the given input element.
 * Also adds an 'error' CSS class for visual feedback.
 *
 * @param {HTMLElement} inputEl - The input or select element
 * @param {string} message     - Error message to display
 */
function showError(inputEl, message) {
  // Add error class for red border styling
  inputEl.classList.add("error");

  // Remove any existing error message to avoid duplicates
  const existingError = inputEl.parentElement.querySelector(".error-message");
  if (existingError) existingError.remove();

  // Create and insert the error message span
  const errorSpan = document.createElement("span");
  errorSpan.className = "error-message";
  errorSpan.textContent = message;
  inputEl.parentElement.appendChild(errorSpan);
}

/**
 * Clears the validation error from an input element.
 *
 * @param {HTMLElement} inputEl - The input or select element
 */
function clearError(inputEl) {
  // Remove the error CSS class
  inputEl.classList.remove("error");

  // Remove the error message if it exists
  const existingError = inputEl.parentElement.querySelector(".error-message");
  if (existingError) existingError.remove();
}

// ===== 10. REAL-TIME ERROR CLEARING =====
// Clear errors as the user types, for better UX
loanAmountInput.addEventListener("input", function () {
  clearError(loanAmountInput);
});
interestRateInput.addEventListener("input", function () {
  clearError(interestRateInput);
});
loanTenureInput.addEventListener("input", function () {
  clearError(loanTenureInput);
});
