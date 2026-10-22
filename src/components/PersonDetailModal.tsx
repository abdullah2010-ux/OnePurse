import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Plus,
  Minus,
  Trash2,
  CheckSquare,
  Square,
  RotateCcw,
} from 'lucide-react';
import {
  formatMoney,
  generatePersonShareSummary,
  type PersonSummary,
} from '../utils/ledgerLogic';

interface PersonDetailModalProps {
  summary: PersonSummary | null;
  currency: string;
  onClose: () => void;
  onAddMoney: (personId: string) => void;
  onSpendMoney: (personId: string, prefillDescription?: string) => void;
  onSettleRemaining: (personId: string, remainingAmount: number) => void;
  onDeleteTransaction: (txId: string) => void;
  onToggleTask: (personId: string, taskId: string) => void;
  onAddTask: (personId: string, text: string) => void;
  onDeleteTask: (personId: string, taskId: string) => void;
  onDeletePerson: (personId: string) => void;
}

export const PersonDetailModal: React.FC<PersonDetailModalProps> = ({
  summary,
  currency,
  onClose,
  onAddMoney,
  onSpendMoney,
  onSettleRemaining,
  onDeleteTransaction,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  onDeletePerson,
}) => {
  const [copied, setCopied] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [confirmDeletePerson, setConfirmDeletePerson] = useState(false);

  if (!summary) return null;

  const {
    person,
    totalReceived,
    totalSpent,
    totalReturned,
    remainingBalance,
    transactions,
  } = summary;

  const handleCopySummary = async () => {
    const text = generatePersonShareSummary(summary, currency);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback if clipboard API restricted
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTaskText.trim();
    if (!trimmed) return;
    onAddTask(person.id, trimmed);
    setNewTaskText('');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="person-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white border border-stone-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-xl my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-stone-200">
          <div>
            <p className="text-xs font-medium text-stone-500">
              {person.relationship} · Personal Statement &amp; Tasks
            </p>
            <h2
              id="person-detail-title"
              className="text-2xl font-bold text-stone-900 font-display mt-0.5"
            >
              {person.name}
            </h2>
            <p className="text-sm text-stone-700 mt-0.5">{person.purposeTitle}</p>
            {person.notes && (
              <p className="text-xs text-stone-500 mt-1">{person.notes}</p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close details modal"
            className="min-h-[40px] min-w-[40px] rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Financial Summary Strip */}
        <div className="grid grid-cols-3 gap-4 py-5 border-b border-stone-200">
          <div>
            <div className="text-xs text-stone-500">Total Sent</div>
            <div className="text-lg sm:text-xl font-bold font-mono tabular-nums text-stone-900 mt-0.5">
              {formatMoney(totalReceived, currency)}
            </div>
          </div>

          <div>
            <div className="text-xs text-stone-500">Total Used</div>
            <div className="text-lg sm:text-xl font-bold font-mono tabular-nums text-stone-900 mt-0.5">
              {formatMoney(totalSpent, currency)}
            </div>
            {totalReturned > 0 && (
              <div className="text-[11px] font-mono tabular-nums text-stone-500">
                + {formatMoney(totalReturned, currency)} returned
              </div>
            )}
          </div>

          <div>
            <div className="text-xs text-stone-500">
              {remainingBalance < 0 ? 'Extra Owed to You' : 'Money Left'}
            </div>
            <div
              className={`text-lg sm:text-2xl font-bold font-mono tabular-nums mt-0.5 ${
                remainingBalance < 0
                  ? 'text-red-700'
                  : remainingBalance === 0
                  ? 'text-stone-500'
                  : 'text-emerald-800'
              }`}
            >
              {formatMoney(remainingBalance, currency)}
            </div>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 py-4 border-b border-stone-200">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onSpendMoney(person.id);
              }}
              className="min-h-[40px] px-3.5 py-2 text-xs font-semibold text-stone-900 bg-[#FAF9F6] hover:bg-stone-200/80 border border-stone-300 rounded-xl flex items-center gap-1.5 whitespace-nowrap"
            >
              <Minus className="w-3.5 h-3.5 text-red-700 stroke-[2.5]" />
              <span>Use Money</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onAddMoney(person.id);
              }}
              className="min-h-[40px] px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Money Sent</span>
            </button>

            {remainingBalance > 0 && (
              <button
                type="button"
                onClick={() => onSettleRemaining(person.id, remainingBalance)}
                className="min-h-[40px] px-3.5 py-2 text-xs font-semibold text-stone-700 bg-[#FAF9F6] hover:bg-stone-200/80 border border-stone-300 rounded-xl flex items-center gap-1.5 whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
                <span>Return Leftover ({formatMoney(remainingBalance, currency)})</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleCopySummary}
            className="min-h-[40px] px-3.5 py-2 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-700" />
                <span>Copied Receipt Text!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-emerald-700" />
                <span>Copy Summary for WhatsApp</span>
              </>
            )}
          </button>
        </div>

        {/* Checklist Section */}
        <div className="py-5 border-b border-stone-200">
          <h3 className="text-sm font-bold text-stone-900 mb-3">
            Tasks &amp; Errands Checklist ({person.tasks.filter((t) => t.completed).length}/
            {person.tasks.length})
          </h3>

          <form onSubmit={handleAddTaskSubmit} className="flex gap-2 mb-3">
            <label htmlFor="detail-new-task" className="sr-only">
              Add a task for {person.name}
            </label>
            <input
              id="detail-new-task"
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="Add another errand or item to buy..."
              className="flex-1 min-h-[40px] px-3 py-2 text-xs bg-[#FAF9F6] border border-stone-300 rounded-xl focus:outline-2 focus:outline-emerald-700"
            />
            <button
              type="submit"
              className="min-h-[40px] px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl whitespace-nowrap"
            >
              Add Task
            </button>
          </form>

          {person.tasks.length > 0 ? (
            <ul className="divide-y divide-stone-100">
              {person.tasks.map((task) => (
                <li
                  key={task.id}
                  className="py-2 flex items-center justify-between gap-3 text-xs sm:text-sm"
                >
                  <button
                    type="button"
                    onClick={() => onToggleTask(person.id, task.id)}
                    className="flex items-center gap-2.5 text-left flex-1 text-stone-800"
                  >
                    {task.completed ? (
                      <CheckSquare className="w-4 h-4 text-emerald-700 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-stone-400 shrink-0" />
                    )}
                    <span
                      className={
                        task.completed ? 'line-through text-stone-400' : 'text-stone-900'
                      }
                    >
                      {task.text}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteTask(person.id, task.id)}
                    aria-label={`Remove task ${task.text}`}
                    className="p-1.5 text-stone-400 hover:text-red-700 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-stone-500">No tasks added yet.</p>
          )}
        </div>

        {/* Complete Transaction History for this Person */}
        <div className="py-5">
          <h3 className="text-sm font-bold text-stone-900 mb-3">
            Money Received &amp; Used History ({transactions.length})
          </h3>

          {transactions.length > 0 ? (
            <div className="divide-y divide-stone-200/80 border-t border-b border-stone-200/80">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="py-3 flex items-center justify-between gap-4 text-xs sm:text-sm"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-stone-900">{tx.description}</div>
                    <div className="text-xs text-stone-500 mt-0.5 flex items-center gap-1.5">
                      <span className="font-mono">{tx.date}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {tx.type === 'received'
                          ? 'Money Received'
                          : tx.type === 'returned'
                          ? 'Leftover Returned'
                          : 'Money Used'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`font-mono tabular-nums font-semibold ${
                        tx.type === 'received' ? 'text-emerald-800' : 'text-stone-900'
                      }`}
                    >
                      {tx.type === 'received' ? '+' : '-'}
                      {formatMoney(tx.amount, currency)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeleteTransaction(tx.id)}
                      aria-label={`Delete entry ${tx.description}`}
                      title="Delete this entry"
                      className="p-1.5 text-stone-400 hover:text-red-700 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-stone-500">No transactions recorded yet.</p>
          )}
        </div>

        {/* Footer: Delete Person Account */}
        <div className="pt-4 border-t border-stone-200 flex items-center justify-between gap-4">
          {!confirmDeletePerson ? (
            <button
              type="button"
              onClick={() => setConfirmDeletePerson(true)}
              className="text-xs font-medium text-stone-500 hover:text-red-700 transition-colors"
            >
              Remove {person.name}’s record
            </button>
          ) : (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-red-700 font-semibold">
                Delete {person.name} and all their entries?
              </span>
              <button
                type="button"
                onClick={() => {
                  onDeletePerson(person.id);
                  onClose();
                }}
                className="px-2.5 py-1 bg-red-700 text-white font-semibold rounded-lg"
              >
                Yes, Delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeletePerson(false)}
                className="px-2.5 py-1 bg-stone-200 text-stone-800 font-medium rounded-lg"
              >
                Cancel
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
