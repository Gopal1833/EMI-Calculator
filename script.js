// script.js - EMI Calculator logic and DOM handling

// Grab DOM elements using getElementById as required
const emiForm = document.getElementById('emi-form');
const principalEl = document.getElementById('principal');
const annualRateEl = document.getElementById('annualRate');
const tenureYearsEl = document.getElementById('tenureYears');
const errorEl = document.getElementById('error');
const resultsEl = document.getElementById('results');
const monthlyEl = document.getElementById('monthlyEmi');
const totalPaymentEl = document.getElementById('totalPayment');
const totalInterestEl = document.getElementById('totalInterest');

// Utility: format number with two decimals and thousands separators
function formatNumber(value){
  return new Intl.NumberFormat(undefined, {minimumFractionDigits:2, maximumFractionDigits:2}).format(value);
}

// Show error message (simple validation feedback)
function showError(msg){
  errorEl.textContent = msg;
  resultsEl.hidden = true;
}

// Clear error message
function clearError(){
  errorEl.textContent = '';
}

// EMI calculation when form is submitted
emiForm.addEventListener('submit', function(event){
  event.preventDefault(); // avoid page reload
  clearError();

  // Read inputs and convert to numbers
  const P = parseFloat(principalEl.value);
  const annualRate = parseFloat(annualRateEl.value);
  const years = parseFloat(tenureYearsEl.value);

  // Validation: required and positive numbers
  if (isNaN(P) || P <= 0){ showError('Please enter a valid positive Loan Amount.'); principalEl.focus(); return; }
  if (isNaN(annualRate) || annualRate < 0){ showError('Please enter a valid non-negative Annual Interest Rate.'); annualRateEl.focus(); return; }
  if (isNaN(years) || years <= 0){ showError('Please enter a valid positive Loan Tenure in years.'); tenureYearsEl.focus(); return; }

  // Convert annual interest rate to monthly rate (decimal)
  const R = annualRate / 12 / 100; // monthly interest rate
  const N = Math.round(years * 12); // total number of monthly payments

  // EMI formula:
  // EMI = [P × R × (1+R)^N] / [(1+R)^N − 1]
  // Handle the special case when R === 0 (zero interest loan)
  let emi;
  if (R === 0){
    emi = P / N;
  } else {
    const pow = Math.pow(1 + R, N);
    emi = (P * R * pow) / (pow - 1);
  }

  // Totals
  const totalPayment = emi * N;
  const totalInterest = totalPayment - P;

  // Display results with formatting
  monthlyEl.textContent = formatNumber(emi);
  totalPaymentEl.textContent = formatNumber(totalPayment);
  totalInterestEl.textContent = formatNumber(totalInterest);
  resultsEl.hidden = false;
});

// Additional accessibility: clear results when inputs change
[principalEl, annualRateEl, tenureYearsEl].forEach(el => {
  el.addEventListener('input', () => { clearError(); resultsEl.hidden = true; });
});

/*
  Notes for viva:
  - `P` is the principal, `R` is monthly rate, `N` is tenure in months.
  - We use `getElementById()` to fetch DOM nodes and `addEventListener()` for events.
  - Validation ensures inputs are present and positive; results hidden when invalid.
*/
