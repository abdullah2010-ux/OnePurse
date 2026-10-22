import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  formatMoney,
  validateTransactionInput,
  type PersonSummary,
  type TransactionType,
} from '../utils/ledgerLogic';

interface TransactionModalProps {
  isOpen: boolean;
  initialType: TransactionType;
  initialPersonId?: string;
  initialDescription?: string;
  personSummaries: PersonSummary[];
  currency: string;
  onClose: () => void;
  onSubmitTransaction: (payload: {
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
  }) => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  initialType,
  initialPersonId,
  initialDescription,
  personSummaries,
  currency,
  onClose,
  onSubmitTransaction,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [txType, setTxType] = useState<TransactionType>(initialType);
  const [personMode, setPersonMode] = useState<'existing' | 'new'>('existing');
  const [selectedPersonId, setSelectedPersonId] = useState<string>('');
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonRelationship, setNewPersonRelationship] = useState('Family / Relative');
  const [newPersonPurpose, setNewPersonPurpose] = useState('');
  const [newPersonTasksRaw, setNewPersonTasksRaw] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayStr);
  const [markTaskDone, setMarkTaskDone] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTxType(initialType);
      if (initialPersonId) {
        setPersonMode('existing');
        setSelectedPersonId(initialPersonId);
      } else if (personSummaries.length > 0) {
        setPersonMode('existing');
        setSelectedPersonId(personSummaries[0].person.id);
      } else {
        setPersonMode('new');
        setSelectedPersonId('');
      }
      setNewPersonName('');
      setNewPersonRelationship('Sister / Brother');
      setNewPersonPurpose('');
      setNewPersonTasksRaw('');
      setAmountStr('');
      setDescription(initialDescription || '');
      setDate(new Date().toISOString().split('T')[0]);
      setErrorMsg(null);
    }
  }, [isOpen, initialType, initialPersonId, initialDescription, personSummaries]);

  if (!isOpen) return null;

  const activeSummary = personSummaries.find((s) => s.person.id === selectedPersonId);
  const uncompletedTasks =
    activeSummary?.person.tasks.filter((t) => !t.completed) || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const validation = validateTransactionInput({
      personMode,
      personId: selectedPersonId,
      newPersonName,
      newPersonPurpose,
      amountStr,
      description,
    });

    if (!validation.valid || !validation.parsedAmount) {
      setErrorMsg(validation.error || 'Please check the form fields.');
      return;
    }

    onSubmitTransaction({
      type: txType,
      personMode,
      personId: personMode === 'existing' ? selectedPersonId : undefined,
      newPersonName: personMode === 'new' ? newPersonName.trim() : undefined,
      newPersonRelationship:
        personMode === 'new' ? newPersonRelationship.trim() : undefined,
      newPersonPurpose: personMode === 'new' ? newPersonPurpose.trim() : undefined,
      newPersonTasksRaw: personMode === 'new' ? newPersonTasksRaw.trim() : undefined,
      amount: validation.parsedAmount,
      description: description.trim(),
      date,
      markTaskCompletedText:
        txType === 'spent' && markTaskDone ? description.trim() : undefined,
    });

    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="transaction-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white border border-stone-200 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-xl my-8">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-stone-200">
          <h2
            id="transaction-modal-title"
            className="text-xl font-bold text-stone-900 font-display"
          >
            {txType === 'received'
              ? 'Add Money Received Into Purse'
              : 'Record Money Used From Purse'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="min-h-[40px] min-w-[40px] rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher: Money Received vs Money Used */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-xl mt-5">
          <button
            type="button"
            onClick={() => {
              setTxType('received');
              setErrorMsg(null);
            }}
            className={`min-h-[42px] px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
              txType === 'received'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-stone-700 hover:text-stone-950'
            }`}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Money Received (+)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTxType('spent');
              if (personSummaries.length > 0) {
                setPersonMode('existing');
              }
              setErrorMsg(null);
            }}
            className={`min-h-[42px] px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
              txType === 'spent'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-700 hover:text-stone-950'
            }`}
          >
            <Minus className="w-4 h-4 stroke-[2.5] text-red-400" />
            <span>Money Used (-)</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
          {errorMsg && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm font-medium flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Person Selection: Existing Person vs New Person */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="person-select"
                className="text-xs font-semibold text-stone-800"
              >
                Whose money is this?
              </label>

              {personSummaries.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setPersonMode('existing')}
                    className={`font-semibold px-2 py-0.5 rounded ${
                      personMode === 'existing'
                        ? 'bg-stone-900 text-white'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Existing Person
                  </button>
                  <button
                    type="button"
                    onClick={() => setPersonMode('new')}
                    className={`font-semibold px-2 py-0.5 rounded ${
                      personMode === 'new'
                        ? 'bg-emerald-700 text-white'
                        : 'text-emerald-800 hover:underline'
                    }`}
                  >
                    + New Person
                  </button>
                </div>
              )}
            </div>

            {personMode === 'existing' ? (
              <div>
                <select
                  id="person-select"
                  value={selectedPersonId}
                  onChange={(e) => setSelectedPersonId(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 text-sm font-medium bg-[#FAF9F6] border border-stone-300 rounded-xl focus:outline-2 focus:outline-emerald-700"
                >
                  {personSummaries.map((s) => (
                    <option key={s.person.id} value={s.person.id}>
                      {s.person.name} — {s.person.purposeTitle} ({formatMoney(s.remainingBalance, currency)} left)
                    </option>
                  ))}
                </select>

                {/* Helpful live balance banner for the chosen person */}
                {activeSummary && (
                  <div className="mt-2 p-3 rounded-xl bg-[#FAF9F6] border border-stone-200/90 flex items-center justify-between text-xs">
                    <span className="text-stone-600">
                      {activeSummary.person.name}’s current money left with you:
                    </span>
                    <span
                      className={`font-mono tabular-nums font-bold text-sm ${
                        activeSummary.remainingBalance < 0
                          ? 'text-red-700'
                          : 'text-emerald-800'
                      }`}
                    >
                      {formatMoney(activeSummary.remainingBalance, currency)}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 p-4 rounded-2xl bg-[#FAF9F6] border border-stone-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="new-person-name"
                      className="block text-xs font-semibold text-stone-700 mb-1"
                    >
                      Person’s Name *
                    </label>
                    <input
                      id="new-person-name"
                      type="text"
                      value={newPersonName}
                      onChange={(e) => setNewPersonName(e.target.value)}
                      placeholder="e.g. Brother Bilal, Auntie Zohra"
                      className="w-full min-h-[42px] px-3 py-2 text-sm bg-white border border-stone-300 rounded-xl focus:outline-2 focus:outline-emerald-700"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="new-person-rel"
                      className="block text-xs font-semibold text-stone-700 mb-1"
                    >
                      Relation
                    </label>
                    <input
                      id="new-person-rel"
                      type="text"
                      value={newPersonRelationship}
                      onChange={(e) => setNewPersonRelationship(e.target.value)}
                      placeholder="e.g. Brother"
                      className="w-full min-h-[42px] px-3 py-2 text-sm bg-white border border-stone-300 rounded-xl focus:outline-2 focus:outline-emerald-700"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="new-person-purpose"
                    className="block text-xs font-semibold text-stone-700 mb-1"
                  >
                    What is this money for? (Task / Purpose) *
                  </label>
                  <input
                    id="new-person-purpose"
                    type="text"
                    value={newPersonPurpose}
                    onChange={(e) => setNewPersonPurpose(e.target.value)}
                    placeholder="e.g. Buy winter blankets & tailor clothes"
                    className="w-full min-h-[42px] px-3 py-2 text-sm bg-white border border-stone-300 rounded-xl focus:outline-2 focus:outline-emerald-700"
                  />
                </div>

                <div>
                  <label
                    htmlFor="new-person-tasks"
                    className="block text-xs font-semibold text-stone-700 mb-1"
                  >
                    Specific Tasks Checklist (Optional, comma separated)
                  </label>
                  <input
                    id="new-person-tasks"
                    type="text"
                    value={newPersonTasksRaw}
                    onChange={(e) => setNewPersonTasksRaw(e.target.value)}
                    placeholder="e.g. Buy 3 blankets, Pay delivery fee"
                    className="w-full min-h-[42px] px-3 py-2 text-sm bg-white border border-stone-300 rounded-xl focus:outline-2 focus:outline-emerald-700"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Amount Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="transaction-amount"
                className="text-xs font-semibold text-stone-800"
              >
                {txType === 'received'
                  ? `Amount Received (${currency}) *`
                  : `Amount Used / Spent (${currency}) *`}
              </label>

              {txType === 'spent' &&
                personMode === 'existing' &&
                activeSummary &&
                activeSummary.remainingBalance > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setAmountStr(String(activeSummary.remainingBalance))
                    }
                    className="text-xs font-semibold text-emerald-800 hover:underline"
                  >
                    Use full remaining ({formatMoney(activeSummary.remainingBalance, currency)})
                  </button>
                )}
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-mono font-semibold text-stone-500">
                {currency}
              </span>
              <input
                id="transaction-amount"
                type="number"
                step="any"
                min="0"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0.00"
                className="w-full min-h-[48px] pl-12 pr-4 py-2.5 text-xl font-mono tabular-nums font-bold bg-[#FAF9F6] border border-stone-300 rounded-xl focus:outline-2 focus:outline-emerald-700"
              />
            </div>
          </div>

          {/* Quick Task Picker when spending money */}
          {txType === 'spent' &&
            personMode === 'existing' &&
            uncompletedTasks.length > 0 && (
              <div>
                <div className="text-xs font-medium text-stone-600 mb-1.5">
                  Tap a pending task for {activeSummary?.person.name} to fill the note:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {uncompletedTasks.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setDescription(t.text)}
                      className={`px-2.5 py-1.5 text-xs rounded-lg border text-left transition-colors ${
                        description === t.text
                          ? 'bg-stone-900 text-white border-stone-900 font-medium'
                          : 'bg-[#FAF9F6] text-stone-700 border-stone-300 hover:bg-stone-200/70'
                      }`}
                    >
                      {t.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

          {/* Description / Note */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label
                htmlFor="transaction-note"
                className="block text-xs font-semibold text-stone-800 mb-1.5"
              >
                {txType === 'received'
                  ? 'Note (How / why was it given?) *'
                  : 'What did you spend this money on? *'}
              </label>
              <input
                id="transaction-note"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  txType === 'received'
                    ? 'e.g. Cash given at home for blankets'
                    : 'e.g. Bought 3 wool blankets from bazaar'
                }
                className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-[#FAF9F6] border border-stone-300 rounded-xl focus:outline-2 focus:outline-emerald-700"
              />
            </div>

            <div>
              <label
                htmlFor="transaction-date"
                className="block text-xs font-semibold text-stone-800 mb-1.5"
              >
                Date
              </label>
              <input
                id="transaction-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 text-sm font-mono bg-[#FAF9F6] border border-stone-300 rounded-xl focus:outline-2 focus:outline-emerald-700"
              />
            </div>
          </div>

          {txType === 'spent' &&
            personMode === 'existing' &&
            uncompletedTasks.some(
              (t) => t.text.toLowerCase() === description.trim().toLowerCase()
            ) && (
              <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={markTaskDone}
                  onChange={(e) => setMarkTaskDone(e.target.checked)}
                  className="rounded border-stone-300 text-emerald-700 focus:ring-emerald-700 w-4 h-4"
                />
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  Also mark this task as completed on {activeSummary?.person.name}’s checklist
                </span>
              </label>
            )}

          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`min-h-[44px] px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap ${
                txType === 'received'
                  ? 'bg-emerald-700 hover:bg-emerald-800'
                  : 'bg-stone-900 hover:bg-stone-800'
              }`}
            >
              {txType === 'received' ? (
                <>
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Save Money Received</span>
                </>
              ) : (
                <>
                  <Minus className="w-4 h-4 stroke-[2.5]" />
                  <span>Deduct Money Used</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
