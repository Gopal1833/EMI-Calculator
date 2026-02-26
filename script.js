/**
 * ============================================================
 * SMART LOAN EMI CALCULATOR — script.js
 * ============================================================
 * Features:
 *  - Dark / Light theme toggle with localStorage persistence
 *  - EMI calculation with form validation
 *  - Payment breakdown charts (Pie + Doughnut via Chart.js)
 *  - Amortization schedule
 *  - Loan Comparison (up to 4 loans with bar charts)
 *  - PDF report download (jsPDF + autoTable)
 *
 * EMI Formula:
 *   EMI = (P × R × (1+R)^N) / ((1+R)^N − 1)
 * ============================================================
 */

// ===== 1. LOAN TYPE LABELS =====
const loanLabels = {
  home: "Home Loan",
  car: "Car Loan",
  education: "Education Loan",
  personal: "Personal Loan"
};

// Chart color palette
const CHART_COLORS = [
  "#6366f1", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#059669", "#d97706", "#dc2626"
];

// ===== 2. DOM ELEMENT REFERENCES =====
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
const themeToggle = document.getElementById("themeToggle");
const tabNav = document.getElementById("tabNav");
const addLoanBtn = document.getElementById("addLoanBtn");
const compareBtn = document.getElementById("compareBtn");
const compareLoansList = document.getElementById("compareLoansList");
const compareResultsSection = document.getElementById("compareResultsSection");
const compareTableBody = document.getElementById("compareTableBody");

// ===== 3. GLOBAL STATE =====
let lastCalculation = null;
let emiPieChart = null;
let emiDoughnutChart = null;
let compareBarChart = null;
let compareEmiChart = null;
let compareLoanCount = 0;
const MAX_COMPARE_LOANS = 4;

// ============================================================
// SECTION A: THEME TOGGLE
// ============================================================

/**
 * Initializes theme from localStorage or defaults to dark.
 */
function initTheme() {
  const savedTheme = localStorage.getItem("emi-theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
}

/**
 * Toggles between dark and light themes.
 */
function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  html.setAttribute("data-theme", next);
  localStorage.setItem("emi-theme", next);

  // Re-render charts with new theme colors
  if (lastCalculation) {
    renderEmiCharts(lastCalculation);
  }
  // Re-render compare charts if visible
  if (!compareResultsSection.classList.contains("hidden")) {
    runComparison();
  }
}

// Initialize theme on page load
initTheme();

// Theme toggle event
themeToggle.addEventListener("click", toggleTheme);

// ============================================================
// SECTION B: TAB NAVIGATION
// ============================================================

tabNav.addEventListener("click", function (e) {
  const btn = e.target.closest(".tab-btn");
  if (!btn) return;

  const targetTab = btn.getAttribute("data-tab");

  // Update active button
  tabNav.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  // Update active tab content
  document.querySelectorAll(".tab-content").forEach(tc => tc.classList.remove("active"));
  const tabEl = document.getElementById("tab-" + targetTab);
  if (tabEl) tabEl.classList.add("active");
});

// ============================================================
// SECTION C: EMI CALCULATOR
// ============================================================

// Clear error on loan type change
loanTypeSelect.addEventListener("change", function () {
  clearError(loanTypeSelect);
});

// Form submit handler
emiForm.addEventListener("submit", function (e) {
  e.preventDefault();

  let isValid = true;

  // Validate Loan Type
  if (!loanTypeSelect.value) {
    showError(loanTypeSelect, "Please select a loan type.");
    isValid = false;
  } else {
    clearError(loanTypeSelect);
  }

  // Validate Loan Amount
  const principal = parseFloat(loanAmountInput.value);
  if (!loanAmountInput.value || isNaN(principal) || principal <= 0) {
    showError(loanAmountInput, "Please enter a valid loan amount greater than 0.");
    isValid = false;
  } else {
    clearError(loanAmountInput);
  }

  // Validate Interest Rate
  const annualRate = parseFloat(interestRateInput.value);
  if (!interestRateInput.value || isNaN(annualRate) || annualRate < 0.1 || annualRate > 50) {
    showError(interestRateInput, "Please enter a valid interest rate (0.1% - 50%).");
    isValid = false;
  } else {
    clearError(interestRateInput);
  }

  // Validate Tenure
  const tenureYears = parseInt(loanTenureInput.value);
  if (!loanTenureInput.value || isNaN(tenureYears) || tenureYears < 1 || tenureYears > 30) {
    showError(loanTenureInput, "Please enter tenure between 1 and 30 years.");
    isValid = false;
  } else {
    clearError(loanTenureInput);
  }

  if (!isValid) return;

  // Calculate
  const monthlyRate = annualRate / 12 / 100;
  const totalMonths = tenureYears * 12;
  const emi = calculateEMI(principal, monthlyRate, totalMonths);
  const totalPayment = emi * totalMonths;
  const totalInterest = totalPayment - principal;

  // Store results
  lastCalculation = {
    loanType: loanLabels[loanTypeSelect.value],
    principal,
    annualRate,
    tenureYears,
    totalMonths,
    emi,
    totalPayment,
    totalInterest
  };

  // Display results
  monthlyEmiEl.textContent = formatCurrency(emi);
  totalPaymentEl.textContent = formatCurrency(totalPayment);
  totalInterestEl.textContent = formatCurrency(totalInterest);

  resultsSection.classList.remove("hidden");

  // Render charts
  renderEmiCharts(lastCalculation);

  // Generate amortization table
  generateAmortizationTable(principal, monthlyRate, totalMonths, emi);
  amortizationSection.classList.remove("hidden");

  // Scroll to results
  resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
});

// ===== EMI Calculation Function =====
function calculateEMI(P, R, N) {
  if (R === 0) return P / N;
  const factor = Math.pow(1 + R, N);
  return (P * R * factor) / (factor - 1);
}

// ============================================================
// SECTION D: EMI CHARTS (Pie + Doughnut)
// ============================================================

/**
 * Renders EMI breakdown pie chart and principal vs interest doughnut chart.
 */
function renderEmiCharts(data) {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const textColor = isDark ? "#94a3b8" : "#475569";

  // Destroy old charts if they exist
  if (emiPieChart) emiPieChart.destroy();
  if (emiDoughnutChart) emiDoughnutChart.destroy();

  // --- Pie Chart: Payment Breakdown ---
  const pieCtx = document.getElementById("emiPieChart").getContext("2d");
  emiPieChart = new Chart(pieCtx, {
    type: "pie",
    data: {
      labels: ["Principal Amount", "Total Interest"],
      datasets: [{
        data: [data.principal, data.totalInterest],
        backgroundColor: [
          "rgba(99, 102, 241, 0.85)",
          "rgba(245, 158, 11, 0.85)"
        ],
        borderColor: [
          "rgba(99, 102, 241, 1)",
          "rgba(245, 158, 11, 1)"
        ],
        borderWidth: 2,
        hoverOffset: 12
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: textColor,
            padding: 16,
            font: { family: "'Inter', sans-serif", size: 12, weight: 600 },
            usePointStyle: true,
            pointStyleWidth: 12
          }
        },
        title: {
          display: true,
          text: "Principal vs Interest",
          color: textColor,
          font: { family: "'Inter', sans-serif", size: 14, weight: 700 }
        },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              const val = ctx.raw;
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct = ((val / total) * 100).toFixed(1);
              return ` ${ctx.label}: ${formatCurrency(val)} (${pct}%)`;
            }
          }
        }
      }
    }
  });

  // --- Doughnut Chart: EMI Composition ---
  const doughCtx = document.getElementById("emiDoughnutChart").getContext("2d");
  emiDoughnutChart = new Chart(doughCtx, {
    type: "doughnut",
    data: {
      labels: ["Monthly EMI", "Total Interest", "Principal"],
      datasets: [{
        data: [data.emi, data.totalInterest, data.principal],
        backgroundColor: [
          "rgba(16, 185, 129, 0.85)",
          "rgba(245, 158, 11, 0.85)",
          "rgba(99, 102, 241, 0.85)"
        ],
        borderColor: [
          "rgba(16, 185, 129, 1)",
          "rgba(245, 158, 11, 1)",
          "rgba(99, 102, 241, 1)"
        ],
        borderWidth: 2,
        hoverOffset: 12
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: "55%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: textColor,
            padding: 16,
            font: { family: "'Inter', sans-serif", size: 12, weight: 600 },
            usePointStyle: true,
            pointStyleWidth: 12
          }
        },
        title: {
          display: true,
          text: "Payment Composition",
          color: textColor,
          font: { family: "'Inter', sans-serif", size: 14, weight: 700 }
        },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              return ` ${ctx.label}: ${formatCurrency(ctx.raw)}`;
            }
          }
        }
      }
    }
  });
}

// ============================================================
// SECTION E: AMORTIZATION TABLE
// ============================================================

function generateAmortizationTable(principal, monthlyRate, totalMonths, emi) {
  amortizationBody.innerHTML = "";
  let balance = principal;

  for (let month = 1; month <= totalMonths; month++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = emi - interestPayment;
    balance -= principalPayment;
    if (balance < 0) balance = 0;

    const row = document.createElement("tr");
    row.style.animationDelay = `${month * 0.02}s`;
    row.innerHTML = `
      <td>${month}</td>
      <td>${formatCurrency(emi)}</td>
      <td>${formatCurrency(principalPayment)}</td>
      <td>${formatCurrency(interestPayment)}</td>
      <td>${formatCurrency(balance)}</td>
    `;
    amortizationBody.appendChild(row);
  }
}

// ============================================================
// SECTION F: COMPARE LOANS
// ============================================================

/**
 * Adds a new loan card to the comparison section.
 */
function addCompareCard() {
  if (compareLoanCount >= MAX_COMPARE_LOANS) {
    alert("Maximum 4 loans can be compared at once.");
    return;
  }

  compareLoanCount++;
  const idx = compareLoanCount;
  const card = document.createElement("div");
  card.className = "compare-loan-card";
  card.id = `cmpLoan${idx}`;
  card.innerHTML = `
    <div class="compare-loan-header">
      <div class="compare-loan-number">
        <span class="compare-loan-badge badge-${idx}">${idx}</span>
        Loan ${idx}
      </div>
      <button type="button" class="compare-loan-remove" onclick="removeCompareCard('cmpLoan${idx}')" title="Remove">&times;</button>
    </div>
    <div class="compare-loan-fields">
      <div class="form-group">
        <label>Loan Name</label>
        <input type="text" class="cmp-name" placeholder="e.g. Home Loan" value="Loan ${idx}" />
      </div>
      <div class="form-group">
        <label>Amount (₹)</label>
        <input type="number" class="cmp-amount" placeholder="e.g. 500000" min="1" step="any" />
      </div>
      <div class="form-group">
        <label>Rate (%)</label>
        <input type="number" class="cmp-rate" placeholder="e.g. 7.5" min="0.1" max="50" step="any" />
      </div>
      <div class="form-group">
        <label>Tenure (Yrs)</label>
        <input type="number" class="cmp-tenure" placeholder="e.g. 5" min="1" max="30" />
      </div>
    </div>
  `;

  compareLoansList.appendChild(card);
  updateCompareButton();
}

/**
 * Removes a compare card by its ID.
 */
function removeCompareCard(id) {
  const card = document.getElementById(id);
  if (card) {
    card.style.opacity = "0";
    card.style.transform = "translateY(-10px)";
    setTimeout(() => {
      card.remove();
      compareLoanCount--;
      // Re-number remaining cards
      renumberCompareCards();
      updateCompareButton();
    }, 250);
  }
}

/**
 * Re-numbers the compare loan cards after removal.
 */
function renumberCompareCards() {
  const cards = compareLoansList.querySelectorAll(".compare-loan-card");
  compareLoanCount = cards.length;
  cards.forEach((card, i) => {
    const num = i + 1;
    card.id = `cmpLoan${num}`;
    const badge = card.querySelector(".compare-loan-badge");
    badge.textContent = num;
    badge.className = `compare-loan-badge badge-${num}`;
    card.querySelector(".compare-loan-number").lastChild.textContent = ` Loan ${num}`;
    card.querySelector(".compare-loan-remove").setAttribute("onclick", `removeCompareCard('cmpLoan${num}')`);
  });
}

/**
 * Enables/disables the Compare button based on loan count.
 */
function updateCompareButton() {
  compareBtn.disabled = compareLoanCount < 2;
}

// Initialize with 2 loan cards
addCompareCard();
addCompareCard();

// Add Loan button
addLoanBtn.addEventListener("click", addCompareCard);

// Compare button handler
compareBtn.addEventListener("click", runComparison);

/**
 * Runs the loan comparison and renders results + charts.
 */
function runComparison() {
  const cards = compareLoansList.querySelectorAll(".compare-loan-card");
  const results = [];
  let hasError = false;

  cards.forEach((card, i) => {
    const name = card.querySelector(".cmp-name").value.trim() || `Loan ${i + 1}`;
    const amount = parseFloat(card.querySelector(".cmp-amount").value);
    const rate = parseFloat(card.querySelector(".cmp-rate").value);
    const tenure = parseInt(card.querySelector(".cmp-tenure").value);

    // Simple validation
    if (isNaN(amount) || amount <= 0 || isNaN(rate) || rate < 0.1 || rate > 50 || isNaN(tenure) || tenure < 1 || tenure > 30) {
      hasError = true;
      card.style.borderColor = "#ef4444";
      setTimeout(() => { card.style.borderColor = ""; }, 2000);
      return;
    }

    const monthlyRate = rate / 12 / 100;
    const totalMonths = tenure * 12;
    const emi = calculateEMI(amount, monthlyRate, totalMonths);
    const totalPayment = emi * totalMonths;
    const totalInterest = totalPayment - amount;

    results.push({ name, amount, rate, tenure, totalMonths, emi, totalPayment, totalInterest });
  });

  if (hasError) {
    alert("Please fill in all loan fields correctly.");
    return;
  }

  if (results.length < 2) {
    alert("Please add at least 2 loans to compare.");
    return;
  }

  // Render comparison table
  renderCompareTable(results);

  // Render comparison charts
  renderCompareCharts(results);

  // Show results
  compareResultsSection.classList.remove("hidden");
  compareResultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Renders the comparison results table.
 */
function renderCompareTable(results) {
  compareTableBody.innerHTML = "";

  // Find best (lowest) values for highlighting
  const minEmi = Math.min(...results.map(r => r.emi));
  const minTotal = Math.min(...results.map(r => r.totalPayment));
  const minInterest = Math.min(...results.map(r => r.totalInterest));

  results.forEach(r => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${r.name}</td>
      <td>${formatCurrency(r.amount)}</td>
      <td>${r.rate}%</td>
      <td>${r.tenure} yr${r.tenure > 1 ? "s" : ""}</td>
      <td class="${r.emi === minEmi ? 'best-value' : ''}">${formatCurrency(r.emi)}</td>
      <td class="${r.totalPayment === minTotal ? 'best-value' : ''}">${formatCurrency(r.totalPayment)}</td>
      <td class="${r.totalInterest === minInterest ? 'best-value' : ''}">${formatCurrency(r.totalInterest)}</td>
    `;
    compareTableBody.appendChild(row);
  });
}

/**
 * Renders comparison bar charts.
 */
function renderCompareCharts(results) {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const textColor = isDark ? "#94a3b8" : "#475569";
  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)";

  // Destroy old charts
  if (compareBarChart) compareBarChart.destroy();
  if (compareEmiChart) compareEmiChart.destroy();

  const labels = results.map(r => r.name);

  // --- Grouped Bar Chart: Total Payment vs Interest ---
  const barCtx = document.getElementById("compareBarChart").getContext("2d");
  compareBarChart = new Chart(barCtx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Principal (₹)",
          data: results.map(r => r.amount),
          backgroundColor: "rgba(99, 102, 241, 0.75)",
          borderColor: "rgba(99, 102, 241, 1)",
          borderWidth: 2,
          borderRadius: 6
        },
        {
          label: "Total Interest (₹)",
          data: results.map(r => r.totalInterest),
          backgroundColor: "rgba(245, 158, 11, 0.75)",
          borderColor: "rgba(245, 158, 11, 1)",
          borderWidth: 2,
          borderRadius: 6
        },
        {
          label: "Total Payment (₹)",
          data: results.map(r => r.totalPayment),
          backgroundColor: "rgba(16, 185, 129, 0.75)",
          borderColor: "rgba(16, 185, 129, 1)",
          borderWidth: 2,
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          labels: {
            color: textColor,
            font: { family: "'Inter', sans-serif", size: 12, weight: 600 },
            usePointStyle: true,
            pointStyleWidth: 12,
            padding: 16
          }
        },
        title: {
          display: true,
          text: "Loan Amount Comparison",
          color: textColor,
          font: { family: "'Inter', sans-serif", size: 16, weight: 700 },
          padding: { bottom: 20 }
        },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              return ` ${ctx.dataset.label}: ${formatCurrency(ctx.raw)}`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: textColor, font: { weight: 600 } },
          grid: { display: false }
        },
        y: {
          ticks: {
            color: textColor,
            callback: function (val) {
              if (val >= 10000000) return "₹" + (val / 10000000).toFixed(1) + "Cr";
              if (val >= 100000) return "₹" + (val / 100000).toFixed(1) + "L";
              if (val >= 1000) return "₹" + (val / 1000).toFixed(0) + "K";
              return "₹" + val;
            }
          },
          grid: { color: gridColor }
        }
      }
    }
  });

  // --- EMI Comparison Bar Chart ---
  const emiCtx = document.getElementById("compareEmiChart").getContext("2d");
  const emiColors = results.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);

  compareEmiChart = new Chart(emiCtx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Monthly EMI (₹)",
        data: results.map(r => r.emi),
        backgroundColor: emiColors.map(c => c + "cc"),
        borderColor: emiColors,
        borderWidth: 2,
        borderRadius: 8,
        barThickness: 50
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      indexAxis: "y",
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: "Monthly EMI Comparison",
          color: textColor,
          font: { family: "'Inter', sans-serif", size: 16, weight: 700 },
          padding: { bottom: 20 }
        },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              return ` Monthly EMI: ${formatCurrency(ctx.raw)}`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: textColor,
            callback: function (val) {
              if (val >= 100000) return "₹" + (val / 100000).toFixed(1) + "L";
              if (val >= 1000) return "₹" + (val / 1000).toFixed(0) + "K";
              return "₹" + val;
            }
          },
          grid: { color: gridColor }
        },
        y: {
          ticks: { color: textColor, font: { weight: 700 } },
          grid: { display: false }
        }
      }
    }
  });
}

// ============================================================
// SECTION G: PDF DOWNLOAD
// ============================================================

downloadBtn.addEventListener("click", function () {
  if (!lastCalculation) {
    alert("Please calculate EMI first before downloading the report.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const data = lastCalculation;
  const pageWidth = doc.internal.pageSize.getWidth();

  // Title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(99, 102, 241);
  doc.text("Smart Loan EMI Report", pageWidth / 2, 22, { align: "center" });

  // Line
  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(0.5);
  doc.line(20, 28, pageWidth - 20, 28);

  // Loan Details
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

  // EMI Summary
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

  // Amortization Table
  yPos += 8;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(50, 50, 50);
  doc.text("Amortization Schedule", 20, yPos);

  const tableRows = [];
  const rows = amortizationBody.querySelectorAll("tr");
  rows.forEach(row => {
    const cells = row.querySelectorAll("td");
    tableRows.push([
      cells[0].textContent,
      cells[1].textContent,
      cells[2].textContent,
      cells[3].textContent,
      cells[4].textContent
    ]);
  });

  doc.autoTable({
    startY: yPos + 6,
    head: [["Month", "EMI (₹)", "Principal (₹)", "Interest (₹)", "Balance (₹)"]],
    body: tableRows,
    theme: "grid",
    headStyles: {
      fillColor: [99, 102, 241],
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
      0: { halign: "center" }
    },
    alternateRowStyles: {
      fillColor: [245, 245, 255]
    },
    styles: {
      cellPadding: 4,
      fontSize: 9
    },
    margin: { left: 20, right: 20 }
  });

  // Footer on every page
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
});

// ============================================================
// SECTION H: UTILITY FUNCTIONS
// ============================================================

/**
 * Formats a number as Indian Rupee currency string.
 */
function formatCurrency(amount) {
  return "₹" + amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Shows validation error on an input element.
 */
function showError(inputEl, message) {
  inputEl.classList.add("error");
  const existingError = inputEl.parentElement.querySelector(".error-message");
  if (existingError) existingError.remove();

  const errorSpan = document.createElement("span");
  errorSpan.className = "error-message";
  errorSpan.textContent = message;
  inputEl.parentElement.appendChild(errorSpan);
}

/**
 * Clears validation error from an input element.
 */
function clearError(inputEl) {
  inputEl.classList.remove("error");
  const existingError = inputEl.parentElement.querySelector(".error-message");
  if (existingError) existingError.remove();
}

// Real-time error clearing
loanAmountInput.addEventListener("input", function () {
  clearError(loanAmountInput);
});
interestRateInput.addEventListener("input", function () {
  clearError(interestRateInput);
});
loanTenureInput.addEventListener("input", function () {
  clearError(loanTenureInput);
});
