import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePersonSummary,
  calculatePoolSummary,
  reconcilePhysicalCash,
  validateTransactionInput,
  generatePersonShareSummary,
  INITIAL_PEOPLE,
  INITIAL_TRANSACTIONS,
  type PersonAccount,
  type Transaction,
} from './ledgerLogic';

test('calculatePoolSummary returns all zeros when opened as a brand-new empty ledger', () => {
  const emptyPool = calculatePoolSummary([], []);
  assert.equal(emptyPool.netPoolBalance, 0);
  assert.equal(emptyPool.positiveEnvelopesSum, 0);
  assert.equal(emptyPool.overdrawnSum, 0);
  assert.equal(emptyPool.totalReceivedAll, 0);
  assert.equal(emptyPool.totalSpentAll, 0);
  assert.equal(emptyPool.activePeopleCount, 0);
});

test('calculatePersonSummary computes received, spent, and remaining balance accurately', () => {
  const salma = INITIAL_PEOPLE.find((p) => p.id === 'person-salma')!;
  const summary = calculatePersonSummary(salma, INITIAL_TRANSACTIONS);

  assert.equal(summary.totalReceived, 450);
  assert.equal(summary.totalSpent, 275); // 180 + 95
  assert.equal(summary.remainingBalance, 175); // 450 - 275
  assert.equal(summary.status, 'active');
  assert.equal(summary.completedTasksCount, 2);
  assert.equal(summary.totalTasksCount, 4);
});

test('calculatePersonSummary detects low balance and overdrawn status properly', () => {
  const nadia = INITIAL_PEOPLE.find((p) => p.id === 'person-nadia')!;
  const nadiaSummary = calculatePersonSummary(nadia, INITIAL_TRANSACTIONS);
  // Nadia: received 200, spent 170 -> remaining 30 (15% left -> 'low')
  assert.equal(nadiaSummary.remainingBalance, 30);
  assert.equal(nadiaSummary.status, 'low');

  const hamza = INITIAL_PEOPLE.find((p) => p.id === 'person-hamza')!;
  const hamzaSummary = calculatePersonSummary(hamza, INITIAL_TRANSACTIONS);
  // Hamza: received 120, spent 135 -> remaining -15 ('overdrawn')
  assert.equal(hamzaSummary.remainingBalance, -15);
  assert.equal(hamzaSummary.status, 'overdrawn');
});

test('calculatePoolSummary aggregates combined purse money across all people', () => {
  const pool = calculatePoolSummary(INITIAL_PEOPLE, INITIAL_TRANSACTIONS);

  // Salma: +175, Tariq: +150 (600 - 450), Nadia: +30 (200 - 170), Hamza: -15 (120 - 135)
  assert.equal(pool.positiveEnvelopesSum, 355); // 175 + 150 + 30
  assert.equal(pool.overdrawnSum, 15);
  assert.equal(pool.netPoolBalance, 340); // 355 - 15
  assert.equal(pool.totalReceivedAll, 1370); // 450 + 600 + 200 + 120
  assert.equal(pool.totalSpentAll, 1030); // 275 + 450 + 170 + 135
  assert.equal(pool.activePeopleCount, 3);
  assert.equal(pool.overdrawnPeopleCount, 1);
});

test('reconcilePhysicalCash identifies exact match, surplus, and shortage', () => {
  const exact = reconcilePhysicalCash(340, 340);
  assert.equal(exact.status, 'exact');
  assert.equal(exact.difference, 0);

  const surplus = reconcilePhysicalCash(340, 365);
  assert.equal(surplus.status, 'surplus');
  assert.equal(surplus.difference, 25);

  const short = reconcilePhysicalCash(340, 310);
  assert.equal(short.status, 'short');
  assert.equal(short.difference, -30);
});

test('validateTransactionInput rejects invalid inputs and parses valid amount', () => {
  const emptyAmount = validateTransactionInput({
    personMode: 'existing',
    personId: 'person-salma',
    amountStr: '',
    description: 'Paid tailor',
  });
  assert.equal(emptyAmount.valid, false);

  const missingNewPerson = validateTransactionInput({
    personMode: 'new',
    newPersonName: 'A',
    newPersonPurpose: 'Groceries',
    amountStr: '100',
    description: 'Given cash',
  });
  assert.equal(missingNewPerson.valid, false);

  const validTx = validateTransactionInput({
    personMode: 'existing',
    personId: 'person-salma',
    amountStr: '1,250.50',
    description: 'Sent extra money for fabric',
  });
  assert.equal(validTx.valid, true);
  assert.equal(validTx.parsedAmount, 1250.5);
});

test('generatePersonShareSummary creates a readable breakdown for sharing', () => {
  const person: PersonAccount = {
    id: 'p-test',
    name: 'Sister Amina',
    relationship: 'Sister',
    purposeTitle: 'School Books',
    tasks: [],
    createdAt: 1000,
  };
  const txs: Transaction[] = [
    {
      id: 't1',
      personId: 'p-test',
      type: 'received',
      amount: 100,
      description: 'Cash given',
      date: '2026-10-20',
      createdAt: 1001,
    },
    {
      id: 't2',
      personId: 'p-test',
      type: 'spent',
      amount: 65,
      description: 'Bought notebooks',
      date: '2026-10-21',
      createdAt: 1002,
    },
  ];
  const summary = calculatePersonSummary(person, txs);
  const text = generatePersonShareSummary(summary, '$');
  assert.ok(text.includes('Money & Task Summary for Sister Amina'));
  assert.ok(text.includes('Total Money Sent: $100'));
  assert.ok(text.includes('Total Money Used: $65'));
  assert.ok(text.includes('Money Left With Me: $35'));
});
