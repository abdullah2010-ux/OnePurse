import React from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calculator,
  AlertTriangle,
  Plus,
  Minus,
} from 'lucide-react';
import {
  formatMoney,
  type PersonSummary,
  type PoolSummary,
} from '../utils/ledgerLogic';

interface CombinedPoolBannerProps {
  pool: PoolSummary;
  personSummaries: PersonSummary[];
  currency: string;
  onChangeCurrency: (curr: string) => void;
  onOpenReceiveModal: () => void;
  onOpenSpendModal: () => void;
  onOpenCashCheck: () => void;
  onSelectPerson: (personId: string) => void;
}

const CURRENCIES = [
  { symbol: '$', label: '$ (USD)' },
  { symbol: 'Rs', label: 'Rs (PKR/INR)' },
  { symbol: '£', label: '£ (GBP)' },
  { symbol: '€', label: '€ (EUR)' },
  { symbol: 'AED', label: 'AED' },
  { symbol: 'SAR', label: 'SAR' },
];

const SEGMENT_COLORS = [
  'bg-emerald-700',
  'bg-teal-600',
  'bg-amber-600',
  'bg-sky-700',
  'bg-stone-700',
  'bg-emerald-500',
];

export const CombinedPoolBanner: React.FC<CombinedPoolBannerProps> = ({
  pool,
  personSummaries,
  currency,
  onChangeCurrency,
  onOpenReceiveModal,
  onOpenSpendModal,
  onOpenCashCheck,
  onSelectPerson,
}) => {
  const positiveAccounts = personSummaries.filter((s) => s.remainingBalance > 0);

  return (
    <section
      aria-label="Combined Purse Summary"
      className="bg-white border border-stone-200/90 rounded-2xl p-4 sm:p-6"
    >
      {/* Top Toolbar Row */}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-stone-200/80">
        <div className="max-w-2xl">
          <p className="text-xs font-medium text-stone-500">
            One Combined Purse · No Separate Envelopes Needed
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 mt-0.5 text-balance">
            Keep all money in one place. Track every person’s share automatically.
          </h1>
        </div>

        {/* Workspace Controls: Currency & Reconcile (flex-wrap prevents mobile overflow) */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <label htmlFor="currency-select" className="sr-only">
            Select Currency
          </label>
          <select
            id="currency-select"
            aria-label="Select Currency"
            value={currency}
            onChange={(e) => onChangeCurrency(e.target.value)}
            className="min-h-[40px] px-3 py-1.5 text-xs font-semibold text-stone-700 bg-[#FAF9F6] border border-stone-300 rounded-xl focus-visible:outline-2 focus-visible:outline-emerald-700"
          >
            {CURRENCIES.map((c) => (
              <option key={c.symbol} value={c.symbol}>
                Currency: {c.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onOpenCashCheck}
            className="min-h-[40px] px-3 py-1.5 text-xs font-semibold text-stone-800 bg-[#FAF9F6] hover:bg-stone-200/70 border border-stone-300 rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Calculator className="w-4 h-4 text-emerald-700" />
            <span>Check My Purse Cash</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-4 items-center">
        {/* Dominant Focal Anchor: Total Money in One Place */}
        <div className="lg:col-span-5 pr-0 lg:pr-6 lg:border-r lg:border-stone-200/80">
          <div className="text-xs font-medium text-stone-500">
            Total Money You Should Have in Hand Right Now
          </div>
          <div
            data-testid="combined-pool-balance"
            className="text-3xl sm:text-4xl font-bold font-mono tabular-nums tracking-tight text-stone-950 mt-1"
          >
            {formatMoney(pool.netPoolBalance, currency)}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-600">
            <span>
              Belongs to {pool.activePeopleCount}{' '}
              {pool.activePeopleCount === 1 ? 'person' : 'people'} ({formatMoney(pool.positiveEnvelopesSum, currency)})
            </span>
            {pool.overdrawnSum > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-red-700 font-medium">
                  Minus {formatMoney(pool.overdrawnSum, currency)} spent extra
                </span>
              </>
            )}
          </div>

          {/* Workspace Action Pair */}
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenReceiveModal}
              className="min-h-[42px] px-3.5 py-2 text-xs sm:text-sm font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5] text-emerald-700" />
              <span>Receive Into Purse</span>
            </button>
            <button
              type="button"
              onClick={onOpenSpendModal}
              className="min-h-[42px] px-3.5 py-2 text-xs sm:text-sm font-semibold text-stone-900 bg-[#FAF9F6] hover:bg-stone-200/80 border border-stone-300 rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Minus className="w-4 h-4 stroke-[2.5] text-red-700" />
              <span>Record Money Used</span>
            </button>
          </div>
        </div>

        {/* Right 7 Columns: Breakdown Metrics + Visual Pool Distribution Bar */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-stone-500">
                <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Total Received</span>
              </div>
              <div
                data-testid="total-received-all"
                className="text-xl sm:text-2xl font-semibold font-mono tabular-nums text-stone-900 mt-1"
              >
                {formatMoney(pool.totalReceivedAll, currency)}
              </div>
              <div className="text-xs text-stone-500 mt-0.5">
                All money given to you
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-stone-500">
                <ArrowUpRight className="w-3.5 h-3.5 text-red-700 shrink-0" />
                <span>Total Used on Tasks</span>
              </div>
              <div
                data-testid="total-spent-all"
                className="text-xl sm:text-2xl font-semibold font-mono tabular-nums text-stone-900 mt-1"
              >
                {formatMoney(pool.totalSpentAll, currency)}
              </div>
              <div className="text-xs text-stone-500 mt-0.5">
                Spent from the pool
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-1.5 text-xs font-medium text-stone-500">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>Extra Owed to You</span>
              </div>
              <div
                data-testid="total-overdrawn-all"
                className={`text-xl sm:text-2xl font-semibold font-mono tabular-nums mt-1 ${
                  pool.overdrawnSum > 0 ? 'text-red-700' : 'text-stone-900'
                }`}
              >
                {formatMoney(pool.overdrawnSum, currency)}
              </div>
              <div className="text-xs text-stone-500 mt-0.5">
                {pool.overdrawnPeopleCount > 0
                  ? `${pool.overdrawnPeopleCount} person spent over budget`
                  : 'Nobody is over budget'}
              </div>
            </div>
          </div>

          {/* Visual Pool Share Bar: Who owns the money sitting in your purse */}
          <div className="pt-4 border-t border-stone-200/80">
            <div className="flex items-center justify-between text-xs text-stone-600 mb-2">
              <span className="font-medium">
                How your combined pool is divided by person:
              </span>
              <span className="font-mono tabular-nums text-stone-500">
                {formatMoney(pool.positiveEnvelopesSum, currency)} active shares
              </span>
            </div>

            {positiveAccounts.length > 0 ? (
              <>
                <div className="h-3 w-full rounded-full bg-stone-100 overflow-hidden flex gap-0.5 p-0.5 border border-stone-200">
                  {positiveAccounts.map((acc, idx) => {
                    const widthPct = Math.max(
                      4,
                      Math.round((acc.remainingBalance / pool.positiveEnvelopesSum) * 100)
                    );
                    const colorClass = SEGMENT_COLORS[idx % SEGMENT_COLORS.length];
                    return (
                      <div
                        key={acc.person.id}
                        style={{ width: `${widthPct}%` }}
                        title={`${acc.person.name}: ${formatMoney(acc.remainingBalance, currency)} left`}
                        className={`h-full ${colorClass} first:rounded-l-full last:rounded-r-full transition-all`}
                      />
                    );
                  })}
                </div>

                {/* Unboxed metadata legend with typographic separators */}
                <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-stone-700">
                  {positiveAccounts.map((acc, idx) => (
                    <React.Fragment key={acc.person.id}>
                      {idx > 0 && (
                        <span aria-hidden="true" className="text-stone-300">
                          ·
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => onSelectPerson(acc.person.id)}
                        className="hover:underline text-left focus-visible:outline-2 focus-visible:outline-emerald-700 rounded-xs"
                      >
                        <span className="font-medium text-stone-900">{acc.person.name}:</span>{' '}
                        <span className="font-mono tabular-nums font-semibold text-emerald-800">
                          {formatMoney(acc.remainingBalance, currency)}
                        </span>
                      </button>
                    </React.Fragment>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs text-stone-500">
                No active leftover balances right now. Click &ldquo;Add Money Received&rdquo; when someone gives you money for a task.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
