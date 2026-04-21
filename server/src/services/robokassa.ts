import { createHash } from 'crypto';
import { config } from '../config';

/**
 * Запрашивает детали платежа через Robokassa REST API (OpStateExt) по InvId.
 * Возвращает email покупателя, если Robokassa его хранит, иначе null.
 *
 * Используется как fallback, когда SuccessURL2 не содержит Email в параметрах
 * (магазин не включил передачу email в callback'ах).
 *
 * API: https://auth.robokassa.ru/Merchant/WebService/Service.asmx/OpStateExt
 * Подпись: md5(MerchantLogin:InvoiceID:Password#2)
 */
export async function fetchPaymentEmail(invId: number | string): Promise<string | null> {
  const { merchantLogin, password2 } = config.robokassa;
  if (!merchantLogin || !password2) {
    console.warn('[robokassa] MERCHANT_LOGIN / PASSWORD_2 не заданы — email fallback недоступен');
    return null;
  }

  const signature = createHash('md5')
    .update(`${merchantLogin}:${invId}:${password2}`)
    .digest('hex');

  const url = new URL('https://auth.robokassa.ru/Merchant/WebService/Service.asmx/OpStateExt');
  url.searchParams.set('MerchantLogin', merchantLogin);
  url.searchParams.set('InvoiceID', String(invId));
  url.searchParams.set('Signature', signature);

  try {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 8000);
    const res = await fetch(url.toString(), { method: 'GET', signal: ac.signal });
    clearTimeout(timer);

    if (!res.ok) {
      console.error('[robokassa/OpStateExt] HTTP', res.status);
      return null;
    }
    const xml = await res.text();

    // В ответе встречаются теги <Email>, <ClientEmail>, <PayerEmail> — пробуем все.
    const patterns = [
      /<Email>([^<]+)<\/Email>/i,
      /<ClientEmail>([^<]+)<\/ClientEmail>/i,
      /<PayerEmail>([^<]+)<\/PayerEmail>/i,
    ];
    for (const rx of patterns) {
      const m = xml.match(rx);
      if (m && m[1] && m[1].includes('@')) {
        return m[1].trim();
      }
    }

    console.warn('[robokassa/OpStateExt] email не найден в ответе, первые 400 символов XML:',
      xml.slice(0, 400));
    return null;
  } catch (err) {
    console.error('[robokassa/OpStateExt] fetch error:', err);
    return null;
  }
}
