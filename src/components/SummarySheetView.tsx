import React, { useState } from 'react';
import { Copy, Check, Printer, Plus, Trash2 } from 'lucide-react';
import {
  formatMoney,
  type PersonSummary,
  type PoolSummary,
} from '../utils/ledgerLogic';

interface SummarySheetViewProps {
  pool: PoolSummary;
  personSummaries: PersonSummary[];
  currency: string;
  onClearAllData: () => void;
  onOpenPersonDetail: (personId: string) => void;
  onOpenAddMoney: () => void;
}

export const SummarySheetView: React.FC<SummarySheetViewProps> = ({
  pool,
  personSummaries,
  currency,
  onClearAllData,
  onOpenPersonDetail,
  onOpenAddMoney,
}) => {
  const [copiedAll, setCopiedAll] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const handleCopyFullSheet = async () => {
    const lines: string[] = [
      `ONEPURSE — COMBINED MONEY & TASK SHEET`,
      `========================================`,
      `Total Money in Purse Right Now: ${formatMoney(pool.netPoolBalance, currency)}`,
      `Total Received Across All People: ${formatMoney(pool.totalReceivedAll, currency)}`,
      `Total Spent on Tasks: ${formatMoney(pool.totalSpentAll, currency)}`,
      `========================================`,
      `BREAKDOWN BY PERSON:`,
    ];

    for (const s of personSummaries) {
      const statusLabel =
        s.remainingBalance < 0
          ? `OWED TO YOU: ${formatMoney(Math.abs(s.remainingBalance), currency)}`
          : `LEFT: ${formatMoney(s.remainingBalance, currency)}`;
      lines.push(
        `• ${s.person.name} (${s.person.purposeTitle}): Sent ${formatMoney(
          s.totalReceived,
          currency
        )} | Used ${formatMoney(s.totalSpent, currency)} | ${statusLabel}`
      );
    }

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
    } catch {
      // ignore clipboard errors in restricted frames
    }
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  return (
    <section aria-label="Summary Sheet" className="space-y-6">
      <div className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-stone-200/80">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-stone-500">
              Complete Household Entrusted Funds Statement
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
              Who Owns What in Your Combined Purse
            </h1>
            <p className="text-sm text-stone-600 mt-1">
              A side-by-side breakdown of everyone’s money so you never need separate physical envelopes.
            </p>
          </div>

          {personSummaries.length > 0 && (
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleCopyFullSheet}
                className="min-h-[42px] px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl flex items-center gap-2 whitespace-nowrap transition-colors"
              >
                {copiedAll ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied Full Summary!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Full Summary Text</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="min-h-[42px] px-4 py-2 text-xs font-semibold text-stone-800 bg-[#FAF9F6] hover:bg-stone-200/70 border border-stone-300 rounded-xl flex items-center gap-2 whitespace-nowrap"
              >
                <Printer className="w-4 h-4" />
                <span>Print Sheet</span>
              </button>
            </div>
          )}
        </div>

        {personSummaries.length > 0 ? (
          <>
            {/* Summary Table */}
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 bg-[#FAF9F6] text-xs font-semibold text-stone-600">
                    <th className="py-3.5 px-4">Person</th>
                    <th className="py-3.5 px-4">Task / Purpose</th>
                    <th className="py-3.5 px-4">Tasks Done</th>
                    <th className="py-3.5 px-4 text-right">Money Sent</th>
                    <th className="py-3.5 px-4 text-right">Money Used</th>
                    <th className="py-3.5 px-4 text-right">Money Left</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200/70 text-xs sm:text-sm">
                  {personSummaries.map((s) => (
                    <tr
                      key={s.person.id}
                      onClick={() => onOpenPersonDetail(s.person.id)}
                      className="hover:bg-stone-50 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-stone-900">
                        {s.person.name}
                        <span className="block text-xs font-normal text-stone-500">
                          {s.person.relationship}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-stone-800">
                        {s.person.purposeTitle}
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-xs text-stone-600">
                        {s.completedTasksCount}/{s.totalTasksCount} completed
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-stone-900">
                        {formatMoney(s.totalReceived, currency)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-stone-900">
                        {formatMoney(s.totalSpent + s.totalReturned, currency)}
                      </td>
                      <td
                        className={`py-3.5 px-4 text-right font-mono tabular-nums font-bold ${
                          s.remainingBalance < 0
                            ? 'text-red-700'
                            : s.remainingBalance === 0
                            ? 'text-stone-400'
                            : 'text-emerald-800'
                        }`}
                      >
                        {formatMoney(s.remainingBalance, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-stone-300 bg-[#FAF9F6] font-bold text-sm">
                    <td colSpan={3} className="py-4 px-4 text-stone-900">
                      Combined Purse Total ({personSummaries.length} people)
                    </td>
                    <td className="py-4 px-4 text-right font-mono tabular-nums text-stone-900">
                      {formatMoney(pool.totalReceivedAll, currency)}
                    </td>
                    <td className="py-4 px-4 text-right font-mono tabular-nums text-stone-900">
                      {formatMoney(pool.totalSpentAll + pool.totalReturnedAll, currency)}
                    </td>
                    <td className="py-4 px-4 text-right font-mono tabular-nums text-emerald-800 text-base">
                      {formatMoney(pool.netPoolBalance, currency)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Data Management Controls */}
            <div className="mt-8 pt-6 border-t border-stone-200 flex flex-wrap items-center justify-between gap-4 text-xs text-stone-600">
              <div>
                You can print or copy this summary sheet, or clear all records at any time.
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {!confirmClear ? (
                  <button
                    type="button"
                    onClick={() => setConfirmClear(true)}
                    className="min-h-[38px] px-3.5 py-1.5 font-semibold text-red-700 hover:bg-red-50 border border-red-200 rounded-lg inline-flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All Records</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-red-700">Delete all records?</span>
                    <button
                      type="button"
                      onClick={() => {
                        onClearAllData();
                        setConfirmClear(false);
                      }}
                      className="px-3 py-1.5 bg-red-700 text-white font-semibold rounded-lg"
                    >
                      Yes, Clear All
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClear(false)}
                      className="px-3 py-1.5 bg-stone-200 text-stone-800 font-medium rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="py-12 text-center max-w-md mx-auto">
            <h2 className="text-lg font-bold text-stone-900">
              No Records in Your Summary Sheet Yet
            </h2>
            <p className="text-sm text-stone-600 mt-1.5">
              Once you add money received from someone, their sent amount, expenses used, and remaining balance will appear here.
            </p>
            <button
              type="button"
              onClick={onOpenAddMoney}
              className="mt-5 min-h-[44px] px-5 py-2.5 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add First Person &amp; Money</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
