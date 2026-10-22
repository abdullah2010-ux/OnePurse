export type TransactionType = 'received' | 'spent' | 'returned';

export interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface PersonAccount {
  id: string;
  name: string;
  relationship: string;
  purposeTitle: string;
  notes?: string;
  tasks: TaskItem[];
  createdAt: number;
}

export interface Transaction {
  id: string;
  personId: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: string; // YYYY-MM-DD
  createdAt: number;
}

export type AccountStatus = 'active' | 'low' | 'settled' | 'overdrawn';

export interface PersonSummary {
  person: PersonAccount;
  totalReceived: number;
  totalSpent: number;
  totalReturned: number;
  remainingBalance: number;
  percentUsed: number;
  status: AccountStatus;
  transactions: Transaction[];
  completedTasksCount: number;
  totalTasksCount: number;
}

export interface PoolSummary {
  netPoolBalance: number;
  positiveEnvelopesSum: number;
  overdrawnSum: number;
  totalReceivedAll: number;
  totalSpentAll: number;
  totalReturnedAll: number;
  activePeopleCount: number;
  overdrawnPeopleCount: number;
  settledPeopleCount: number;
}

export interface CashReconciliationResult {
  expected: number;
  counted: number;
  difference: number;
  status: 'exact' | 'surplus' | 'short';
  message: string;
}

export function roundCurrency(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

export function formatMoney(amount: number, currencySymbol: string = '$'): string {
  const isNegative = amount < 0;
  const absVal = Math.abs(roundCurrency(amount));
  const formatted = absVal.toLocaleString('en-US', {
    minimumFractionDigits: absVal % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  const prefix = currencySymbol.length > 1 ? `${currencySymbol} ` : currencySymbol;
  return isNegative ? `-${prefix}${formatted}` : `${prefix}${formatted}`;
}

export function calculatePersonSummary(
  person: PersonAccount,
  allTransactions: Transaction[]
): PersonSummary {
  const personTxs = allTransactions
    .filter((tx) => tx.personId === person.id)
    .sort((a, b) => b.createdAt - a.createdAt);

  let totalReceived = 0;
  let totalSpent = 0;
  let totalReturned = 0;

  for (const tx of personTxs) {
    if (tx.type === 'received') {
      totalReceived = roundCurrency(totalReceived + tx.amount);
    } else if (tx.type === 'spent') {
      totalSpent = roundCurrency(totalSpent + tx.amount);
    } else if (tx.type === 'returned') {
      totalReturned = roundCurrency(totalReturned + tx.amount);
    }
  }

  const remainingBalance = roundCurrency(totalReceived - totalSpent - totalReturned);
  const totalOut = roundCurrency(totalSpent + totalReturned);

  let percentUsed = 0;
  if (totalReceived > 0) {
    percentUsed = Math.min(100, Math.max(0, Math.round((totalOut / totalReceived) * 100)));
  } else if (totalOut > 0) {
    percentUsed = 100;
  }

  let status: AccountStatus = 'active';
  if (remainingBalance < 0) {
    status = 'overdrawn';
  } else if (remainingBalance === 0) {
    status = 'settled';
  } else if (totalReceived > 0 && remainingBalance / totalReceived <= 0.18) {
    status = 'low';
  } else {
    status = 'active';
  }

  const completedTasksCount = person.tasks.filter((t) => t.completed).length;
  const totalTasksCount = person.tasks.length;

  return {
    person,
    totalReceived,
    totalSpent,
    totalReturned,
    remainingBalance,
    percentUsed,
    status,
    transactions: personTxs,
    completedTasksCount,
    totalTasksCount,
  };
}

export function calculatePoolSummary(
  people: PersonAccount[],
  allTransactions: Transaction[]
): PoolSummary {
  let netPoolBalance = 0;
  let positiveEnvelopesSum = 0;
  let overdrawnSum = 0;
  let totalReceivedAll = 0;
  let totalSpentAll = 0;
  let totalReturnedAll = 0;
  let activePeopleCount = 0;
  let overdrawnPeopleCount = 0;
  let settledPeopleCount = 0;

  for (const person of people) {
    const summary = calculatePersonSummary(person, allTransactions);
    netPoolBalance = roundCurrency(netPoolBalance + summary.remainingBalance);
    totalReceivedAll = roundCurrency(totalReceivedAll + summary.totalReceived);
    totalSpentAll = roundCurrency(totalSpentAll + summary.totalSpent);
    totalReturnedAll = roundCurrency(totalReturnedAll + summary.totalReturned);

    if (summary.remainingBalance > 0) {
      positiveEnvelopesSum = roundCurrency(positiveEnvelopesSum + summary.remainingBalance);
      activePeopleCount++;
    } else if (summary.remainingBalance < 0) {
      overdrawnSum = roundCurrency(overdrawnSum + Math.abs(summary.remainingBalance));
      overdrawnPeopleCount++;
    } else {
      settledPeopleCount++;
    }
  }

  return {
    netPoolBalance,
    positiveEnvelopesSum,
    overdrawnSum,
    totalReceivedAll,
    totalSpentAll,
    totalReturnedAll,
    activePeopleCount,
    overdrawnPeopleCount,
    settledPeopleCount,
  };
}

export function reconcilePhysicalCash(
  expectedPoolBalance: number,
  countedCash: number
): CashReconciliationResult {
  const expected = roundCurrency(expectedPoolBalance);
  const counted = roundCurrency(countedCash);
  const difference = roundCurrency(counted - expected);

  if (Math.abs(difference) < 0.01) {
    return {
      expected,
      counted,
      difference: 0,
      status: 'exact',
      message: 'Every single dollar matches! Your combined purse equals everyone’s leftover money.',
    };
  }

  if (difference > 0) {
    return {
      expected,
      counted,
      difference,
      status: 'surplus',
      message: 'You have extra money in your purse beyond what is recorded for people’s tasks.',
    };
  }

  return {
    expected,
    counted,
    difference,
    status: 'short',
    message: 'Your purse has less cash than the recorded leftover total. Check if you forgot to log an expense.',
  };
}

export interface TransactionFormValidationInput {
  personMode: 'existing' | 'new';
  personId?: string;
  newPersonName?: string;
  newPersonPurpose?: string;
  amountStr: string;
  description: string;
}

export function validateTransactionInput(input: TransactionFormValidationInput): {
  valid: boolean;
  error?: string;
  parsedAmount?: number;
} {
  if (input.personMode === 'existing') {
    if (!input.personId || input.personId.trim() === '') {
      return { valid: false, error: 'Please select whose money this is for.' };
    }
  } else {
    if (!input.newPersonName || input.newPersonName.trim().length < 2) {
      return { valid: false, error: 'Please enter the person’s name (at least 2 letters).' };
    }
    if (!input.newPersonPurpose || input.newPersonPurpose.trim().length < 2) {
      return { valid: false, error: 'Please write what task or purpose they sent the money for.' };
    }
  }

  const cleanedAmount = input.amountStr.replace(/,/g, '').trim();
  if (!cleanedAmount) {
    return { valid: false, error: 'Please enter an amount greater than zero.' };
  }

  const parsed = Number(cleanedAmount);
  if (Number.isNaN(parsed) || !Number.isFinite(parsed) || parsed <= 0) {
    return { valid: false, error: 'Please enter a valid positive number for the amount.' };
  }

  if (!input.description || input.description.trim().length < 2) {
    return {
      valid: false,
      error: 'Please add a short note describing this money (e.g., "Sent cash" or "Paid tailor").',
    };
  }

  return {
    valid: true,
    parsedAmount: roundCurrency(parsed),
  };
}

export function generatePersonShareSummary(
  summary: PersonSummary,
  currencySymbol: string = '$'
): string {
  const { person, totalReceived, totalSpent, totalReturned, remainingBalance, transactions } = summary;
  const lines: string[] = [
    `Money & Task Summary for ${person.name}`,
    `Task: ${person.purposeTitle}`,
    `----------------------------------------`,
    `Total Money Sent: ${formatMoney(totalReceived, currencySymbol)}`,
    `Total Money Used: ${formatMoney(totalSpent, currencySymbol)}`,
  ];

  if (totalReturned > 0) {
    lines.push(`Returned to You: ${formatMoney(totalReturned, currencySymbol)}`);
  }

  if (remainingBalance >= 0) {
    lines.push(`Money Left With Me: ${formatMoney(remainingBalance, currencySymbol)}`);
  } else {
    lines.push(`Extra Spent (Owed Back): ${formatMoney(Math.abs(remainingBalance), currencySymbol)}`);
  }

  if (transactions.length > 0) {
    lines.push(`----------------------------------------`);
    lines.push(`Activity Breakdown:`);
    const chronological = [...transactions].sort((a, b) => a.createdAt - b.createdAt);
    for (const tx of chronological) {
      const sign = tx.type === 'received' ? '+' : '-';
      const label =
        tx.type === 'received' ? 'Received' : tx.type === 'returned' ? 'Returned' : 'Used';
      lines.push(
        `• ${tx.date}: ${sign}${formatMoney(tx.amount, currencySymbol)} (${label} — ${tx.description})`
      );
    }
  }

  return lines.join('\n');
}

export const INITIAL_PEOPLE: PersonAccount[] = [
  {
    id: 'person-salma',
    name: 'Auntie Salma',
    relationship: 'Sister',
    purposeTitle: 'Wedding Tailor & Embroidery Work',
    notes: 'Keep lace and dyeing receipts for her daughter’s outfit.',
    tasks: [
      { id: 't-salma-1', text: 'Buy pure chiffon fabric from market', completed: true },
      { id: 't-salma-2', text: 'Pay master tailor advance', completed: true },
      { id: 't-salma-3', text: 'Pick up gold lace and buttons', completed: false },
      { id: 't-salma-4', text: 'Pay final stitching balance on Friday', completed: false },
    ],
    createdAt: 1729400000000,
  },
  {
    id: 'person-tariq',
    name: 'Uncle Tariq',
    relationship: 'Brother',
    purposeTitle: 'Monthly Neighborhood Charity & Ration Bags',
    notes: 'Sent money to distribute 8 family grocery packages.',
    tasks: [
      { id: 't-tariq-1', text: 'Order flour, rice, and cooking oil bags', completed: true },
      { id: 't-tariq-2', text: 'Pay delivery rickshaw helper', completed: true },
      { id: 't-tariq-3', text: 'Buy dates and tea packets for remaining 2 families', completed: false },
    ],
    createdAt: 1729410000000,
  },
  {
    id: 'person-nadia',
    name: 'Nadia Baji',
    relationship: 'Neighbor',
    purposeTitle: 'Mother’s Pharmacy & Lab Medicine',
    notes: 'Blood pressure & diabetes monthly refill.',
    tasks: [
      { id: 't-nadia-1', text: 'Buy insulin pens & strips from pharmacy', completed: true },
      { id: 't-nadia-2', text: 'Pick up vitamin D & calcium tablets', completed: false },
    ],
    createdAt: 1729420000000,
  },
  {
    id: 'person-hamza',
    name: 'Cousin Hamza',
    relationship: 'Nephew',
    purposeTitle: 'Kitchen Spice & Homemade Pickles Order',
    notes: 'Preparing jars before his flight on Sunday.',
    tasks: [
      { id: 't-hamza-1', text: 'Buy mustard oil, garlic, and raw mangoes', completed: true },
      { id: 't-hamza-2', text: 'Buy 4 airtight glass jars for packing', completed: true },
    ],
    createdAt: 1729430000000,
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    personId: 'person-salma',
    type: 'received',
    amount: 450,
    description: 'Cash handed over for wedding fabric & stitching',
    date: '2026-10-16',
    createdAt: 1729400100000,
  },
  {
    id: 'tx-2',
    personId: 'person-salma',
    type: 'spent',
    amount: 180,
    description: 'Bought pure chiffon & silk lining from Bazaar',
    date: '2026-10-17',
    createdAt: 1729405000000,
  },
  {
    id: 'tx-3',
    personId: 'person-salma',
    type: 'spent',
    amount: 95,
    description: 'Paid Master Tailor stitching advance',
    date: '2026-10-19',
    createdAt: 1729409000000,
  },
  {
    id: 'tx-4',
    personId: 'person-tariq',
    type: 'received',
    amount: 600,
    description: 'Sent money for monthly charity ration bags',
    date: '2026-10-18',
    createdAt: 1729410100000,
  },
  {
    id: 'tx-5',
    personId: 'person-tariq',
    type: 'spent',
    amount: 420,
    description: 'Wholesale store: 8 bags of flour, rice, pulses & oil',
    date: '2026-10-19',
    createdAt: 1729415000000,
  },
  {
    id: 'tx-6',
    personId: 'person-tariq',
    type: 'spent',
    amount: 30,
    description: 'Paid loader delivery to distribute bags',
    date: '2026-10-20',
    createdAt: 1729418000000,
  },
  {
    id: 'tx-7',
    personId: 'person-nadia',
    type: 'received',
    amount: 200,
    description: 'Given cash for pharmacy refill',
    date: '2026-10-20',
    createdAt: 1729420100000,
  },
  {
    id: 'tx-8',
    personId: 'person-nadia',
    type: 'spent',
    amount: 170,
    description: 'Bought insulin pens and test strips',
    date: '2026-10-21',
    createdAt: 1729425000000,
  },
  {
    id: 'tx-9',
    personId: 'person-hamza',
    type: 'received',
    amount: 120,
    description: 'Sent money for homemade pickles & spices',
    date: '2026-10-19',
    createdAt: 1729430100000,
  },
  {
    id: 'tx-10',
    personId: 'person-hamza',
    type: 'spent',
    amount: 135,
    description: 'Bought spices, oil, mangoes & 4 travel jars',
    date: '2026-10-21',
    createdAt: 1729435000000,
  },
];
