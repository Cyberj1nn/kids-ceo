import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../config';

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: config.smtp.user
        ? { user: config.smtp.user, pass: config.smtp.password }
        : undefined,
    });
  }
  return transporter;
}

export async function sendEnglishLessonsLink(toEmail: string): Promise<void> {
  const materialsUrl = config.englishLessons.materialsUrl;

  const html = `
  <div style="font-family:-apple-system,'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1A1F25;background:#FCF9F1">
    <h1 style="font-size:24px;color:#234C6C;margin:0 0 16px;letter-spacing:-0.01em">Спасибо за покупку!</h1>
    <p style="font-size:16px;line-height:1.55;margin:0 0 20px">
      Вы приобрели готовую программу английского на&nbsp;лето — 24&nbsp;часовых урока под&nbsp;ключ.
      Все материалы (сценарии для преподавателя, рабочие листы и домашние задания) собраны в&nbsp;одной папке Google&nbsp;Drive.
    </p>
    <p style="margin:0 0 28px">
      <a href="${materialsUrl}" style="display:inline-block;background:#234C6C;color:#FCF9F1;text-decoration:none;padding:16px 28px;border-radius:999px;font-weight:700;font-size:16px">
        Открыть материалы курса →
      </a>
    </p>
    <p style="font-size:14px;line-height:1.55;color:#6A727D;margin:0 0 12px">
      Если кнопка не работает, скопируйте ссылку в браузер:<br>
      <a href="${materialsUrl}" style="color:#33678E;word-break:break-all">${materialsUrl}</a>
    </p>
    <hr style="border:none;border-top:1px solid #E9E3D0;margin:28px 0">
    <p style="font-size:12px;color:#6A727D;line-height:1.6;margin:0">
      ИП Малафеев Дмитрий Владимирович<br>
      ИНН 730210225270 · ОГРН 321732500056804
    </p>
  </div>
  `.trim();

  await getTransporter().sendMail({
    from: config.smtp.from,
    to: toEmail,
    subject: 'Материалы курса «Summer English»',
    html,
  });
}

export async function sendAdminNotification(p: {
  invId: number | string;
  email: string | null;
  outSum: string;
}): Promise<void> {
  if (!config.adminNotifyEmail) return;

  await getTransporter().sendMail({
    from: config.smtp.from,
    to: config.adminNotifyEmail,
    subject: `Новая оплата · English Lessons · ${p.outSum} ₽`,
    text: [
      `Получена новая оплата программы Summer English.`,
      ``,
      `InvId:          ${p.invId}`,
      `Email клиента:  ${p.email || '—'}`,
      `Сумма:          ${p.outSum} ₽`,
    ].join('\n'),
  });
}
