import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  RotateCcw,
} from 'lucide-react';
import {
  formatMoney,
  reconcilePhysicalCash,
  roundCurrency,
  type PoolSummary,
} from '../utils/ledgerLogic';

interface CashCheckViewProps {
  pool: PoolSummary;
  currency: string;
}

const DEFAULT_DENOMINATIONS = [100, 50, 20, 10, 5, 1];
const PKR_DENOMINATIONS = [5000, 1000, 500, 100, 50, 20];

export const CashCheckView: React.FC<CashCheckViewProps> = ({
  pool,
  currency,
}) => {
  const [mode, setMode] = useState<'direct' | 'notes'>('direct');
  const [directInput, setDirectInput] = useState<string>(
    String(pool.netPoolBalance)
  );
  const denominations =
    currency === 'Rs' ? PKR_DENOMINATIONS : DEFAULT_DENOMINATIONS;

  const [noteCounts, setNoteCounts] = useState<Record<number, string>>({});
  const [bankOrExtraAmount, setBankOrExtraAmount] = useState<string>('0');

  const computedNotesTotal = denominations.reduce((acc, denom) => {
    const count = Number(noteCounts[denom] || '0');
    if (Number.isNaN(count) || count < 0) return acc;
    return roundCurrency(acc + denom * count);
  }, 0);

  const extraNum = Number(bankOrExtraAmount || '0');
  const totalFromNotes = roundCurrency(
    computedNotesTotal + (Number.isNaN(extraNum) ? 0 : extraNum)
  );

  const countedAmount =
    mode === 'direct'
      ? Number(directInput.replace(/,/g, '') || '0')
      : totalFromNotes;

  const safeCounted = Number.isNaN(countedAmount) ? 0 : countedAmount;
  const result = reconcilePhysicalCash(pool.netPoolBalance, safeCounted);

  const handleResetNotes = () => {
    setNoteCounts({});
    setBankOrExtraAmount('0');
  };

  return (
    <section aria-label="Cash Check & Purse Reconciliation" className="space-y-6">
      <div className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-8">
        <div className="max-w-2xl">
          <p className="text-xs font-medium text-stone-500">
            Peace-of-Mind Verification
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
            Check Your Combined Purse Cash
          </h1>
          <p className="text-sm text-stone-600 mt-1.5">
            Because you keep everyone’s money together in one place, you can count the cash in your purse at any time to confirm it matches the exact leftover total recorded here.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-7 pt-6 border-t border-stone-200/80">
          {/* Left 7 Columns: Input Mode */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setMode('direct')}
                className={`min-h-[38px] px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  mode === 'direct'
                    ? 'bg-white text-stone-950 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Enter Total Counted
              </button>
              <button
                type="button"
                onClick={() => setMode('notes')}
                className={`min-h-[38px] px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  mode === 'notes'
                    ? 'bg-white text-stone-950 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Count by Currency Notes
              </button>
            </div>

            {mode === 'direct' ? (
              <div className="space-y-3">
                <label
                  htmlFor="counted-cash-input"
                  className="block text-sm font-semibold text-stone-800"
                >
                  How much money did you count in your purse right now? ({currency})
                </label>
                <div className="relative max-w-md">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-mono font-semibold text-stone-500">
                    {currency}
                  </span>
                  <input
                    id="counted-cash-input"
                    type="number"
                    step="any"
                    value={directInput}
                    onChange={(e) => setDirectInput(e.target.value)}
                    placeholder="0.00"
                    className="w-full min-h-[52px] pl-14 pr-4 py-3 text-2xl font-mono tabular-nums font-bold bg-[#FAF9F6] border border-stone-300 rounded-xl focus:outline-2 focus:outline-emerald-700"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setDirectInput(String(pool.netPoolBalance))}
                    className="px-3 py-1.5 text-xs font-medium text-stone-700 bg-[#FAF9F6] hover:bg-stone-200/70 border border-stone-300 rounded-lg"
                  >
                    Fill Expected ({formatMoney(pool.netPoolBalance, currency)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirectInput(String(pool.positiveEnvelopesSum))}
                    className="px-3 py-1.5 text-xs font-medium text-stone-700 bg-[#FAF9F6] hover:bg-stone-200/70 border border-stone-300 rounded-lg"
                  >
                    Fill Positive Envelopes Only ({formatMoney(pool.positiveEnvelopesSum, currency)})
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-700">
                    Enter how many bills / notes you have of each value:
                  </span>
                  <button
                    type="button"
                    onClick={handleResetNotes}
                    className="text-xs font-medium text-stone-500 hover:text-stone-900 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear counts</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {denominations.map((denom) => {
                    const countVal = noteCounts[denom] || '';
                    const subtotal =
                      (Number(countVal) || 0) * denom;
                    return (
                      <div
                        key={denom}
                        className="p-3 rounded-xl bg-[#FAF9F6] border border-stone-200"
                      >
                        <label
                          htmlFor={`denom-${denom}`}
                          className="block text-xs font-mono font-bold text-stone-800 mb-1"
                        >
                          {formatMoney(denom, currency)} Note
                        </label>
                        <input
                          id={`denom-${denom}`}
                          type="number"
                          min="0"
                          value={countVal}
                          onChange={(e) =>
                            setNoteCounts((prev) => ({
                              ...prev,
                              [denom]: e.target.value,
                            }))
                          }
                          placeholder="0 notes"
                          className="w-full min-h-[38px] px-2.5 py-1 text-sm font-mono tabular-nums bg-white border border-stone-300 rounded-lg focus:outline-2 focus:outline-emerald-700"
                        />
                        <div className="text-[11px] font-mono tabular-nums text-stone-500 mt-1 text-right">
                          = {formatMoney(subtotal, currency)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="max-w-xs pt-2">
                  <label
                    htmlFor="coins-or-bank"
                    className="block text-xs font-semibold text-stone-700 mb-1"
                  >
                    Plus loose coins or bank balance ({currency})
                  </label>
                  <input
                    id="coins-or-bank"
                    type="number"
                    step="any"
                    value={bankOrExtraAmount}
                    onChange={(e) => setBankOrExtraAmount(e.target.value)}
                    className="w-full min-h-[40px] px-3 py-1.5 text-sm font-mono tabular-nums bg-[#FAF9F6] border border-stone-300 rounded-xl"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right 5 Columns: Reconciliation Result via Hairline Divider (No Nested Card) */}
          <div
            data-testid="reconciliation-result-card"
            className="lg:col-span-5 pt-6 lg:pt-0 border-t lg:border-t-0 lg:border-l border-stone-200/90 lg:pl-8 space-y-4"
          >
            <div className="text-xs font-semibold text-stone-500">
              Purse Comparison Result
            </div>

              <div className="space-y-2.5 text-sm border-b border-stone-200 pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-stone-600">Expected Combined Total:</span>
                  <span className="font-mono tabular-nums font-bold text-stone-900">
                    {formatMoney(result.expected, currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-600">Cash You Counted:</span>
                  <span className="font-mono tabular-nums font-bold text-stone-900">
                    {formatMoney(result.counted, currency)}
                  </span>
                </div>
              </div>

              <div className="pt-1">
                <div className="text-xs text-stone-500">Difference</div>
                <div
                  data-testid="reconciliation-difference"
                  className={`text-3xl font-bold font-mono tabular-nums mt-0.5 ${
                    result.status === 'exact'
                      ? 'text-emerald-800'
                      : result.status === 'surplus'
                      ? 'text-sky-800'
                      : 'text-red-700'
                  }`}
                >
                  {result.difference > 0 ? '+' : ''}
                  {formatMoney(result.difference, currency)}
                </div>

                <div className="mt-3 flex items-start gap-2.5 text-xs sm:text-sm">
                  {result.status === 'exact' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  ) : result.status === 'surplus' ? (
                    <Info className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
                  )}
                  <p className="text-stone-800 font-medium leading-relaxed">
                    {result.message}
                  </p>
                </div>
              </div>
            </div>
        </div>
      </div>
    </section>
  );
};
