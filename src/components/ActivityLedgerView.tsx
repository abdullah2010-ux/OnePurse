import React, { useState } from 'react';
import { Search, Trash2, Plus, Minus } from 'lucide-react';
import {
  formatMoney,
  type PersonAccount,
  type Transaction,
} from '../utils/ledgerLogic';

interface ActivityLedgerViewProps {
  people: PersonAccount[];
  transactions: Transaction[];
  currency: string;
  onDeleteTransaction: (txId: string) => void;
  onOpenReceiveModal: () => void;
  onOpenSpendModal: () => void;
}

export const ActivityLedgerView: React.FC<ActivityLedgerViewProps> = ({
  people,
  transactions,
  currency,
  onDeleteTransaction,
  onOpenReceiveModal,
  onOpenSpendModal,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'received' | 'spent' | 'returned'>('all');
  const [filterPersonId, setFilterPersonId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const personMap = new Map<string, PersonAccount>(people.map((p) => [p.id, p]));

  const filteredTransactions = [...transactions]
    .sort((a, b) => b.createdAt - a.createdAt)
    .filter((tx) => {
      if (filterType !== 'all' && tx.type !== filterType) return false;
      if (filterPersonId !== 'all' && tx.personId !== filterPersonId) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const person = personMap.get(tx.personId);
        const matchDesc = tx.description.toLowerCase().includes(q);
        const matchPerson = person?.name.toLowerCase().includes(q) || false;
        return matchDesc || matchPerson;
      }
      return true;
    });

  return (
    <section aria-label="Activity Ledger" className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-stone-200/80">
          <div>
            <p className="text-xs font-medium text-stone-500">
              Complete Chronological Log
            </p>
            <h1 className="text-2xl font-bold text-stone-900 mt-0.5">
              Every Money Received &amp; Used Entry
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenReceiveModal}
              className="min-h-[42px] px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Received</span>
            </button>
            <button
              type="button"
              onClick={onOpenSpendModal}
              className="min-h-[42px] px-4 py-2 text-xs sm:text-sm font-semibold text-stone-900 bg-[#FAF9F6] hover:bg-stone-200/80 border border-stone-300 rounded-xl flex items-center gap-1.5 whitespace-nowrap"
            >
              <Minus className="w-4 h-4 text-red-700 stroke-[2.5]" />
              <span>Record Used</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="pt-5 flex flex-wrap items-center justify-between gap-4">
          {/* Interactive Segmented Filter Control */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-stone-100 rounded-xl">
            {(
              [
                { id: 'all', label: 'All Entries' },
                { id: 'received', label: 'Money Received (+)' },
                { id: 'spent', label: 'Money Used (-)' },
                { id: 'returned', label: 'Returned' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id)}
                className={`min-h-[36px] px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  filterType === tab.id
                    ? 'bg-white text-stone-950 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 flex-1 sm:flex-initial justify-end">
            <label htmlFor="ledger-person-filter" className="sr-only">
              Filter by person
            </label>
            <select
              id="ledger-person-filter"
              value={filterPersonId}
              onChange={(e) => setFilterPersonId(e.target.value)}
              className="min-h-[40px] px-3 py-2 text-xs font-medium bg-[#FAF9F6] border border-stone-300 rounded-xl"
            >
              <option value="all">All People ({people.length})</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <div className="relative flex-1 sm:w-60">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <label htmlFor="ledger-search" className="sr-only">
                Search ledger entries
              </label>
              <input
                id="ledger-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search item or person..."
                className="w-full min-h-[40px] pl-9 pr-3 py-2 text-xs bg-[#FAF9F6] border border-stone-300 rounded-xl focus:outline-2 focus:outline-emerald-700"
              />
            </div>
          </div>
        </div>
      </div>

      {/* High-Density Data Table */}
      <div className="bg-white border border-stone-200/90 rounded-2xl overflow-hidden">
        {filteredTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-[#FAF9F6] text-xs font-semibold text-stone-600">
                  <th className="py-3.5 px-4 sm:px-6">Date</th>
                  <th className="py-3.5 px-4">Person &amp; Task</th>
                  <th className="py-3.5 px-4">What Happened (Note)</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/70 text-xs sm:text-sm">
                {filteredTransactions.map((tx) => {
                  const person = personMap.get(tx.personId);
                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-stone-50/80 transition-colors"
                    >
                      <td className="py-3.5 px-4 sm:px-6 font-mono tabular-nums text-xs text-stone-600 whitespace-nowrap">
                        {tx.date}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-stone-900">
                          {person?.name || 'Unknown'}
                        </div>
                        <div className="text-xs text-stone-500">
                          {person?.purposeTitle}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-stone-800">
                        {tx.description}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-stone-600 whitespace-nowrap">
                        {tx.type === 'received'
                          ? 'Received (+)'
                          : tx.type === 'returned'
                          ? 'Returned (-)'
                          : 'Used (-)'}
                      </td>
                      <td
                        className={`py-3.5 px-4 sm:px-6 text-right font-mono tabular-nums font-semibold whitespace-nowrap ${
                          tx.type === 'received'
                            ? 'text-emerald-800'
                            : 'text-stone-900'
                        }`}
                      >
                        {tx.type === 'received' ? '+' : '-'}
                        {formatMoney(tx.amount, currency)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onDeleteTransaction(tx.id)}
                          aria-label={`Delete transaction ${tx.description}`}
                          className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center text-stone-400 hover:text-red-700 rounded-lg hover:bg-stone-100 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <p className="text-base font-semibold text-stone-800">
              No transactions match this filter.
            </p>
            <p className="text-xs text-stone-500 mt-1">
              Try clearing your search or log a new money received / used entry.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
