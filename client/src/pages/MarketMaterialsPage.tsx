import type { ReactNode } from 'react';
import { useState, useRef, useEffect } from 'react';
import './EnglishLessonsPage.css';

// Публичная ссылка Robokassa Invoice — не секрет, безопасно хранить в коде.
// В виджете Robokassa прописаны SuccessURL2/FailURL2 → /api/payments/robokassa/market_*.
const INVOICE_URL = 'https://auth.robokassa.ru/merchant/Invoice/WY_GOHds40adA2sq22rgFw';
const EMAIL_STORAGE_KEY = 'evp_pay_email';
const PRODUCT_CODE = 'market_materials';

function PayButton({ className, children, onClick }: {
  className: string;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <a
      className={className}
      href={INVOICE_URL}
      role="button"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
    >
      {children}
    </a>
  );
}

function PayModal({ invoiceUrl, onClose }: {
  invoiceUrl: string;
  onClose: () => void;
}) {
  const [email, setEmail] = useState(() => {
    try { return localStorage.getItem(EMAIL_STORAGE_KEY) || ''; } catch { return ''; }
  });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    try { localStorage.setItem(EMAIL_STORAGE_KEY, trimmed); } catch { /* quota */ }
    // Email — стандартный параметр Robokassa: предзаполняет поле email в форме оплаты
    //         и используется для отправки фискального чека.
    // shp_email — custom-параметр, гарантированно возвращается в SuccessURL2/ResultURL.
    // shp_product — позволяет общему ResultURL различить продукт магазина.
    const encoded = encodeURIComponent(trimmed);
    const url = `${invoiceUrl}?Email=${encoded}&shp_email=${encoded}&shp_product=${PRODUCT_CODE}`;
    window.open(url, '_blank', 'noopener');
    onClose();
  }

  return (
    <div className="evp evp-modal__backdrop" onClick={onClose}>
      <form className="evp-modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <button type="button" className="evp-modal__close" onClick={onClose} aria-label="Закрыть">×</button>
        <h3 className="evp-modal__title">Введите email</h3>
        <p className="evp-modal__text">
          На этот адрес мы отправим ссылку на&nbsp;закрытый Telegram-канал с&nbsp;маркетинговыми материалами сразу после оплаты.
        </p>
        <input
          ref={inputRef}
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="evp-modal__input"
          autoComplete="email"
        />
        <button
          type="submit"
          className="evp-btn evp-btn--blue evp-btn--lg evp-modal__submit"
          disabled={!email.trim()}
        >
          Перейти к&nbsp;оплате →
        </button>
      </form>
    </div>
  );
}

function ArrowRight({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export default function MarketMaterialsPage() {
  const [payOpen, setPayOpen] = useState(false);

  return (
    <>
      <div className="evp">

        {/* HERO — единственный блок страницы */}
        <section className="evp-hero">
          <div className="evp__wrap">
            <div className="evp-hero__tile evp-mm-tile">
              <span className="evp-hero__badge">цифровой пакет · готово к&nbsp;работе</span>
              <h1 className="evp-hero__headline">
                Маркетинговые<br />материалы
              </h1>

              <ul className="evp-mm-list">
                <li>100 продающих сторителингов</li>
                <li>100 продающих постов</li>
              </ul>

              <div className="evp-mm-price">
                <span className="evp-mm-price__old">30 000 ₽</span>
                <span className="evp-mm-price__new">2 000 ₽</span>
              </div>

              <div className="evp-hero__cta">
                <PayButton className="evp-btn evp-btn--cream evp-btn--lg" onClick={() => setPayOpen(true)}>
                  Оплатить
                  <ArrowRight />
                </PayButton>
              </div>

              <div className="evp-hero__bottom">
                <p className="evp-hero__hint">
                  После оплаты ссылка на&nbsp;закрытый Telegram-канал с&nbsp;материалами придёт на&nbsp;email, указанный в&nbsp;платёжной форме. Если не&nbsp;видите письмо в&nbsp;течение 5&nbsp;минут — проверьте папку «Спам».
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER — идентичный english_lessons */}
        <footer className="evp-footer">
          <div className="evp__wrap evp-footer__grid">
            <div className="evp-footer__org">
              <p>Название организации: ИП&nbsp;Малафеев Дмитрий Владимирович</p>
              <p>ИНН: 730210225270 · ОГРН: 321732500056804</p>
              <p>Почтовый адрес:</p>
              <p><span className="evp-footer__email" data-u="info.kyrs-rykovoditelej-dc" data-d="mail.ru"></span></p>
            </div>
            <div className="evp-footer__legal">
              <a href="https://evarestova.ru/oferta_cons" target="_blank" rel="noopener">Договор-оферта</a>
              <a href="https://docs.google.com/document/d/1g4ecQrwyA4HY5V9V-gtHd1HIQkP6sNxhHVI8aUMQqS8/edit?usp=sharing" target="_blank" rel="noopener">Согласие на обработку персональных данных</a>
            </div>
          </div>
        </footer>

      </div>
      {payOpen && <PayModal invoiceUrl={INVOICE_URL} onClose={() => setPayOpen(false)} />}
    </>
  );
}
