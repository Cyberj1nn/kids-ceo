import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import './EnglishLessonsPage.css';

// Публичные ссылки Robokassa Invoice — не секреты, безопасно хранить в коде.
// В виджете Robokassa прописаны SuccessURL2/FailURL2 → /api/payments/robokassa/*.
const INVOICE_URL = 'https://auth.robokassa.ru/merchant/Invoice/mT1I4fhMA0y8oBdIuToPdQ';
const TEST_INVOICE_URL = 'https://auth.robokassa.ru/merchant/Invoice/8qSHLreLXkql8qY7t0Mz4Q';

function PayButton({ className, children }: { className: string; children: ReactNode }) {
  return (
    <a className={className} href={INVOICE_URL} target="_blank" rel="noopener">
      {children}
    </a>
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

function ExternalIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function EnglishLessonsPage() {
  // тест-кнопка в футере появляется только при ?test=1 — для внутренних проверок
  const [searchParams] = useSearchParams();
  const showTestButton = searchParams.get('test') === '1';

  return (
    <div className="evp">

      {/* HERO */}
      <section className="evp-hero">
        <div className="evp__wrap evp-hero__grid">

          <div className="evp-hero__tile">
            <span className="evp-hero__badge">программа на лето · Spotlight</span>
            <h1 className="evp-hero__headline">
              Готовая программа<br />английского<br /><em>на лето</em>
            </h1>
            <p className="evp-hero__sub">
              Запускайте группы уже в&nbsp;ближайшие недели и&nbsp;зарабатывайте этим летом&nbsp;— без&nbsp;хаоса и&nbsp;«самодеятельности» преподавателей.
            </p>
            <div className="evp-hero__cta">
              <PayButton className="evp-btn evp-btn--cream evp-btn--lg">
                Купить программу · 3 000 ₽
                <ArrowRight />
              </PayButton>
              <a className="evp-btn evp-btn--ghost-cream evp-btn--lg" href="#sample">Посмотреть пример урока</a>
            </div>
            <div className="evp-hero__bottom">
              <p className="evp-hero__hint">
                После оплаты ссылка на&nbsp;все материалы программы придёт на&nbsp;email, указанный в&nbsp;платёжной форме. Если не&nbsp;видите письмо в&nbsp;течение 5&nbsp;минут — проверьте папку «Спам».
              </p>
              <span className="evp-hero__sticker">для&nbsp;детей, окончивших&nbsp;1&nbsp;класс</span>
            </div>
          </div>

          <aside className="evp-hero__side">
            <span className="evp-eyebrow">состав программы</span>
            <div className="evp-hero__side-ttl">3 месяца / 24 урока<br />под ключ</div>
            <p style={{ margin: 0, color: 'var(--ink-700)', fontSize: 15, lineHeight: 1.5 }}>
              Полный 3-месячный курс на&nbsp;базе Spotlight, адаптированный под лёгкий летний формат.
            </p>
            <div className="evp-hero__stats">
              <div className="evp-hero__stat">
                <div className="evp-hero__stat-num">24</div>
                <div className="evp-hero__stat-lab">часовых урока</div>
              </div>
              <div className="evp-hero__stat">
                <div className="evp-hero__stat-num">3</div>
                <div className="evp-hero__stat-lab">месяца программы</div>
              </div>
              <div className="evp-hero__stat">
                <div className="evp-hero__stat-num">3×</div>
                <div className="evp-hero__stat-lab">материала на&nbsp;урок</div>
              </div>
              <div className="evp-hero__stat">
                <div className="evp-hero__stat-num">PDF</div>
                <div className="evp-hero__stat-lab">распечатал — провёл</div>
              </div>
            </div>
          </aside>

        </div>
      </section>

      {/* GET — что вы получаете */}
      <section className="evp-get">
        <div className="evp__wrap">

          <header className="evp-get__head">
            <span className="evp-eyebrow">что вы получаете</span>
            <h2 className="evp-h2">Всё уже готово —<br />вам не нужно ничего придумывать</h2>
            <p className="evp-lead">
              Полный 3-месячный курс — 24&nbsp;часовых комплектованных урока. Методическая программа разработана на&nbsp;базе Spotlight для&nbsp;детей, окончивших 1&nbsp;класс и&nbsp;переходящих во&nbsp;2-й, и&nbsp;адаптирована под летний формат: лёгкий, игровой, без&nbsp;перегрузки.
            </p>
          </header>

          <div className="evp-get__grid">

            <article className="evp-get__main">
              <span className="evp-eyebrow">в каждом уроке</span>
              <div className="evp-get__main-num">3<small>×</small></div>
              <h3 className="evp-get__main-ttl">Готовых материала<br />на каждый урок</h3>
              <ul className="evp-get__list">
                <li>
                  <span className="evp-get__list-term"><b>Сценарий для преподавателя</b></span>
                  <span className="evp-get__list-desc">— что говорить и&nbsp;делать на&nbsp;каждом этапе урока.</span>
                </li>
                <li>
                  <span className="evp-get__list-term"><b>Рабочий лист для&nbsp;занятий</b></span>
                  <span className="evp-get__list-desc">— раздаётся детям на&nbsp;занятии.</span>
                </li>
                <li>
                  <span className="evp-get__list-term"><b>Домашнее задание</b></span>
                  <span className="evp-get__list-desc">— для&nbsp;закрепления пройденного материала дома.</span>
                </li>
              </ul>
            </article>

            <div className="evp-get__side">
              <article className="evp-get__card evp-get__card--blue">
                <div className="evp-get__card-ttl">На базе Spotlight</div>
                <p>Структура курса опирается на&nbsp;Spotlight — самый распространённый УМК&nbsp;в&nbsp;школах. Дети узнают знакомые темы и&nbsp;закрепляют программу.</p>
                <div className="evp-get__card-tags">
                  <span className="evp-get__tag">1 класс → 2 класс</span>
                  <span className="evp-get__tag">Spotlight Starter</span>
                </div>
              </article>
              <article className="evp-get__card">
                <div className="evp-get__card-ttl">Адаптировано под лето</div>
                <p>Лёгкий, игровой формат без&nbsp;перегрузки: дети не&nbsp;«учатся через силу», а&nbsp;поддерживают английский и&nbsp;идут в&nbsp;школу&nbsp;уверенно.</p>
                <div className="evp-get__card-tags">
                  <span className="evp-get__tag">игровой формат</span>
                  <span className="evp-get__tag">без перегрузки</span>
                </div>
              </article>
            </div>

          </div>
        </div>
      </section>

      {/* SAMPLE — пример урока */}
      <section className="evp-sample" id="sample">
        <div className="evp__wrap">
          <div className="evp-sample__card">
            <header className="evp-sample__head">
              <div>
                <span className="evp-eyebrow">пример урока</span>
                <h2 className="evp-h2">Урок №7 — открыто целиком</h2>
                <p>Откройте все три файла одного урока, чтобы понять формат: что получит преподаватель, ребёнок и&nbsp;родитель.</p>
              </div>
              <span className="evp-sample__hint">↓ кликните, чтобы открыть</span>
            </header>

            <div className="evp-sample__grid">

              <a className="evp-pdf" href="https://drive.google.com/file/d/1DdQOB4julqhYsZ4lict-GpQ236GiK_aX/view?usp=sharing" target="_blank" rel="noopener">
                <div className="evp-pdf__thumb">
                  <span className="evp-pdf__thumb-tag">для&nbsp;учителя</span>
                  <span className="evp-pdf__thumb-ttl">Lesson&nbsp;7<br />Scenario</span>
                  <div className="evp-pdf__thumb-body">
                    <span className="h">1. ПРИВЕТСТВИЕ + ПОВТОРЕНИЕ БЛОКА 1 (00:00 – 06:00)</span>
                    <span className="r">00:00 "Hello! How are you?"</span>
                    <span className="r">→ Ритуал.</span>
                    <span className="r">01:30 Быстрое повторение: ABC + 5 гласных.</span>
                    <span className="r">→ Разогрев от Блока 1.</span>
                    <span className="r">03:00 Спеллинг: "Spell dog!" — "D-O-G!" / "Spell cat!" — "C-A-T!"</span>
                    <span className="r">→ Закрепление.</span>
                    <span className="r">05:00 "Today — new words! Family and colours!"</span>
                    <span className="r">→ Анонс урока.</span>
                    <span className="h">2. ВВОДИМ СЕМЬЮ — 7 слов (06:00 – 18:00)</span>
                    <span className="r">06:00 Mummy — карточка с мамой. "Mummy! My mummy!"</span>
                    <span className="r">→ Хором 3 раза.</span>
                    <span className="r">08:00 Daddy — папа. "Daddy! My daddy!"</span>
                    <span className="r">→ Хором 3 раза.</span>
                    <span className="r">10:00 Brother — брат. Sister — сестра.</span>
                    <span className="r">→ Можно показать Larry и Lulu.</span>
                    <span className="r">12:00 Grandma — бабушка. Grandpa — дедушка.</span>
                    <span className="r">→ Изобразите: бабушка — с палочкой, дедушка — с усами.</span>
                  </div>
                </div>
                <div className="evp-pdf__meta">
                  <div className="evp-pdf__meta-l">
                    <span className="evp-pdf__meta-ttl">Сценарий</span>
                    <span className="evp-pdf__meta-sub">PDF · этапы урока</span>
                  </div>
                  <span className="evp-pdf__open">
                    Открыть
                    <ExternalIcon />
                  </span>
                </div>
              </a>

              <a className="evp-pdf" href="https://drive.google.com/file/d/11HW0SW3q5g5NLmjPE5DfonjpHQgoMic4/view?usp=sharing" target="_blank" rel="noopener">
                <div className="evp-pdf__thumb">
                  <span className="evp-pdf__thumb-tag">для&nbsp;ребёнка</span>
                  <span className="evp-pdf__thumb-ttl">Lesson&nbsp;7<br />Worksheet</span>
                  <div className="evp-pdf__thumb-body">
                    <span className="h">1. Match — соедини слово с переводом &nbsp;+5 баллов</span>
                    <span className="r">mummy &nbsp;&nbsp;&nbsp; брат</span>
                    <span className="r">daddy &nbsp;&nbsp;&nbsp;&nbsp; семья</span>
                    <span className="r">grandma &nbsp; мама</span>
                    <span className="r">brother &nbsp;&nbsp; бабушка</span>
                    <span className="r">family &nbsp;&nbsp;&nbsp; папа</span>
                    <span className="r">Мои баллы за задание: ___ / 5</span>
                    <span className="h">2. Circle — выбери правильный цвет &nbsp;+4 балла</span>
                    <span className="r">Перевод &nbsp;&nbsp; Обведи цвет</span>
                    <span className="r">красный &nbsp;&nbsp; red / blue / green</span>
                    <span className="r">жёлтый &nbsp;&nbsp;&nbsp; yellow / orange / white</span>
                    <span className="r">чёрный &nbsp;&nbsp;&nbsp; brown / black / grey</span>
                    <span className="r">розовый &nbsp;&nbsp; pink / purple / red</span>
                    <span className="r">Мои баллы за задание: ___ / 4</span>
                  </div>
                </div>
                <div className="evp-pdf__meta">
                  <div className="evp-pdf__meta-l">
                    <span className="evp-pdf__meta-ttl">Рабочий лист</span>
                    <span className="evp-pdf__meta-sub">PDF · на занятии</span>
                  </div>
                  <span className="evp-pdf__open">
                    Открыть
                    <ExternalIcon />
                  </span>
                </div>
              </a>

              <a className="evp-pdf" href="https://drive.google.com/file/d/1VS48hcfvHH9zwoJRkH6Ma54AQgnzrzON/view?usp=sharing" target="_blank" rel="noopener">
                <div className="evp-pdf__thumb">
                  <span className="evp-pdf__thumb-tag">домой</span>
                  <span className="evp-pdf__thumb-ttl">Lesson&nbsp;7<br />Homework</span>
                  <div className="evp-pdf__thumb-body">
                    <span className="r">rutube.ru/video/b24b42657f12fd33413d89c6df4daa6c</span>
                    <span className="r">или найди в поиске: "Finger Family Song"</span>
                    <span className="h">Что ты услышишь в песне:</span>
                    <span className="r">— Семья пальчиков: daddy, mummy, brother, sister, baby</span>
                    <span className="r">— Припев: Where are you? — Here I am!</span>
                    <span className="h">Что сделать:</span>
                    <span className="r">1) Послушай Finger Family 2 раза.</span>
                    <span className="r">2) Покажи маме/папе песню на пальцах.</span>
                    <span className="r">3) Спой: 'Daddy finger, where are you?'</span>
                    <span className="r">[ ] Послушал(а) (+1)</span>
                    <span className="r">[ ] Показал(а) на пальцах (+1)</span>
                    <span className="r">[ ] Спел(а) (+1)</span>
                  </div>
                </div>
                <div className="evp-pdf__meta">
                  <div className="evp-pdf__meta-l">
                    <span className="evp-pdf__meta-ttl">Домашнее задание</span>
                    <span className="evp-pdf__meta-sub">PDF · закрепление</span>
                  </div>
                  <span className="evp-pdf__open">
                    Открыть
                    <ExternalIcon />
                  </span>
                </div>
              </a>

            </div>
          </div>
        </div>
      </section>

      {/* MID CTA */}
      <section className="evp-cta-mid">
        <div className="evp__wrap">
          <PayButton className="evp-btn evp-btn--blue evp-btn--xl evp-cta-mid__btn">
            Купить всего за&nbsp;3 000 ₽ · 24&nbsp;урока
            <ArrowRight size={20} />
          </PayButton>
          <p className="evp-cta-mid__sub">
            Один платёж&nbsp;— и&nbsp;вся&nbsp;программа у&nbsp;вас на&nbsp;почте. Ссылка придёт на&nbsp;email, указанный при оплате; проверьте папку «Спам», если не&nbsp;видите письмо в&nbsp;течение 5&nbsp;минут.
          </p>
        </div>
      </section>

      {/* FOR-WHOM */}
      <section className="evp-for">
        <div className="evp__wrap">
          <header className="evp-for__head">
            <span className="evp-eyebrow">для кого подходит</span>
            <h2 className="evp-h2">Для кого эта программа?</h2>
          </header>

          <div className="evp-for__grid">

            <article className="evp-who">
              <div className="evp-who__num">01</div>
              <h3 className="evp-who__ttl">Детские центры развития</h3>
              <ul className="evp-who__list">
                <li>хотят быстро запустить летние группы английского с&nbsp;нуля</li>
                <li>без дополнительной нагрузки на&nbsp;методиста и&nbsp;преподавателей</li>
              </ul>
            </article>

            <article className="evp-who">
              <div className="evp-who__num">02</div>
              <h3 className="evp-who__ttl">Языковые школы</h3>
              <ul className="evp-who__list">
                <li>нужен готовый летний курс на&nbsp;базе Spotlight</li>
                <li>с понятной структурой и&nbsp;единым стандартом обучения</li>
              </ul>
            </article>

            <article className="evp-who">
              <div className="evp-who__num">03</div>
              <h3 className="evp-who__ttl">Частные образовательные студии</h3>
              <ul className="evp-who__list">
                <li>где нет собственной методической команды</li>
                <li>и важно быстро запустить продукт «под&nbsp;ключ»</li>
              </ul>
            </article>

            <article className="evp-who">
              <div className="evp-who__num">04</div>
              <h3 className="evp-who__ttl">Репетиторские объединения<br />и педагоги-организаторы</h3>
              <ul className="evp-who__list">
                <li>хотят открыть мини-группы летом</li>
                <li>без разработки материалов и&nbsp;плана уроков</li>
              </ul>
            </article>

          </div>
        </div>
      </section>

      {/* ADVANTAGES */}
      <section className="evp-adv">
        <div className="evp__wrap">
          <header className="evp-adv__head">
            <span className="evp-eyebrow">преимущества</span>
            <h2 className="evp-h2">Преимущества для<br />детского центра</h2>
          </header>

          <div className="evp-adv__list">
            <div className="evp-adv__item">
              <span className="evp-adv__check"><CheckIcon /></span>
              <div className="evp-adv__txt">Запуск групп за&nbsp;несколько дней, а&nbsp;не&nbsp;недель</div>
            </div>
            <div className="evp-adv__item">
              <span className="evp-adv__check"><CheckIcon /></span>
              <div className="evp-adv__txt">Единый стандарт качества занятий у&nbsp;всех преподавателей</div>
            </div>
            <div className="evp-adv__item">
              <span className="evp-adv__check"><CheckIcon /></span>
              <div className="evp-adv__txt">Снижение нагрузки на&nbsp;методиста и&nbsp;руководителя</div>
            </div>
            <div className="evp-adv__item">
              <span className="evp-adv__check"><CheckIcon /></span>
              <div className="evp-adv__txt">Готовые материалы — просто распечатать и&nbsp;использовать</div>
            </div>
            <div className="evp-adv__item" style={{ gridColumn: 'span 2' }}>
              <span className="evp-adv__check"><CheckIcon /></span>
              <div className="evp-adv__txt">Понятная структура курса без&nbsp;«провалов» и&nbsp;импровизации</div>
            </div>
          </div>

          <div className="evp-flow">
            <span className="evp-eyebrow">как это работает</span>
            <div className="evp-flow__ttl">Три шага до&nbsp;стабильно работающих групп</div>
            <div className="evp-flow__row">
              <div className="evp-flow__step">
                <div className="evp-flow__step-num">01 · вы</div>
                <div className="evp-flow__step-txt">Внедряете готовую программу в&nbsp;центр</div>
              </div>
              <div className="evp-flow__arrow"><ArrowRight size={24} /></div>
              <div className="evp-flow__step">
                <div className="evp-flow__step-num">02 · преподаватели</div>
                <div className="evp-flow__step-txt">Проводят занятия по&nbsp;готовым материалам</div>
              </div>
              <div className="evp-flow__arrow"><ArrowRight size={24} /></div>
              <div className="evp-flow__step">
                <div className="evp-flow__step-num">03 · результат</div>
                <div className="evp-flow__step-txt">Группы идут стабильно, дети вовлечены, родители довольны</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="evp-cta">
        <div className="evp__wrap">
          <div className="evp-cta__card">
            <span className="evp-cta__sticker">в этом сезоне!</span>
            <span className="evp-eyebrow" style={{ color: 'var(--blue-100)' }}>старт за&nbsp;несколько дней</span>
            <h2 className="evp-h2">Запустите летнюю программу<br />английского уже&nbsp;сейчас</h2>
            <p className="evp-cta__sub">…и&nbsp;начните получать доход в&nbsp;этом сезоне. Один платёж&nbsp;— и&nbsp;все&nbsp;24&nbsp;урока у&nbsp;вас на&nbsp;почте.</p>
            <PayButton className="evp-btn evp-btn--cream evp-btn--xl">
              Купить программу · 3 000 ₽
              <ArrowRight size={20} />
            </PayButton>
            <p className="evp-cta__note">
              После оплаты ссылка на&nbsp;материалы придёт на&nbsp;email из&nbsp;платёжной формы. Проверьте папку «Спам», если письмо не&nbsp;приходит в&nbsp;течение 5&nbsp;минут.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
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
          {showTestButton && (
            <div className="evp-footer__test">
              <a href={TEST_INVOICE_URL} target="_blank" rel="noopener">
                🧪 Тестовая оплата
              </a>
            </div>
          )}
        </div>
      </footer>

    </div>
  );
}
