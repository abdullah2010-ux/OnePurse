import React, { useState } from 'react';
import {
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ReceiptText,
  CheckSquare,
  Square,
} from 'lucide-react';
import { formatMoney, type PersonSummary } from '../utils/ledgerLogic';

interface PersonFundCardProps {
  summary: PersonSummary;
  currency: string;
  onAddMoney: (personId: string) => void;
  onSpendMoney: (personId: string, prefillDescription?: string) => void;
  onOpenDetails: (personId: string) => void;
  onToggleTask: (personId: string, taskId: string) => void;
  onAddTask: (personId: string, text: string) => void;
}

export const PersonFundCard: React.FC<PersonFundCardProps> = ({
  summary,
  currency,
  onAddMoney,
  onSpendMoney,
  onOpenDetails,
  onToggleTask,
  onAddTask,
}) => {
  const {
    person,
    totalReceived,
    totalSpent,
    totalReturned,
    remainingBalance,
    percentUsed,
    status,
    transactions,
    completedTasksCount,
    totalTasksCount,
  } = summary;

  const [newTaskText, setNewTaskText] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTaskText.trim();
    if (!trimmed) return;
    onAddTask(person.id, trimmed);
    setNewTaskText('');
    setShowAddTask(false);
  };

  const renderStatusText = () => {
    if (status === 'overdrawn') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>Spent {formatMoney(Math.abs(remainingBalance), currency)} extra (Owed to you)</span>
        </span>
      );
    }
    if (status === 'low') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>Running low ({100 - percentUsed}% left)</span>
        </span>
      );
    }
    if (status === 'settled') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-stone-500">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          <span>All settled · No balance left</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-800">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
        <span>Money available in your purse</span>
      </span>
    );
  };

  const latestTx = transactions[0];

  return (
    <article
      data-testid={`person-card-${person.id}`}
      className="bg-white border border-stone-200/90 rounded-2xl p-6 flex flex-col justify-between transition-colors hover:border-stone-300"
    >
      <div>
        {/* Top Header: Clean unboxed metadata + Title + Remaining Money */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-500">
              <span>{person.relationship || 'Family / Friend'}</span>
              <span aria-hidden="true">·</span>
              <span>
                {totalTasksCount > 0
                  ? `${completedTasksCount}/${totalTasksCount} tasks done`
                  : 'No checklist items'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-stone-900 mt-1 truncate">
              {person.name}
            </h2>
            <p className="text-sm font-medium text-stone-700 mt-0.5">
              {person.purposeTitle}
            </p>
          </div>

          {/* Money Left Readout */}
          <div className="text-right shrink-0">
            <div className="text-xs font-medium text-stone-500">
              {remainingBalance < 0 ? 'Owed to You' : 'Money Left'}
            </div>
            <div
              data-testid={`remaining-balance-${person.id}`}
              className={`text-2xl sm:text-3xl font-bold font-mono tabular-nums tracking-tight mt-0.5 ${
                remainingBalance < 0
                  ? 'text-red-700'
                  : remainingBalance === 0
                  ? 'text-stone-400'
                  : 'text-emerald-800'
              }`}
            >
              {formatMoney(remainingBalance, currency)}
            </div>
          </div>
        </div>

        {/* Status & Progress Bar */}
        <div className="mt-4 pt-4 border-t border-stone-200/80">
          <div className="flex items-center justify-between gap-2 mb-2">
            {renderStatusText()}
            <span className="text-xs font-mono tabular-nums text-stone-600">
              Used {formatMoney(totalSpent, currency)} of {formatMoney(totalReceived, currency)}
              {totalReturned > 0 ? ` · Returned ${formatMoney(totalReturned, currency)}` : ''}
            </span>
          </div>

          <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
            <div
              style={{ width: `${percentUsed}%` }}
              className={`h-full transition-all rounded-full ${
                status === 'overdrawn'
                  ? 'bg-red-600'
                  : status === 'low'
                  ? 'bg-amber-600'
                  : 'bg-emerald-700'
              }`}
            />
          </div>
        </div>

        {/* Tasks Checklist */}
        <div className="mt-4 pt-4 border-t border-stone-200/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-stone-700">
              Tasks &amp; Errands for {person.name}
            </span>
            <button
              type="button"
              onClick={() => setShowAddTask((prev) => !prev)}
              className="text-xs font-medium text-emerald-800 hover:underline focus-visible:outline-2 focus-visible:outline-emerald-700 rounded-xs"
            >
              {showAddTask ? 'Cancel' : '+ Add task item'}
            </button>
          </div>

          {showAddTask && (
            <form onSubmit={handleCreateTask} className="flex items-center gap-2 mb-3">
              <label htmlFor={`new-task-${person.id}`} className="sr-only">
                New task for {person.name}
              </label>
              <input
                id={`new-task-${person.id}`}
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="e.g. Buy lace from market..."
                className="flex-1 min-h-[38px] px-3 py-1.5 text-xs bg-[#FAF9F6] border border-stone-300 rounded-lg focus:outline-2 focus:outline-emerald-700"
              />
              <button
                type="submit"
                className="min-h-[38px] px-3 py-1.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg whitespace-nowrap shrink-0"
              >
                Save Task
              </button>
            </form>
          )}

          {person.tasks.length > 0 ? (
            <ul className="space-y-1.5">
              {person.tasks.slice(0, 4).map((task) => (
                <li
                  key={task.id}
                  className="flex items-center justify-between gap-2 text-xs group"
                >
                  <button
                    type="button"
                    onClick={() => onToggleTask(person.id, task.id)}
                    aria-label={`Mark "${task.text}" as ${
                      task.completed ? 'incomplete' : 'completed'
                    }`}
                    className="flex items-center gap-2 text-left py-1 text-stone-800 hover:text-stone-950 flex-1 min-w-0 focus-visible:outline-2 focus-visible:outline-emerald-700 rounded-xs"
                  >
                    {task.completed ? (
                      <CheckSquare className="w-4 h-4 text-emerald-700 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-stone-400 shrink-0" />
                    )}
                    <span
                      className={`truncate ${
                        task.completed ? 'line-through text-stone-400' : 'text-stone-800'
                      }`}
                    >
                      {task.text}
                    </span>
                  </button>

                  {!task.completed && (
                    <button
                      type="button"
                      onClick={() => onSpendMoney(person.id, task.text)}
                      className="text-[11px] font-medium text-stone-500 hover:text-red-700 whitespace-nowrap shrink-0 px-1.5 py-0.5 rounded hover:bg-stone-100"
                    >
                      Log cost
                    </button>
                  )}
                </li>
              ))}
              {person.tasks.length > 4 && (
                <li className="text-xs text-stone-500 pt-1">
                  + {person.tasks.length - 4} more tasks in details
                </li>
              )}
            </ul>
          ) : (
            <p className="text-xs text-stone-500 py-1">
              No specific errands listed yet. Click &ldquo;+ Add task item&rdquo; to list what needs to be done.
            </p>
          )}
        </div>

        {/* Latest activity line */}
        {latestTx && (
          <div className="mt-3 pt-3 border-t border-stone-100 text-xs text-stone-500 flex items-center justify-between gap-2">
            <span className="truncate">
              Latest: {latestTx.description}
            </span>
            <span className="font-mono tabular-nums shrink-0 font-medium text-stone-700">
              {latestTx.type === 'received' ? '+' : '-'}
              {formatMoney(latestTx.amount, currency)}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Action Bar: 44px minimum touch targets */}
      <div className="mt-5 pt-4 border-t border-stone-200/80 grid grid-cols-12 gap-2.5">
        <button
          type="button"
          onClick={() => onSpendMoney(person.id)}
          aria-label={`Use Money for ${person.name}`}
          className="col-span-5 min-h-[44px] px-3 py-2 text-xs sm:text-sm font-semibold text-stone-900 bg-[#FAF9F6] hover:bg-red-50 hover:text-red-900 hover:border-red-300 border border-stone-300 rounded-xl transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <Minus className="w-4 h-4 text-red-700 shrink-0 stroke-[2.5]" />
          <span>Use Money</span>
        </button>

        <button
          type="button"
          onClick={() => onAddMoney(person.id)}
          aria-label={`Add Money for ${person.name}`}
          className="col-span-5 min-h-[44px] px-3 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4 shrink-0 stroke-[2.5]" />
          <span>Add Money</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenDetails(person.id)}
          aria-label={`Details for ${person.name}`}
          title={`View full history and receipt for ${person.name}`}
          className="col-span-2 min-h-[44px] px-2 py-2 text-xs font-semibold text-stone-700 bg-[#FAF9F6] hover:bg-stone-200/70 border border-stone-300 rounded-xl transition-colors flex items-center justify-center shrink-0"
        >
          <ReceiptText className="w-4 h-4" />
        </button>
      </div>
    </article>
  );
};
