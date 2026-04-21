import { query } from '../pool';

export interface PaymentRow {
  id: string;
  invId: string;
  outSum: string;
  email: string | null;
  status: string;
  productCode: string;
  emailSentAt: string | null;
  createdAt: string;
}

export interface InsertPaymentParams {
  invId: number | string;
  outSum: string;
  email: string | null;
  status?: 'success' | 'failed';
  productCode?: string;
  rawParams: Record<string, unknown>;
}

/**
 * Идемпотентно вставляет платёж. Возвращает новую строку,
 * либо null, если запись с таким inv_id уже существовала.
 */
export async function insertPayment(p: InsertPaymentParams): Promise<PaymentRow | null> {
  const { rows } = await query(
    `INSERT INTO payments (inv_id, out_sum, email, status, product_code, raw_params)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (inv_id) DO NOTHING
     RETURNING id, inv_id::text AS "invId", out_sum::text AS "outSum", email, status,
               product_code AS "productCode", email_sent_at AS "emailSentAt",
               created_at AS "createdAt"`,
    [
      p.invId,
      p.outSum,
      p.email,
      p.status || 'success',
      p.productCode || 'english_lessons',
      p.rawParams,
    ]
  );
  return (rows[0] as PaymentRow | undefined) || null;
}

export async function markEmailSent(invId: number | string): Promise<void> {
  await query('UPDATE payments SET email_sent_at = NOW() WHERE inv_id = $1', [invId]);
}
