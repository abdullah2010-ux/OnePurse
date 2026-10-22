/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, UserPlus, CheckCircle2, Trash2 } from 'lucide-react';
import {
  calculatePersonSummary,
  calculatePoolSummary,
  formatMoney,
  type PersonAccount,
  type Transaction,
  type TransactionType,
} from './utils/ledgerLogic';
import { TopBar, type ActiveTab } from './components/TopBar';
import { CombinedPoolBanner } from './components/CombinedPoolBanner';
import { PersonFundCard } from './components/PersonFundCard';
import { TransactionModal } from './components/TransactionModal';
import { PersonDetailModal } from './components/PersonDetailModal';
import { ActivityLedgerView } from './components/ActivityLedgerView';
import { CashCheckView } from './components/CashCheckView';
import { SummarySheetView } from './components/SummarySheetView';

const LEGACY_KEYS = [
  'onepurse_people_v1',
  'onepurse_transactions_v1',
  'onepurse_prod_people_v2',
  'onepurse_prod_transactions_v2',
  'onepurse_currency_v1',
  'onepurse_auth_accounts_v1',
  'onepurse_auth_session_v1',
];

export default function App() {
  // Ensure any previously stored browser data is cleared so opening or reopening starts completely fresh
  useEffect(() => {
    try {
      for (const key of LEGACY_KEYS) {
        localStorage.removeItem(key);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const [people, setPeople] = useState<PersonAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currency, setCurrency] = useState<string>('$');

  const [activeTab, setActiveTab] = useState<ActiveTab>('people');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'attention' | 'settled'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmResetMain, setConfirmResetMain] = useState(false);

  // Modal states
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [txModalType, setTxModalType] = useState<TransactionType>('received');
  const [txModalPersonId, setTxModalPersonId] = useState<string | undefined>(
    undefined
  );
  const [txModalPrefillNote, setTxModalPrefillNote] = useState<
    string | undefined
  >(undefined);

  const [detailPersonId, setDetailPersonId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const personSummaries = useMemo(
    () => people.map((p) => calculatePersonSummary(p, transactions)),
    [people, transactions]
  );

  const poolSummary = useMemo(
    () => calculatePoolSummary(people, transactions),
    [people, transactions]
  );

  const filteredSummaries = useMemo(() => {
    return personSummaries.filter((s) => {
      if (statusFilter === 'active' && s.remainingBalance <= 0) return false;
      if (
        statusFilter === 'attention' &&
        s.status !== 'low' &&
        s.status !== 'overdrawn'
      ) {
        return false;
      }
      if (statusFilter === 'settled' && s.remainingBalance !== 0) return false;

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchName = s.person.name.toLowerCase().includes(q);
        const matchPurpose = s.person.purposeTitle.toLowerCase().includes(q);
        const matchRel = s.person.relationship.toLowerCase().includes(q);
        const matchTask = s.person.tasks.some((t) =>
          t.text.toLowerCase().includes(q)
        );
        return matchName || matchPurpose || matchRel || matchTask;
      }

      return true;
    });
  }, [personSummaries, statusFilter, searchQuery]);

  const activeDetailSummary = useMemo(
    () =>
      detailPersonId
        ? personSummaries.find((s) => s.person.id === detailPersonId) || null
        : null,
    [detailPersonId, personSummaries]
  );

  // Handlers
  const openAddMoneyModal = (personId?: string) => {
    setTxModalType('received');
    setTxModalPersonId(personId);
    setTxModalPrefillNote(undefined);
    setTxModalOpen(true);
  };

  const openSpendMoneyModal = (personId?: string, prefillNote?: string) => {
    setTxModalType('spent');
    setTxModalPersonId(personId);
    setTxModalPrefillNote(prefillNote);
    setTxModalOpen(true);
  };

  const handleSubmitTransaction = (payload: {
    type: TransactionType;
    personMode: 'existing' | 'new';
    personId?: string;
    newPersonName?: string;
    newPersonRelationship?: string;
    newPersonPurpose?: string;
    newPersonTasksRaw?: string;
    amount: number;
    description: string;
    date: string;
    markTaskCompletedText?: string;
  }) => {
    const now = Date.now();
    let targetPersonId = payload.personId || '';
    let targetPersonName = '';

    if (payload.personMode === 'new') {
      targetPersonId = `person-${now}`;
      targetPersonName = payload.newPersonName || 'New Person';
      const parsedTasks = (payload.newPersonTasksRaw || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .map((text, idx) => ({
          id: `task-${now}-${idx}`,
          text,
          completed: false,
        }));

      const newPerson: PersonAccount = {
        id: targetPersonId,
        name: targetPersonName,
        relationship: payload.newPersonRelationship || 'Family / Friend',
        purposeTitle: payload.newPersonPurpose || 'General Errands',
        tasks: parsedTasks,
        createdAt: now,
      };

      setPeople((prev) => [newPerson, ...prev]);
    } else {
      const existing = people.find((p) => p.id === targetPersonId);
      targetPersonName = existing?.name || 'Person';

      if (payload.markTaskCompletedText) {
        const matchText = payload.markTaskCompletedText.toLowerCase();
        setPeople((prev) =>
          prev.map((p) => {
            if (p.id !== targetPersonId) return p;
            return {
              ...p,
              tasks: p.tasks.map((t) =>
                t.text.toLowerCase() === matchText
                  ? { ...t, completed: true }
                  : t
              ),
            };
          })
        );
      }
    }

    const newTx: Transaction = {
      id: `tx-${now}`,
      personId: targetPersonId,
      type: payload.type,
      amount: payload.amount,
      description: payload.description,
      date: payload.date,
      createdAt: now,
    };

    setTransactions((prev) => [newTx, ...prev]);

    if (payload.type === 'received') {
      showToast(
        `Added ${formatMoney(
          payload.amount,
          currency
        )} received from ${targetPersonName}`
      );
    } else {
      showToast(
        `Deducted ${formatMoney(
          payload.amount,
          currency
        )} used for ${targetPersonName}`
      );
    }
  };

  const handleSettleRemaining = (personId: string, remainingAmount: number) => {
    if (remainingAmount <= 0) return;
    const now = Date.now();
    const person = people.find((p) => p.id === personId);
    const settleTx: Transaction = {
      id: `tx-${now}`,
      personId,
      type: 'returned',
      amount: remainingAmount,
      description: 'Returned leftover money / settled balance',
      date: new Date().toISOString().split('T')[0],
      createdAt: now,
    };
    setTransactions((prev) => [settleTx, ...prev]);
    showToast(
      `Settled ${formatMoney(remainingAmount, currency)} leftover for ${
        person?.name || 'person'
      }`
    );
  };

  const handleDeleteTransaction = (txId: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== txId));
    showToast('Transaction entry removed');
  };

  const handleToggleTask = (personId: string, taskId: string) => {
    setPeople((prev) =>
      prev.map((p) => {
        if (p.id !== personId) return p;
        return {
          ...p,
          tasks: p.tasks.map((t) =>
            t.id === taskId ? { ...t, completed: !t.completed } : t
          ),
        };
      })
    );
  };

  const handleAddTask = (personId: string, text: string) => {
    const newTask = {
      id: `task-${Date.now()}`,
      text,
      completed: false,
    };
    setPeople((prev) =>
      prev.map((p) =>
        p.id === personId ? { ...p, tasks: [...p.tasks, newTask] } : p
      )
    );
  };

  const handleDeleteTask = (personId: string, taskId: string) => {
    setPeople((prev) =>
      prev.map((p) =>
        p.id === personId
          ? { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) }
          : p
      )
    );
  };

  const handleDeletePerson = (personId: string) => {
    setPeople((prev) => prev.filter((p) => p.id !== personId));
    setTransactions((prev) => prev.filter((t) => t.personId !== personId));
    showToast('Person record removed');
  };

  const handleClearAllData = () => {
    setPeople([]);
    setTransactions([]);
    setConfirmResetMain(false);
    showToast('All records cleared');
  };

  return (
    <div id="top" className="min-h-screen flex flex-col bg-[#FAF9F6] text-stone-900 pb-20 md:pb-12">
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenAddMoney={() => openAddMoneyModal(undefined)}
      />

      {/* Live Action Confirmation Toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-16 md:bottom-6 right-4 sm:right-6 z-40 bg-stone-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 text-xs sm:text-sm font-medium"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
        {activeTab === 'people' && (
          <>
            {/* Combined Pool Overview Banner */}
            <CombinedPoolBanner
              pool={poolSummary}
              personSummaries={personSummaries}
              currency={currency}
              onChangeCurrency={setCurrency}
              onOpenReceiveModal={() => openAddMoneyModal(undefined)}
              onOpenSpendModal={() => openSpendMoneyModal(undefined)}
              onOpenCashCheck={() => setActiveTab('cash-check')}
              onSelectPerson={(personId) => setDetailPersonId(personId)}
            />

            {/* People & Tasks Section */}
            <section aria-label="People and Their Tasks" className="space-y-5">
              {people.length > 0 ? (
                <>
                  {/* Filter & Search Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Interactive Segmented Filter Tabs */}
                    <div className="flex flex-wrap items-center gap-1 p-1 bg-stone-200/70 rounded-xl">
                      {(
                        [
                          { id: 'all', label: `All People (${personSummaries.length})` },
                          {
                            id: 'active',
                            label: `Has Money Left (${poolSummary.activePeopleCount})`,
                          },
                          {
                            id: 'attention',
                            label: `Running Low / Owed (${
                              personSummaries.filter(
                                (s) => s.status === 'low' || s.status === 'overdrawn'
                              ).length
                            })`,
                          },
                          {
                            id: 'settled',
                            label: `Settled (${poolSummary.settledPeopleCount})`,
                          },
                        ] as const
                      ).map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setStatusFilter(tab.id)}
                          className={`min-h-[38px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                            statusFilter === tab.id
                              ? 'bg-white text-stone-950 shadow-2xs'
                              : 'text-stone-600 hover:text-stone-900'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Search & Clear All Control */}
                    <div className="flex flex-wrap items-center gap-3 flex-1 sm:flex-initial justify-end">
                      <div className="relative flex-1 sm:w-64">
                        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <label htmlFor="people-search" className="sr-only">
                          Search person or task
                        </label>
                        <input
                          id="people-search"
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search person or task..."
                          className="w-full min-h-[40px] pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-white border border-stone-300 rounded-xl focus:outline-2 focus:outline-emerald-700"
                        />
                      </div>

                      {!confirmResetMain ? (
                        <button
                          type="button"
                          onClick={() => setConfirmResetMain(true)}
                          className="min-h-[40px] px-3 py-2 text-xs font-semibold text-stone-600 hover:text-red-700 bg-white hover:bg-red-50 border border-stone-300 hover:border-red-200 rounded-xl transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Clear All</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 bg-white border border-red-200 px-2.5 py-1 rounded-xl">
                          <span className="text-xs font-semibold text-red-700">Clear all?</span>
                          <button
                            type="button"
                            onClick={handleClearAllData}
                            className="px-2.5 py-1 text-xs font-semibold bg-red-700 text-white rounded-lg"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmResetMain(false)}
                            className="px-2 py-1 text-xs font-medium text-stone-600 hover:text-stone-900"
                          >
                            No
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cards Grid */}
                  {filteredSummaries.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filteredSummaries.map((summary) => (
                        <PersonFundCard
                          key={summary.person.id}
                          summary={summary}
                          currency={currency}
                          onAddMoney={(personId) => openAddMoneyModal(personId)}
                          onSpendMoney={(personId, prefill) =>
                            openSpendMoneyModal(personId, prefill)
                          }
                          onOpenDetails={(personId) => setDetailPersonId(personId)}
                          onToggleTask={handleToggleTask}
                          onAddTask={handleAddTask}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white border border-stone-200/90 rounded-2xl p-10 text-center max-w-xl mx-auto">
                      <h2 className="text-lg font-bold text-stone-900">
                        No people match your current filter
                      </h2>
                      <p className="text-sm text-stone-600 mt-1">
                        Try switching back to &ldquo;All People&rdquo; or clearing your search box.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter('all');
                          setSearchQuery('');
                        }}
                        className="mt-4 min-h-[42px] px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl"
                      >
                        Show All People
                      </button>
                    </div>
                  )}
                </>
              ) : (
                /* Clean Brand-New Website Empty State */
                <div
                  data-testid="empty-ledger-state"
                  className="bg-white border border-stone-200/90 rounded-2xl p-8 sm:p-12 text-center max-w-2xl mx-auto"
                >
                  <p className="text-xs font-medium text-stone-500">
                    Ready for Your First Entry
                  </p>
                  <h2 className="text-xl sm:text-2xl font-bold text-stone-900 mt-1">
                    No People or Tasks Added Yet
                  </h2>
                  <p className="text-sm text-stone-600 mt-2 max-w-lg mx-auto leading-relaxed">
                    When someone gives you money for a task or errand, add it here. You can keep everyone’s cash together in one place and deduct expenses from each person’s balance as you use it.
                  </p>

                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => openAddMoneyModal(undefined)}
                      className="min-h-[46px] px-6 py-3 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl inline-flex items-center gap-2 transition-colors shadow-xs"
                    >
                      <UserPlus className="w-4 h-4 stroke-[2.2]" />
                      <span>Add First Person &amp; Money</span>
                    </button>
                  </div>
                </div>
              )}
            </section>
          </>
        )}

        {activeTab === 'ledger' && (
          <ActivityLedgerView
            people={people}
            transactions={transactions}
            currency={currency}
            onDeleteTransaction={handleDeleteTransaction}
            onOpenReceiveModal={() => openAddMoneyModal(undefined)}
            onOpenSpendModal={() => openSpendMoneyModal(undefined)}
          />
        )}

        {activeTab === 'cash-check' && (
          <CashCheckView pool={poolSummary} currency={currency} />
        )}

        {activeTab === 'summary' && (
          <SummarySheetView
            pool={poolSummary}
            personSummaries={personSummaries}
            currency={currency}
            onClearAllData={handleClearAllData}
            onOpenPersonDetail={(personId) => setDetailPersonId(personId)}
            onOpenAddMoney={() => openAddMoneyModal(undefined)}
          />
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-6 text-xs text-stone-500 flex flex-wrap items-center justify-between gap-4">
        <span>
          OnePurse Household Ledger · Keep all money in one place and deduct by person
        </span>
        <button
          type="button"
          onClick={() => openAddMoneyModal(undefined)}
          className="font-semibold text-emerald-800 hover:underline inline-flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Log New Money Received</span>
        </button>
      </footer>

      {/* Modals */}
      <TransactionModal
        isOpen={txModalOpen}
        initialType={txModalType}
        initialPersonId={txModalPersonId}
        initialDescription={txModalPrefillNote}
        personSummaries={personSummaries}
        currency={currency}
        onClose={() => setTxModalOpen(false)}
        onSubmitTransaction={handleSubmitTransaction}
      />

      <PersonDetailModal
        summary={activeDetailSummary}
        currency={currency}
        onClose={() => setDetailPersonId(null)}
        onAddMoney={(personId) => openAddMoneyModal(personId)}
        onSpendMoney={(personId, prefill) =>
          openSpendMoneyModal(personId, prefill)
        }
        onSettleRemaining={handleSettleRemaining}
        onDeleteTransaction={handleDeleteTransaction}
        onToggleTask={handleToggleTask}
        onAddTask={handleAddTask}
        onDeleteTask={handleDeleteTask}
        onDeletePerson={handleDeletePerson}
      />
    </div>
  );
}
