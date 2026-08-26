const test = require('node:test');
const assert = require('node:assert/strict');
const { buildSalaryRange, buildPlayerSearchParams } = require('./fifaService');

test('salary range follows FIFAaddict fp query format', () => {
  assert.equal(buildSalaryRange('', '6'), '0-6');
  assert.equal(buildSalaryRange('5', '6'), '5-6');
  assert.equal(buildSalaryRange('6', ''), '6');
  assert.equal(buildSalaryRange('7', '6'), '');
});

test('goalkeeper max salary is applied upstream before the 100-result cap', () => {
  const params = buildPlayerSearchParams({ pos: 'gk', maxSalary: '6' });
  assert.equal(params.get('pos'), 'gk');
  assert.equal(params.get('fp'), '0-6');
  assert.ok(params.get('class').includes('live'));
});
