// Simple EMI calculator and comparison script

// Elements for single EMI calculation
const loanAmountInput = document.getElementById('loanAmount');
const interestRateInput = document.getElementById('interestRate');
const loanTenureInput = document.getElementById('loanTenure');
const emiForm = document.getElementById('emiForm');
const resultsSection = document.getElementById('resultsSection');
const monthlyEmiEl = document.getElementById('monthlyEmi');
const totalPaymentEl = document.getElementById('totalPayment');
const totalInterestEl = document.getElementById('totalInterest');

// Elements for comparison
const addLoanBtn = document.getElementById('addLoanBtn');
const compareBtn = document.getElementById('compareBtn');
const compareLoansList = document.getElementById('compareLoansList');
const compareTableBody = document.getElementById('compareTableBody');

let compareCount = 0;
const MAX_COMPARE_LOANS = 4;

// Utility: calculate EMI
function calculateEMI(P, monthlyRate, N) {
  if (monthlyRate === 0) return P / N;
  const factor = Math.pow(1 + monthlyRate, N);
  return (P * monthlyRate * factor) / (factor - 1);
}

// Helper to format currency
function formatCurrency(val) {
  return '₹ ' + Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

// Handle single calculation
emiForm.addEventListener('submit', function (e) {
  e.preventDefault();
  const principal = parseFloat(loanAmountInput.value);
  const annualRate = parseFloat(interestRateInput.value);
  const tenureYears = parseFloat(loanTenureInput.value);

  if (isNaN(principal) || isNaN(annualRate) || isNaN(tenureYears) || principal <= 0 || annualRate < 0 || tenureYears <= 0) {
    alert('Please fill in valid values.');
    return;
  }

  const monthlyRate = annualRate / 12 / 100;
  const totalMonths = tenureYears * 12;
  const emi = calculateEMI(principal, monthlyRate, totalMonths);
  const totalPayment = emi * totalMonths;
  const totalInterest = totalPayment - principal;

  monthlyEmiEl.textContent = formatCurrency(emi);
  totalPaymentEl.textContent = formatCurrency(totalPayment);
  totalInterestEl.textContent = formatCurrency(totalInterest);
  resultsSection.classList.remove('hidden');
});

// Compare functionality
addLoanBtn.addEventListener('click', addCompareLoan);
compareBtn.addEventListener('click', compareLoans);

function addCompareLoan() {
  if (compareCount >= MAX_COMPARE_LOANS) {
    alert('You can compare up to 4 loans.');
    return;
  }

  compareCount++;
  const card = document.createElement('div');
  card.className = 'compare-loan-card';
  card.innerHTML = `
    <div class="loan-header">
      <strong>Loan ${compareCount}</strong>
      <button type="button" class="remove-btn">×</button>
    </div>
    <div class="loan-fields">
      <input type="text" class="cmp-name" placeholder="Name" />
      <input type="number" class="cmp-amount" placeholder="Amount" min="1" />
      <input type="number" class="cmp-rate" placeholder="Rate (%)" step="0.01" />
      <input type="number" class="cmp-tenure" placeholder="Tenure (yrs)" />
    </div>
  `;

  // remove button handler
  card.querySelector('.remove-btn').addEventListener('click', function () {
    card.remove();
    compareCount--;
    if (compareCount < 2) compareBtn.disabled = true;
    if (compareCount < MAX_COMPARE_LOANS) addLoanBtn.disabled = false;
  });

  compareLoansList.appendChild(card);
  if (compareCount >= 2) compareBtn.disabled = false;
  if (compareCount >= MAX_COMPARE_LOANS) addLoanBtn.disabled = true;
}

function compareLoans() {
  const rows = compareLoansList.querySelectorAll('.compare-loan-card');
  compareTableBody.innerHTML = '';
  rows.forEach((card, index) => {
    const name = card.querySelector('.cmp-name').value || `Loan ${index + 1}`;
    const principal = parseFloat(card.querySelector('.cmp-amount').value);
    const annualRate = parseFloat(card.querySelector('.cmp-rate').value);
    const tenureYears = parseFloat(card.querySelector('.cmp-tenure').value);
    if (isNaN(principal) || isNaN(annualRate) || isNaN(tenureYears)) return;

    const monthlyRate = annualRate / 12 / 100;
    const totalMonths = tenureYears * 12;
    const emi = calculateEMI(principal, monthlyRate, totalMonths);
    const totalPayment = emi * totalMonths;
    const totalInterest = totalPayment - principal;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${name}</td>
      <td>${formatCurrency(principal)}</td>
      <td>${annualRate.toFixed(2)}</td>
      <td>${tenureYears} yrs</td>
      <td>${formatCurrency(emi)}</td>
      <td>${formatCurrency(totalPayment)}</td>
      <td>${formatCurrency(totalInterest)}</td>
    `;
    compareTableBody.appendChild(tr);
  });

  document.getElementById('compareResultsSection').classList.remove('hidden');
}
