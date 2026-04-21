import { Router, Request, Response } from 'express';
import { createHash } from 'crypto';
import { config } from '../config';
import { sendEnglishLessonsLink, sendAdminNotification } from '../services/mailer';
import { fetchPaymentEmail } from '../services/robokassa';
import { insertPayment, markEmailSent } from '../db/queries/payments';

const router = Router();

// Robokassa может прислать параметры как GET (SuccessUrl2Method=GET),
// так и POST (form-urlencoded). Нормализуем оба источника.
function collectParams(req: Request): Record<string, string> {
  const merged: Record<string, string> = {};
  const pick = (src: any) => {
    if (!src || typeof src !== 'object') return;
    for (const [k, v] of Object.entries(src)) {
      if (v === undefined || v === null) continue;
      merged[k] = Array.isArray(v) ? String(v[0]) : String(v);
    }
  };
  pick(req.query);
  pick(req.body);
  return merged;
}

function pickParam(params: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    if (params[k]) return params[k];
  }
  return '';
}

function pickEmail(params: Record<string, string>): string | null {
  return pickParam(
    params,
    'Email', 'email', 'EMail',
    'shp_email', 'shp_Email', 'Shp_email', 'Shp_Email'
  ) || null;
}

async function processSuccessfulPayment(opts: {
  invId: number;
  outSum: string;
  email: string | null;
  params: Record<string, string>;
  source: 'success' | 'result';
}) {
  const { invId, outSum, params, source } = opts;
  let { email } = opts;

  // Если email не пришёл — попробуем подтянуть через Robokassa API
  if (!email) {
    try {
      email = await fetchPaymentEmail(invId);
      if (email) console.log(`[payments/${source}] email из API`, { invId, email });
    } catch (err) {
      console.error(`[payments/${source}] fetchPaymentEmail error:`, err);
    }
  }

  const payment = await insertPayment({
    invId,
    outSum: outSum || '0',
    email,
    status: 'success',
    rawParams: params,
  });

  // payment === null означает повторный вызов (запись уже есть) — письмо не дублируем
  if (payment && email) {
    try {
      await sendEnglishLessonsLink(email);
      await markEmailSent(invId);
    } catch (err) {
      console.error(`[payments/${source}] sendEnglishLessonsLink error:`, err);
    }
    sendAdminNotification({ invId, email, outSum: outSum || '0' }).catch((err) =>
      console.error(`[payments/${source}] sendAdminNotification error:`, err)
    );
  } else if (payment && !email) {
    console.warn(`[payments/${source}] платёж сохранён без email`, { invId });
  }
}

// SuccessURL2 — Robokassa вызывает этот эндпоинт браузерным редиректом после оплаты.
// Подпись не проверяем (продажи по открытой ссылке, на доверии).
router.all('/robokassa/success', async (req: Request, res: Response) => {
  const params = collectParams(req);
  const outSum = pickParam(params, 'OutSum', 'outSum');
  const invIdStr = pickParam(params, 'InvId', 'invId');
  const email = pickEmail(params);

  const successUrl = `${config.clientUrl}/english_lessons/success`;
  const failUrl = `${config.clientUrl}/english_lessons/fail`;

  const parsedInvId = Number(invIdStr);
  const invId = Number.isFinite(parsedInvId) && parsedInvId > 0
    ? parsedInvId
    : Date.now();

  try {
    await processSuccessfulPayment({ invId, outSum, email, params, source: 'success' });
  } catch (err) {
    console.error('[payments/success] processing error:', err);
    res.redirect(302, `${failUrl}?reason=db_error`);
    return;
  }

  res.redirect(302, `${successUrl}?invId=${invId}`);
});

// ResultURL — серверный callback от Robokassa для каждого успешного платежа.
// Настраивается в кабинете магазина (Технические настройки → Result URL, метод POST).
// Должен вернуть ответ вида "OK<InvId>", иначе Robokassa будет считать платёж
// неподтверждённым и ретраить запрос.
router.all('/robokassa/result', async (req: Request, res: Response) => {
  const params = collectParams(req);
  const outSum = pickParam(params, 'OutSum', 'outSum');
  const invIdStr = pickParam(params, 'InvId', 'invId');
  const signature = pickParam(params, 'SignatureValue', 'signatureValue');

  // Для ResultURL подпись обязательно проверяется — иначе кто угодно может
  // дёрнуть endpoint и заставить сервер отправлять письма на произвольный email.
  const pass2 = config.robokassa.password2;
  if (!pass2) {
    console.error('[payments/result] ROBOKASSA_PASSWORD_2 не задан');
    res.status(500).type('text/plain').send('config error');
    return;
  }
  if (!outSum || !invIdStr || !signature) {
    console.warn('[payments/result] отсутствуют обязательные параметры', params);
    res.status(400).type('text/plain').send('bad request');
    return;
  }

  // Robokassa в ResultURL передаёт OutSum в разном формате (наблюдали "10.00"
  // в SuccessURL и "10.000000" в ResultURL). Подпись считается от OutSum в том
  // виде, в каком он был при создании платежа. Поэтому пробуем несколько
  // стандартных форматов — если хоть один совпал, подпись валидна.
  const signatureLower = String(signature).toLowerCase();
  const outSumNum = parseFloat(outSum);
  const candidates = new Set<string>([outSum]);
  if (Number.isFinite(outSumNum)) {
    candidates.add(outSumNum.toString());   // "10"
    candidates.add(outSumNum.toFixed(2));   // "10.00"
    candidates.add(outSumNum.toFixed(6));   // "10.000000"
    // Также 0-trailing trim по точке: "10.000000" -> "10" или "10.5"
    candidates.add(outSum.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, ''));
  }

  let sigMatched = false;
  for (const c of candidates) {
    const expected = createHash('md5').update(`${c}:${invIdStr}:${pass2}`).digest('hex');
    if (expected.toLowerCase() === signatureLower) {
      sigMatched = true;
      break;
    }
  }

  if (!sigMatched) {
    console.warn('[payments/result] невалидная подпись', {
      invIdStr, outSum, tried: Array.from(candidates),
    });
    res.status(400).type('text/plain').send('bad sig');
    return;
  }

  const parsedInvId = Number(invIdStr);
  if (!Number.isFinite(parsedInvId) || parsedInvId <= 0) {
    res.status(400).type('text/plain').send('bad inv id');
    return;
  }

  try {
    await processSuccessfulPayment({
      invId: parsedInvId,
      outSum,
      email: pickEmail(params),
      params,
      source: 'result',
    });
  } catch (err) {
    console.error('[payments/result] processing error:', err);
    res.status(500).type('text/plain').send('processing error');
    return;
  }

  // Robokassa принимает только такой формат ответа для подтверждения платежа.
  res.type('text/plain').send(`OK${parsedInvId}`);
});

// FailURL2 — Robokassa редиректит сюда при отмене / ошибке оплаты.
router.all('/robokassa/fail', async (req: Request, res: Response) => {
  const params = collectParams(req);
  const invIdStr = pickParam(params, 'InvId', 'invId');
  const parsedInvId = Number(invIdStr);
  const failUrl = `${config.clientUrl}/english_lessons/fail`;

  if (Number.isFinite(parsedInvId) && parsedInvId > 0) {
    try {
      await insertPayment({
        invId: parsedInvId,
        outSum: pickParam(params, 'OutSum', 'outSum') || '0',
        email: pickParam(params, 'Email', 'email', 'EMail') || null,
        status: 'failed',
        rawParams: params,
      });
    } catch (err) {
      console.error('[payments/fail] insertPayment error:', err);
    }
  }

  res.redirect(302, failUrl);
});

export default router;
