// Thai PromptPay QR (EMVCo "Thai QR Payment" merchant payload).
//
// The QR we generate is a *dynamic* payload: it carries the exact amount and a
// reference label, so the payer does not have to type anything in their bank app.
//
// The merchant fields are configurable through .env (see .env.example):
//   VITE_PROMPTPAY_PHONE / VITE_PROMPTPAY_NAME / VITE_PROMPTPAY_DISPLAY_NAME / VITE_PROMPTPAY_CITY

const PROMPTPAY_AID = 'A000000677010111'; // PromptPay application identifier (mobile / national ID)
const CURRENCY_THB = '764';
const COUNTRY_TH = 'TH';

export const PROMPTPAY = {
  phone: import.meta.env.VITE_PROMPTPAY_PHONE || '0828072613',
  // EMVCo merchant name is restricted to the Latin "ans" charset, and every Thai
  // banking app expects ASCII here, so the QR carries the transliteration while
  // the UI shows the Thai name.
  name: (import.meta.env.VITE_PROMPTPAY_NAME || 'WORAWAT BOONRUENG').toUpperCase(),
  displayName: import.meta.env.VITE_PROMPTPAY_DISPLAY_NAME || 'วรวัฒน์ บุญเรือง',
  city: (import.meta.env.VITE_PROMPTPAY_CITY || 'BANGKOK').toUpperCase(),
};

/** Pretty phone for humans: 0828072613 -> 082-807-2613 */
export function formatPromptPayPhone(phone = PROMPTPAY.phone) {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return digits;
}

/** EMVCo expects mobile numbers as 00 + country code + number without the leading zero. */
export function toPromptPayMsisdn(phone = PROMPTPAY.phone) {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('0')) return `0066${digits.slice(1)}`;
  if (digits.startsWith('66')) return `00${digits}`;
  return digits;
}

/** TLV field: 2-digit tag, 2-digit length, value. */
function tlv(tag, value) {
  const text = String(value);
  return `${tag}${String(text.length).padStart(2, '0')}${text}`;
}

/** CRC-16/CCITT-FALSE, required by every EMVCo QR (check value for "123456789" is 29B1). */
export function crc16(input) {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i += 1) {
    crc ^= input.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Build the raw PromptPay payload string.
 * Pass no amount for a reusable static QR, or an amount for a one-time dynamic QR.
 */
export function buildPromptPayPayload({ amount, reference } = {}) {
  const hasAmount = Number(amount) > 0;
  const merchantAccount = tlv('00', PROMPTPAY_AID) + tlv('01', toPromptPayMsisdn());

  const additional = [
    reference ? tlv('05', String(reference).slice(0, 25)) : '',
    tlv('07', 'WORAWATPOS'),
  ].join('');

  const body = [
    tlv('00', '01'), // payload format indicator
    tlv('01', hasAmount ? '12' : '11'), // 12 = one-time, 11 = reusable
    tlv('29', merchantAccount),
    tlv('53', CURRENCY_THB),
    hasAmount ? tlv('54', Number(amount).toFixed(2)) : '',
    tlv('58', COUNTRY_TH),
    tlv('59', PROMPTPAY.name.slice(0, 25)),
    PROMPTPAY.city ? tlv('60', PROMPTPAY.city.slice(0, 15)) : '',
    additional ? tlv('62', additional) : '',
  ].join('');

  const withCrcPlaceholder = `${body}6304`;
  return withCrcPlaceholder + crc16(withCrcPlaceholder);
}

/** Short, human readable payment reference, e.g. WW-7K3F91. */
export function createPaymentReference() {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `WW-${random}`;
}
