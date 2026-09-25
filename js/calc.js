/**
 * calc.js — Pure financial calculations
 * No DOM access, no global state. All functions are exported on window.Calc.
 */

(function (root) {
  'use strict';

  /**
   * Format a number as Indian Rupee string.
   * @param {number} value
   * @param {number} decimals
   * @returns {string}
   */
  function money(value, decimals = 0) {
    const n = Number(value || 0);
    const amount = n.toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return '₹ ' + amount;
  }

  /**
   * Format a number as percentage string.
   * @param {number} value
   * @returns {string}
   */
  function percent(value) {
    return `${Number(value || 0).toFixed(2)} %`;
  }

  /**
   * EMI calculation — standard reducing-balance formula.
   * @param {number} principal
   * @param {number} annualRatePct  e.g. 10.08
   * @param {number} months
   * @returns {number}
   */
  function pmt(principal, annualRatePct, months) {
    const r = annualRatePct / 100 / 12;
    if (!r) return principal / months;
    const pow = Math.pow(1 + r, months);
    return (principal * r * pow) / (pow - 1);
  }

  /**
   * Net Present Value of a cash-flow array at a given periodic rate.
   * @param {number} rate  periodic rate (decimal)
   * @param {number[]} cashflows
   * @returns {number}
   */
  function npv(rate, cashflows) {
    return cashflows.reduce(
      (sum, cf, index) => sum + cf / Math.pow(1 + rate, index),
      0
    );
  }

  /**
   * Bisection-method IRR solver (monthly rate).
   * @param {number[]} cashflows  First element is negative outflow.
   * @returns {number}  Monthly IRR (decimal)
   */
  function solveMonthlyIrr(cashflows) {
    let low = -0.9999;
    let high = 10;
    let lowVal = npv(low, cashflows);
    let highVal = npv(high, cashflows);

    for (let expand = 0; lowVal * highVal > 0 && expand < 20; expand++) {
      high *= 2;
      highVal = npv(high, cashflows);
    }
    if (lowVal * highVal > 0) return 0;

    for (let i = 0; i < 120; i++) {
      const mid = (low + high) / 2;
      const midVal = npv(mid, cashflows);
      if (Math.abs(midVal) < 1e-7) return mid;
      if (lowVal * midVal <= 0) {
        high = mid;
        highVal = midVal;
      } else {
        low = mid;
        lowVal = midVal;
      }
    }
    return (low + high) / 2;
  }

  /**
   * Build the full amortisation schedule.
   * @param {number} principal
   * @param {number} annualRatePct
   * @param {number} months
   * @param {number} emi  Pre-calculated EMI
   * @returns {Array<{instalmentNo, outstandingPrincipal, principal, interest, instalment}>}
   */
  function buildSchedule(principal, annualRatePct, months, emi) {
    const r = annualRatePct / 100 / 12;
    let outstanding = principal;
    const rows = [];

    for (let i = 1; i <= months; i++) {
      const interest = Math.round(outstanding * r);
      let principalPaid = emi - interest;
      let instalment = emi;

      if (i === months) {
        // Final instalment — clear remaining principal
        principalPaid = outstanding;
        instalment = Math.round(principalPaid + interest);
      }

      rows.push({
        instalmentNo: i,
        outstandingPrincipal: Math.round(outstanding).toString(),
        principal: Number(principalPaid.toFixed(2)).toString(),
        interest: Number(interest.toFixed(2)).toString(),
        instalment: Number(instalment.toFixed(2)).toString(),
      });

      outstanding = Math.max(0, outstanding - principalPaid);
    }
    return rows;
  }

  /**
   * Run the full KFS calculation given raw user inputs.
   * @param {{loanAmount, roi, tenure, processingFee, otherCharges}} input
   * @returns {{emi, apr, totalInterest, totalPaid, netAmount, schedule}}
   */
  function calculateKfs(input) {
    const emi = pmt(input.loanAmount, input.roi, input.tenure);
    const schedule = buildSchedule(input.loanAmount, input.roi, input.tenure, emi);
    const totalPaid = schedule.reduce((sum, row) => sum + Number(row.instalment), 0);
    const totalInterest = schedule.reduce((sum, row) => sum + Number(row.interest), 0);
    const netAmount = input.loanAmount - input.processingFee - (input.otherCharges || 0);
    const cashflows = [-netAmount, ...Array.from({ length: input.tenure }, () => emi)];
    const monthlyApr = solveMonthlyIrr(cashflows);
    const apr = monthlyApr * 12 * 100;

    return { emi, apr, totalInterest, totalPaid, netAmount, schedule };
  }

  // Export
  root.Calc = { money, percent, pmt, npv, solveMonthlyIrr, buildSchedule, calculateKfs };
})(window);
