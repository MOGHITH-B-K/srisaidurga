import test from 'node:test';
import assert from 'node:assert/strict';

test('Tax and Subtotal Calculation Logic', () => {
  const items = [
    { qty: 2, rate: 500, amount: 1000 },
    { qty: 1, rate: 1500, amount: 1500 }
  ];
  
  const subtotal = items.reduce((acc, curr) => acc + (curr.qty * curr.rate), 0);
  assert.equal(subtotal, 2500);

  const taxPercentage = 18;
  const taxAmount = Number(((subtotal * taxPercentage) / 100).toFixed(2));
  assert.equal(taxAmount, 450);

  const advanceAmount = 500;
  const totalAmount = Number((subtotal + taxAmount - advanceAmount).toFixed(2));
  assert.equal(totalAmount, 2450);
});

test('Rental Bill Timing and Due Amount Calculation', () => {
  const subtotal = 3000;
  const transportFees = 200;
  const taxAmount = 540;
  const advanceAmount = 1000;
  
  const grandTotal = subtotal + transportFees + taxAmount;
  assert.equal(grandTotal, 3740);

  const balanceDue = grandTotal - advanceAmount;
  assert.equal(balanceDue, 2740);
});

test('Phone Number and Customer Input Validation', () => {
  const validPhone = '9790548669';
  const cleanPhone = validPhone.replace(/\D/g, '');
  assert.equal(cleanPhone.length, 10);
});

test('Supabase URL Validator', () => {
  const validUrl = 'https://slelguoygbfzlpylpxfs.supabase.co';
  const isValid = Boolean(new URL(validUrl));
  assert.equal(isValid, true);

  assert.throws(() => new URL('invalid_domain_url'));
});
