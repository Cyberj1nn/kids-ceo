import { Router, Request, Response } from 'express';
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

// SuccessURL2 — Robokassa вызывает этот эндпоинт браузерным редиректом после оплаты.
// Подпись не проверяем (продажи по открытой ссылке, на доверии).
router.all('/robokassa/success', async (req: Request, res: Response) => {
  const params = collectParams(req);
  const outSum = pickParam(params, 'OutSum', 'outSum');
  const invIdStr = pickParam(params, 'InvId', 'invId');
  let email = pickParam(params, 'Email', 'email', 'EMail') || null;

  const successUrl = `${config.clientUrl}/english_lessons/success`;
  const failUrl = `${config.clientUrl}/english_lessons/fail`;

  // InvId нужен для идемпотентности (чтобы не слать письмо дважды при ретрае).
  // Если Robokassa его не прислала — используем timestamp как уникальный ключ.
  const parsedInvId = Number(invIdStr);
  const invId = Number.isFinite(parsedInvId) && parsedInvId > 0
    ? parsedInvId
    : Date.now();

  // Fallback: если email не пришёл в SuccessURL2 — тянем через API Robokassa.
  if (!email && Number.isFinite(parsedInvId) && parsedInvId > 0) {
    try {
      email = await fetchPaymentEmail(parsedInvId);
      if (email) {
        console.log('[payments/success] email получен через Robokassa API', { invId, email });
      }
    } catch (err) {
      console.error('[payments/success] fetchPaymentEmail error:', err);
    }
  }

  let payment;
  try {
    payment = await insertPayment({
      invId,
      outSum: outSum || '0',
      email,
      status: 'success',
      rawParams: params,
    });
  } catch (err) {
    console.error('[payments/success] insertPayment error:', err);
    res.redirect(302, `${failUrl}?reason=db_error`);
    return;
  }

  if (payment) {
    if (email) {
      try {
        await sendEnglishLessonsLink(email);
        await markEmailSent(invId);
      } catch (err) {
        console.error('[payments/success] sendEnglishLessonsLink error:', err);
      }
      sendAdminNotification({ invId, email, outSum: outSum || '0' }).catch((err) =>
        console.error('[payments/success] sendAdminNotification error:', err)
      );
    } else {
      console.warn('[payments/success] платёж сохранён без email', { invId });
    }
  } else {
    console.log('[payments/success] повторный вызов SuccessURL2, письмо не шлём', { invId });
  }

  res.redirect(302, `${successUrl}?invId=${invId}`);
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
