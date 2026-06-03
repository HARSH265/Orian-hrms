const logger = require('./logger');

const RATES = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.5,
  CAD: 1.36,
  AUD: 1.54,
  JPY: 149.5,
  CNY: 7.24,
  BRL: 4.97,
  MXN: 17.15,
  Other: 1,
};

function convertAmount(amount, fromCurrency, toCurrency = 'USD') {
  const fromRate = RATES[fromCurrency] || 1;
  const toRate = RATES[toCurrency] || 1;
  const converted = (amount / fromRate) * toRate;
  return Math.round(converted * 100) / 100;
}

function formatCurrency(amount, currency = 'USD') {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function getSupportedCurrencies() {
  return Object.keys(RATES);
}

module.exports = { convertAmount, formatCurrency, getSupportedCurrencies, RATES };
