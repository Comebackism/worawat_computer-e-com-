import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Download, RotateCcw, Clock, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import {
  PROMPTPAY,
  buildPromptPayPayload,
  formatPromptPayPhone,
} from '../lib/promptpay';

// PromptPay QR codes are generated for a single amount and expire after this long.
const QR_LIFETIME_MS = 15 * 60 * 1000;

function formatCountdown(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

/**
 * Renders the payable Thai QR (PromptPay) for one exact amount.
 *
 * `reference` identifies the order attempt: changing it starts a fresh code and
 * restarts the expiry countdown, which is what the "new QR code" button does.
 */
export default function PromptPayQR({ amount, reference, onRefresh }) {
  const { t } = useLanguage();
  const [deadline, setDeadline] = useState(() => Date.now() + QR_LIFETIME_MS);
  const [remaining, setRemaining] = useState(QR_LIFETIME_MS);
  const [copied, setCopied] = useState(false);
  const qrBoxRef = useRef(null);

  useEffect(() => {
    setDeadline(Date.now() + QR_LIFETIME_MS);
  }, [reference]);

  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, deadline - Date.now()));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  const expired = remaining <= 0;
  const payload = buildPromptPayPayload({ amount, reference });

  const copyReference = async () => {
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — the reference is visible on screen anyway */
    }
  };

  const downloadQr = () => {
    const svg = qrBoxRef.current?.querySelector('svg');
    if (!svg) return;
    const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `promptpay-${reference}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
        <div>
          <p className="font-bold">{t('checkout.qrScanTitle')}</p>
          <p className="text-xs text-slate-300 mt-0.5">{t('checkout.qrValid15')}</p>
        </div>
        <ShieldCheck className="w-7 h-7 text-emerald-400 shrink-0" />
      </div>

      <div className="p-6 flex flex-col sm:flex-row gap-6">
        {/* The code itself */}
        <div className="relative shrink-0 mx-auto sm:mx-0">
          <div
            ref={qrBoxRef}
            className={`bg-white p-3 rounded-xl border border-slate-200 transition-opacity ${expired ? 'opacity-25' : ''}`}
          >
            <QRCodeSVG
              value={payload}
              size={208}
              level="M"
              bgColor="#ffffff"
              fgColor="#0f172a"
              title={`PromptPay ${formatPromptPayPhone()}`}
            />
          </div>

          {expired && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/70 rounded-xl text-center px-3">
              <Clock className="w-8 h-8 text-rose-500" />
              <p className="text-sm font-bold text-slate-800">{t('checkout.qrExpired')}</p>
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-primary text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> {t('checkout.refreshQr')}
              </button>
            </div>
          )}

          <div className="mt-3 flex items-center justify-center gap-2 text-xs font-bold">
            <Clock className={`w-3.5 h-3.5 ${expired ? 'text-rose-500' : 'text-emerald-600'}`} />
            <span className={expired ? 'text-rose-600' : 'text-slate-500'}>
              {t('checkout.qrExpiresIn')} {formatCountdown(remaining)}
            </span>
          </div>
        </div>

        {/* Payment details */}
        <div className="flex-grow space-y-4 min-w-0">
          <p className="text-sm text-slate-500 font-medium">{t('checkout.qrScanHint')}</p>

          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-3">
            <div className="flex justify-between items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('checkout.amount')}</span>
              <span className="text-2xl font-extrabold text-primary">฿{Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center gap-3 border-t border-slate-200 pt-3">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('checkout.payTo')}</span>
              <span className="text-right">
                <span className="block font-bold text-slate-800">{PROMPTPAY.displayName}</span>
                <span className="block text-sm text-slate-500 font-mono">{formatPromptPayPhone()}</span>
              </span>
            </div>
            <div className="flex justify-between items-center gap-3 border-t border-slate-200 pt-3">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('checkout.reference')}</span>
              <button
                type="button"
                onClick={copyReference}
                className="inline-flex items-center gap-1.5 font-mono text-sm font-bold text-slate-700 hover:text-primary transition-colors"
              >
                {reference}
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={downloadQr}
              className="inline-flex items-center gap-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> {t('checkout.downloadQr')}
            </button>
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> {t('checkout.refreshQr')}
            </button>
          </div>

          {copied && <p className="text-xs text-emerald-600 font-bold">{t('checkout.copied')}</p>}
        </div>
      </div>
    </div>
  );
}