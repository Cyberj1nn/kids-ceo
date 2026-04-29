import { useEffect, useRef, useState } from 'react';
import './MentorPlatformPageAlt.css';

/* ============================================================
   Иконки (Lucide-style outline 1.5)
   ============================================================ */
const I = {
  check: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  plus: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  arrow: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  shuffle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 3 21 3 21 8" />
      <line x1="4" y1="20" x2="21" y2="3" />
      <polyline points="21 16 21 21 16 21" />
      <line x1="15" y1="15" x2="21" y2="21" />
      <line x1="4" y1="4" x2="9" y2="9" />
    </svg>
  ),
  refresh: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
  trend: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 17 9 11 13 15 21 7" />
      <polyline points="14 7 21 7 21 14" />
    </svg>
  ),
  book: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
  test: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  chat: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  headphones: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  ),
  programs: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  smartphone: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  ),
  telegram: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M21.94 4.55a1.4 1.4 0 0 0-1.46-.21L3.13 11.27a1.4 1.4 0 0 0 .07 2.6l3.78 1.36 1.55 4.97a1 1 0 0 0 1.66.43l2.34-2.27 4.04 2.96a1.4 1.4 0 0 0 2.21-.84l3.5-14.4a1.4 1.4 0 0 0-.34-1.53zM10.13 14.86l-.62 4.03-1.13-3.66 9.05-7.6z" />
    </svg>
  ),
  whatsapp: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.52 3.45A11.84 11.84 0 0 0 12.05 0C5.46 0 .12 5.34.12 11.93c0 2.1.55 4.15 1.6 5.96L0 24l6.27-1.65a11.93 11.93 0 0 0 5.78 1.47h.01c6.59 0 11.93-5.34 11.93-11.93 0-3.18-1.24-6.18-3.49-8.44zm-8.47 18.34h-.01a9.9 9.9 0 0 1-5.05-1.38l-.36-.22-3.72.98 1-3.63-.24-.37a9.86 9.86 0 0 1-1.51-5.24c0-5.45 4.43-9.88 9.89-9.88a9.83 9.83 0 0 1 6.99 2.9 9.86 9.86 0 0 1 2.9 6.99c0 5.45-4.44 9.85-9.89 9.85zm5.42-7.4c-.3-.15-1.76-.87-2.04-.97-.27-.1-.47-.15-.67.15s-.77.97-.94 1.17c-.17.2-.34.22-.64.07-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.34.45-.51.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.21-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.06 2.88 1.21 3.08.15.2 2.09 3.19 5.06 4.47.71.31 1.26.49 1.69.63.71.23 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z" />
    </svg>
  ),
  mail: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <polyline points="22 6 12 13 2 6" />
    </svg>
  ),
};

/* ============================================================
   Контент-данные
   ============================================================ */
const PAINS = [
  { title: 'Контент размазан по 5+ сервисам', text: 'Лекции на Google Drive, инструкции в Notion, обсуждения в Telegram, домашки в Google Forms. Сотрудник теряет до 30% времени просто на поиск нужного материала.' },
  { title: 'Непонятно, кто что усвоил', text: 'Провели обучение, записали вебинар — и тишина. Нет тестов, нет статистики, нет понимания, кто реально готов к работе, а кто пролистал по диагонали.' },
  { title: 'GetCourse — это аренда, а не актив', text: 'Платите 5–30 тысяч в месяц за хранение собственного контента. Не можете изменить интерфейс, добавить нужный модуль, кастомизировать логику. Бизнес растёт — а платформа упирается в чужие лимиты.' },
  { title: 'Текучка съедает обучение', text: 'Каждого нового руководителя или администратора учат «вживую» с нуля. На третьем-пятом сотруднике процесс выгорает, а стандарты размываются.' },
];

const PILLARS = [
  { ico: I.shuffle, title: 'Готовая база, быстрый старт', text: 'Не ждёте 3 месяца разработки с нуля — поднимаем платформу на проверенной архитектуре за 1–2 недели.' },
  { ico: I.refresh, title: 'Без ежемесячной аренды', text: 'Платите 15 000 ₽ за развёртывание. Дальше — только 3 500 ₽/мес за хостинг и сопровождение.' },
  { ico: I.trend, title: 'Растёт вместе с вами', text: 'Любое количество учеников и сотрудников. Индивидуальные доработки — от 20 000 ₽.' },
];

const AUDIENCE = [
  { tag: 'Сегмент A', title: 'Наставникам и экспертам', text: 'Если у вас платная программа, марафоны, регулярные потоки и больше 30+ учеников — пора перестать собирать ученическое сообщество в Telegram-чатах и Google-папках.', what: 'Свою экосистему с уроками, чатами, личным кабинетом ученика, тестами и аналитикой прогресса.' },
  { tag: 'Сегмент B', title: 'Собственникам бизнеса с командой 10–100', text: 'Сети, франшизы, многофилиальные бизнесы. Если у вас руководители, администраторы, продажники — и постоянная текучка — единая платформа решает онбординг и стандартизацию раз и навсегда.', what: 'Базу знаний, инструкции, тесты на знание стандартов, отчёты по сотрудникам, трекер созвонов с наставником.' },
  { tag: 'Сегмент C', title: 'Онлайн-школам и образовательным проектам', text: 'Тем, кто упёрся в потолок GetCourse / Kwiga / Tilda и хочет свой продукт с уникальным UX.', what: 'Полноценный аналог GetCourse под ваш бренд — с программами, марафонами, оплатами, чатами и сертификатами.' },
];

const FEATURES_BASE = [
  { ico: I.book, title: 'База знаний с разделами', text: 'Лекции, инструкции, программы, марафоны. Любая структура под вашу логику. Текст, фото, PDF, видео (Rutube/YouTube/VK), ссылки, аудио.' },
  { ico: I.test, title: 'Тестирование сотрудников и учеников', text: 'Тесты после каждого модуля. Один правильный, мультивыбор, открытые вопросы. Автопроверка + ручная проверка. Лидерборд и статистика.', star: true },
  { ico: I.chat, title: 'Чаты в реальном времени', text: 'Общий чат сообщества + личные чаты «ученик ↔ наставник». Уведомления, история переписки, индикатор «печатает».' },
  { ico: I.chart, title: 'Трекер прогресса (ДТП)', text: 'Ученик еженедельно фиксирует Достижения, Трудности, Предложения. Наставник видит динамику в реальном времени и историю всех правок.' },
  { ico: I.phone, title: 'Трекер созвонов', text: 'Журнал кратких выжимок с регулярных созвонов наставника и ученика. Видна вся история взаимодействия.' },
  { ico: I.headphones, title: 'Подкасты, книги, фильмы', text: 'Полки рекомендаций — что слушать, читать, смотреть по программе. Отдельные разделы с быстрой навигацией.' },
  { ico: I.programs, title: 'Программы и марафоны', text: 'Многоблочные программы (например, «Руководитель 360» — 6 блоков) и тематические марафоны с поэтапным прохождением.' },
  { ico: I.user, title: 'Личный кабинет ученика', text: 'Свой прогресс, свои тесты, свои чаты, своё ДТП. Видит только то, что вы открыли в матрице доступов.' },
  { ico: I.shield, title: 'Админка для управления', text: 'Создание/редактирование пользователей, назначение ролей, выдача и закрытие доступов к разделам, управление контентом.' },
  { ico: I.smartphone, title: 'Мобильная версия (PWA)', text: 'Платформа устанавливается на телефон как приложение. Push-уведомления, работа офлайн, адаптивная вёрстка.' },
];

const FEATURES_EXT = [
  'Геймификация (баллы, уровни, бейджи)',
  'Домашние задания с проверкой',
  'Календарь и расписание',
  'Аналитика для собственника',
  'Генерация сертификатов',
  'Email-рассылки и напоминания',
  'Приём оплат (Robokassa, ЮKassa)',
  'Интеграция с Zoom / Google Meet',
  'Реферальная система',
];

const COMPARE_ROWS = [
  { label: 'Стоимость на старте', getCourse: '5–30 тыс ₽/мес', tilda: '1–5 тыс ₽/мес', custom: 'от 300 тыс ₽', us: '15 000 ₽ разово' },
  { label: 'Ежемесячная плата', getCourse: '5–30 тыс ₽', tilda: '1–5 тыс ₽', custom: 'хостинг + поддержка', us: '3 500 ₽/мес' },
  { label: 'Срок запуска', getCourse: '1–2 недели', tilda: '1 неделя', custom: '2–6 месяцев', us: '1–2 недели' },
  { label: 'Готовая база знаний', getCourse: 'Шаблон', tilda: 'Своими силами', custom: 'Любая', us: 'Готовые 11 разделов' },
  { label: 'Тестирование', getCourse: 'Базовое', tilda: 'Нет', custom: 'Любое', us: 'Включено' },
  { label: 'Чаты в реальном времени', getCourse: 'Базовые', tilda: 'Нет', custom: 'Любые', us: 'Включены' },
  { label: 'Свой бренд и домен', getCourse: 'Частично', tilda: 'Да', custom: 'Да', us: 'Да' },
  { label: 'Передача исходного кода', getCourse: 'Нет', tilda: 'Нет', custom: 'Да', us: 'Да' },
  { label: 'Это ваш актив?', getCourse: 'Нет (аренда)', tilda: 'Частично', custom: 'Да', us: 'Да' },
];

const PROCESS = [
  { num: '01', time: '1 день', title: 'Бесплатный разбор', text: 'Созваниваемся на 30 минут, разбираем вашу задачу: кого обучаете, какие нужны разделы, нужны ли индивидуальные доработки. На выходе — точная оценка по срокам и стоимости.' },
  { num: '02', time: '3–5 дней', title: 'Брендирование и наполнение', text: 'Настраиваем платформу под ваш бренд — логотип, цвета, название разделов. Разворачиваем на вашем домене и сервере. Переносим стартовый контент.' },
  { num: '03', time: '5–10 дней', title: 'Доработки и индивидуальные модули', text: 'Если нужны кастомные блоки помимо базы — добавляем их на этом этапе. Стоимость доработок — от 20 000 ₽ за модуль, согласуется заранее.' },
  { num: '04', time: '1–2 дня', title: 'Запуск и обучение команды', text: 'Сдаём готовую платформу. Обучаем администратора и наставников работе в интерфейсе. Передаём исходный код и инструкции.' },
];

const GET_LIST = [
  'Полностью рабочую платформу на вашем домене',
  'Установленную и настроенную базу данных',
  'Аккаунт суперадмина и инструкцию по управлению',
  'Мобильную PWA-версию',
  'Исходный код в вашем GitHub-репозитории',
  'Техническую документацию',
  'Видеоинструкцию для админа и пользователя',
  'Ежемесячное сопровождение от 3 500 ₽',
];

const STACK = [
  { title: 'Frontend', items: ['React + TypeScript', 'Vite', 'React Router', 'TipTap (rich-text)'] },
  { title: 'Backend', items: ['Node.js + Express', 'TypeScript', 'JWT-авторизация', 'Socket.io'] },
  { title: 'База данных', items: ['PostgreSQL', 'Миграции SQL', 'Soft delete', 'Аудит-логи'] },
  { title: 'Инфраструктура', items: ['Ubuntu сервер', 'GitHub + автодеплой', 'PWA + Service Worker', 'Robokassa / ЮKassa'] },
];

const SUPPORT_LIST = [
  'Хостинг и регистрация домена',
  'Регулярные бэкапы базы данных',
  'Мониторинг работы сервера 24/7',
  'Обновления безопасности',
  'Мелкие правки и подкрутки контента',
  'Техподдержка в почте и Telegram',
];

const FAQ = [
  { q: 'Почему так дёшево? В чём подвох?', a: 'Подвоха нет. У нас уже есть полностью разработанная и отлаженная платформа Kids CEO — мы просто разворачиваем её на вашем домене и брендируем под вас. Не разрабатываем код с нуля для каждого клиента, поэтому 15 000 ₽ — реальная цена развёртывания.' },
  { q: 'Сколько займёт развёртывание?', a: 'Базовый функционал — 1–2 недели от момента оплаты до сдачи. С индивидуальными доработками — 2–3 недели. Точный срок фиксируем после бесплатного разбора.' },
  { q: 'Что входит в 3 500 ₽/мес?', a: 'Хостинг, регистрация домена, регулярные бэкапы БД, мониторинг сервера, обновления безопасности, мелкие правки и техподдержка в Telegram. Это вся стоимость владения платформой — больше ничего платить не нужно.' },
  { q: 'А если ваш разработчик пропадёт?', a: 'Передаём вам полный исходный код и документацию. Любой React/Node-разработчик с рынка подхватит проект. Платформа работает на стандартном стеке (React + Node.js + PostgreSQL).' },
  { q: 'Можно ли начать с базового и потом расширять?', a: 'Да, это типовой сценарий. Запускаетесь на базовом тарифе, осваиваетесь, потом по мере роста заказываете индивидуальные модули — от 20 000 ₽ за модуль.' },
  { q: 'Что с безопасностью данных учеников?', a: 'Сервер ваш, база данных ваша. JWT-авторизация, bcrypt-хеши паролей, ролевая модель, soft delete. Никаких сторонних сервисов, кроме тех, что вы сами выбираете (например, Robokassa для оплат).' },
  { q: 'А если я хочу свой дизайн, не как у Kids CEO?', a: 'Базовое брендирование — логотип, фирменные цвета, название разделов — входит в 15 000 ₽. Если нужна полная переработка дизайна с нуля — это индивидуальный запрос (20–25 000 ₽).' },
  { q: 'Сколько пользователей выдержит платформа?', a: 'Базовая конфигурация — до 5000 одновременных пользователей без проблем. При росте масштабируем сервер (входит в сопровождение).' },
  { q: 'А если я хочу платформу не для обучения, а для другого?', a: 'Напишите — обсудим. Мы делаем именно обучающие платформы и платформы для команд, но архитектура подходит и для смежных задач (внутренние корпоративные порталы, сообщества, базы знаний). Для нестандартных задач — индивидуальный тариф.' },
];

/* ============================================================
   Хуки
   ============================================================ */
function useScrollState() {
  const [scrolled, setScrolled] = useState(false);
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 60);
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      setShowSticky(y > 600 && y < totalHeight - 600);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return { scrolled, showSticky };
}

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const targets = ref.current.querySelectorAll<HTMLElement>('.mpa-reveal');
    if (targets.length === 0) return;
    if (typeof IntersectionObserver === 'undefined') {
      targets.forEach((el) => el.classList.add('mpa-reveal--visible'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('mpa-reveal--visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return ref;
}

/* ============================================================
   Page (alt: deep blue + coral)
   ============================================================ */
export default function MentorPlatformPageAlt() {
  const { scrolled, showSticky } = useScrollState();
  const rootRef = useReveal();

  return (
    <div className="mpa" ref={rootRef}>

      {/* ---- NAV ---- */}
      <header className={`mpa-nav${scrolled ? ' mpa-nav--scrolled' : ''}`}>
        <div className="mpa__wrap mpa-nav__inner">
          <a className="mpa-nav__logo" href="#top" aria-label="К началу страницы">
            <span className="mpa-nav__logo-mark">M</span>
            <span>Mentor Platform</span>
          </a>
          <nav className="mpa-nav__menu" aria-label="Разделы лендинга">
            <a href="#features">Возможности</a>
            <a href="#case">Кейс</a>
            <a href="#pricing">Стоимость</a>
            <a href="#faq">FAQ</a>
          </nav>
          <a className="mpa-btn mpa-btn--primary mpa-nav__cta" href="#cta">Получить разбор</a>
        </div>
      </header>

      <main id="top">

        {/* ---- HERO ---- */}
        <section className="mpa-hero">
          <div className="mpa__wrap mpa-hero__grid">
            <div className="mpa-hero__content mpa-reveal">
              <span className="mpa-eyebrow mpa-hero__eyebrow">Разработка обучающих платформ под ключ</span>
              <h1 className="mpa-h1 mpa-hero__h1">
                Своя платформа для обучения команды и учеников — от&nbsp;15&nbsp;000&nbsp;₽
              </h1>
              <p className="mpa-lead mpa-hero__lead">
                Запускаем ваш аналог GetCourse за 1–2 недели на базе готовой платформы Kids&nbsp;CEO: база знаний, тестирование сотрудников, чаты с наставником, трекер прогресса. Один раз заплатили — и платформа ваша. Поддержка от 3&nbsp;500&nbsp;₽/мес.
              </p>
              <div className="mpa-hero__cta">
                <a className="mpa-btn mpa-btn--primary mpa-btn--lg" href="#cta">
                  Получить бесплатный разбор {I.arrow}
                </a>
                <a className="mpa-btn mpa-btn--secondary mpa-btn--lg" href="#case">
                  Посмотреть кейс Kids CEO
                </a>
              </div>
              <ul className="mpa-hero__trust">
                <li className="mpa-hero__trust-item">
                  <span className="mpa-hero__trust-ico" aria-hidden="true">{I.check}</span>
                  <span>Запуск за 1–2 недели — на проверенной кодовой базе</span>
                </li>
                <li className="mpa-hero__trust-item">
                  <span className="mpa-hero__trust-ico" aria-hidden="true">{I.check}</span>
                  <span>База знаний, тестирование, чаты, мобильная версия — в стартовой комплектации</span>
                </li>
                <li className="mpa-hero__trust-item">
                  <span className="mpa-hero__trust-ico" aria-hidden="true">{I.check}</span>
                  <span>Опыт: разработали платформу для онлайн-школы Malafeeva School</span>
                </li>
              </ul>
            </div>

            <div className="mpa-hero__visual mpa-reveal" aria-hidden="true">
              <div className="mpa-hero__device">
                <div className="mpa-hero__device-bar">
                  <span /><span /><span />
                </div>
                <div className="mpa-hero__device-rows">
                  <div className="mpa-hero__device-row mpa-hero__device-row--brand" />
                  <div className="mpa-hero__device-row" />
                  <div className="mpa-hero__device-row mpa-hero__device-row--short" />
                </div>
                <div className="mpa-hero__device-card">
                  <div className="mpa-hero__device-row" />
                  <div className="mpa-hero__device-row mpa-hero__device-row--short" />
                </div>
                <div className="mpa-hero__device-card">
                  <div className="mpa-hero__device-row" />
                  <div className="mpa-hero__device-row mpa-hero__device-row--short" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---- PAIN ---- */}
        <section className="mpa-section mpa-section--cool">
          <div className="mpa__wrap">
            <div className="mpa-section__head mpa-reveal">
              <span className="mpa-eyebrow">Проблема</span>
              <h2 className="mpa-h2">Если что-то из этого знакомо — пора менять подход</h2>
            </div>
            <div className="mpa-pain__list">
              {PAINS.map((p, i) => (
                <div className="mpa-card mpa-reveal" key={i}>
                  <span className="mpa-card__num">0{i + 1}</span>
                  <h3 className="mpa-card__title">{p.title}</h3>
                  <p className="mpa-card__text">{p.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---- SOLUTION ---- */}
        <section className="mpa-section">
          <div className="mpa__wrap">
            <div className="mpa-section__head mpa-reveal">
              <span className="mpa-eyebrow">Решение</span>
              <h2 className="mpa-h2">Ваша собственная платформа со всеми инструментами в одном месте</h2>
              <p className="mpa-lead" style={{ marginTop: 16 }}>
                Не строим с нуля и не запираем вас в конструкторе. У нас уже есть отлаженная кодовая база Kids&nbsp;CEO — разворачиваем её на вашем домене, настраиваем под ваш бренд и логику обучения за 1–2 недели. Передаём исходный код — это ваш актив.
              </p>
            </div>
            <div className="mpa-solution__pillars">
              {PILLARS.map((p, i) => (
                <div className="mpa-card mpa-reveal" key={i}>
                  <div className="mpa-card__ico" aria-hidden="true">{p.ico}</div>
                  <h3 className="mpa-card__title">{p.title}</h3>
                  <p className="mpa-card__text">{p.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---- AUDIENCE ---- */}
        <section className="mpa-section mpa-section--blue">
          <div className="mpa__wrap">
            <div className="mpa-section__head mpa-reveal">
              <span className="mpa-eyebrow">Кому подходит</span>
              <h2 className="mpa-h2">Для кого эта платформа</h2>
            </div>
            <div className="mpa-audience__cards">
              {AUDIENCE.map((a, i) => (
                <div className="mpa-audience__card mpa-reveal" key={i}>
                  <span className="mpa-audience__tag">{a.tag}</span>
                  <h3 className="mpa-audience__title">{a.title}</h3>
                  <p className="mpa-audience__text">{a.text}</p>
                  <p className="mpa-audience__what"><strong>Что получаете:</strong> {a.what}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---- FEATURES ---- */}
        <section className="mpa-section" id="features">
          <div className="mpa__wrap">
            <div className="mpa-section__head mpa-reveal">
              <span className="mpa-eyebrow">Функционал</span>
              <h2 className="mpa-h2">Что входит в платформу</h2>
              <p className="mpa-lead" style={{ marginTop: 16 }}>
                Базовая комплектация — на основе уже работающего проекта Kids&nbsp;CEO. Расширения подбираем под ваши задачи.
              </p>
            </div>

            <div className="mpa-features__base">
              {FEATURES_BASE.map((f, i) => (
                <div className="mpa-feature mpa-reveal" key={i}>
                  {f.star && <span className="mpa-feature__star">Ключевой модуль</span>}
                  <div className="mpa-feature__head">
                    <div className="mpa-feature__ico" aria-hidden="true">{f.ico}</div>
                    <h3 className="mpa-feature__title">{f.title}</h3>
                  </div>
                  <p className="mpa-feature__text">{f.text}</p>
                </div>
              ))}
            </div>

            <div className="mpa-features__divider mpa-reveal">
              <span className="mpa-features__divider-text">Расширения по запросу</span>
            </div>

            <div className="mpa-features__ext">
              {FEATURES_EXT.map((e, i) => (
                <div className="mpa-features__ext-item mpa-reveal" key={i}>
                  <span className="mpa-features__ext-ico" aria-hidden="true">{I.plus}</span>
                  <span>{e}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---- CASE ---- */}
        <section className="mpa-section mpa-section--dark" id="case">
          <div className="mpa__wrap">
            <div className="mpa-case__inner">
              <div className="mpa-case__text mpa-reveal">
                <span className="mpa-eyebrow" style={{ color: 'var(--accent)' }}>Кейс</span>
                <h2 className="mpa-h2 mpa-case__h2">Реальный кейс — платформа, которая уже работает</h2>

                <div className="mpa-case__row">
                  <div className="mpa-case__row-label">Что было</div>
                  <p className="mpa-case__row-text">Онлайн-школа управленцев бизнеса (детские центры) обучала руководителей через Telegram, Google Drive и Zoom. Контент дублировался, ученики путались, наставники не успевали отслеживать прогресс каждого.</p>
                </div>

                <div className="mpa-case__row">
                  <div className="mpa-case__row-label">Что сделали</div>
                  <p className="mpa-case__row-text">Полноценное веб-приложение с <strong>11 разделами</strong>, чатами в реальном времени, таблицей ДТП с историей правок, трекером созвонов, ролевой моделью (суперадмин / админ / наставник / ученик), приёмом оплат и мобильной PWA-версией.</p>
                </div>

                <div className="mpa-case__row">
                  <div className="mpa-case__row-label">Стек</div>
                  <p className="mpa-case__row-text">React + TypeScript, Node.js + Express, PostgreSQL, Socket.io, JWT-авторизация. Развёрнуто на собственном сервере под доменом kids-ceo.ru.</p>
                </div>

                <div className="mpa-case__highlight">
                  Эта же платформа теперь — основа для запусков под других клиентов. Поэтому вы не платите за разработку с нуля: все базовые модули (чаты, тесты, ДТП, трекеры, админка) уже отлажены и готовы к развёртыванию на вашем домене.
                </div>
              </div>

              <div className="mpa-case__media mpa-reveal">
                <div className="mpa-case__media-fallback">
                  Скриншот платформы Kids CEO
                </div>
                <img
                  className="mpa-case__img"
                  src="/mentor-platform/kids-ceo-screen.png"
                  alt="Интерфейс платформы Malafeeva School: левая боковая панель с разделами, страница «Инструкции» с фильтрами по категориям и списком чек-листов"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).classList.add('mpa-case__img--hidden'); }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ---- COMPARE ---- */}
        <section className="mpa-section">
          <div className="mpa__wrap">
            <div className="mpa-section__head mpa-reveal">
              <span className="mpa-eyebrow">Отстройка</span>
              <h2 className="mpa-h2">Сравнение: наша платформа vs альтернативы</h2>
            </div>

            {/* Mobile */}
            <div className="mpa-compare__cards">
              <div className="mpa-compare__col mpa-reveal">
                <div className="mpa-compare__title">GetCourse / Kwiga</div>
                {COMPARE_ROWS.map((r, i) => (
                  <div className="mpa-compare__row" key={i}>
                    <span className="mpa-compare__row-label">{r.label}</span>
                    <span className="mpa-compare__row-value">{r.getCourse}</span>
                  </div>
                ))}
              </div>
              <div className="mpa-compare__col mpa-reveal">
                <div className="mpa-compare__title">Конструкторы (Tilda)</div>
                {COMPARE_ROWS.map((r, i) => (
                  <div className="mpa-compare__row" key={i}>
                    <span className="mpa-compare__row-label">{r.label}</span>
                    <span className="mpa-compare__row-value">{r.tilda}</span>
                  </div>
                ))}
              </div>
              <div className="mpa-compare__col mpa-reveal">
                <div className="mpa-compare__title">Разработка с нуля</div>
                {COMPARE_ROWS.map((r, i) => (
                  <div className="mpa-compare__row" key={i}>
                    <span className="mpa-compare__row-label">{r.label}</span>
                    <span className="mpa-compare__row-value">{r.custom}</span>
                  </div>
                ))}
              </div>
              <div className="mpa-compare__col mpa-compare__col--us mpa-reveal">
                <div className="mpa-compare__title">Наша платформа</div>
                {COMPARE_ROWS.map((r, i) => (
                  <div className="mpa-compare__row" key={i}>
                    <span className="mpa-compare__row-label">{r.label}</span>
                    <span className="mpa-compare__row-value">{r.us}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop */}
            <table className="mpa-compare__table mpa-reveal">
              <thead>
                <tr>
                  <th></th>
                  <th>GetCourse / Kwiga</th>
                  <th>Конструкторы (Tilda)</th>
                  <th>Разработка с нуля</th>
                  <th className="mpa-compare__us">Наша платформа</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((r, i) => (
                  <tr key={i}>
                    <th scope="row">{r.label}</th>
                    <td>{r.getCourse}</td>
                    <td>{r.tilda}</td>
                    <td>{r.custom}</td>
                    <td className="mpa-compare__us">{r.us}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mpa-compare__highlight mpa-reveal">
              <strong>15 000 ₽</strong> — это 1 месяц аренды среднего тарифа GetCourse. У вас же — собственная платформа на годы вперёд.
            </div>
          </div>
        </section>

        {/* ---- PROCESS ---- */}
        <section className="mpa-section mpa-section--cool">
          <div className="mpa__wrap">
            <div className="mpa-section__head mpa-reveal">
              <span className="mpa-eyebrow">Этапы работы</span>
              <h2 className="mpa-h2">Как мы работаем</h2>
            </div>
            <div className="mpa-process__steps">
              {PROCESS.map((p, i) => (
                <div className="mpa-process__step mpa-reveal" key={i}>
                  <div className="mpa-process__num">{p.num}</div>
                  <div>
                    <span className="mpa-process__step-time">{p.time}</span>
                    <h3 className="mpa-process__step-title" style={{ marginTop: 4 }}>{p.title}</h3>
                  </div>
                  <p className="mpa-process__step-text">{p.text}</p>
                </div>
              ))}
            </div>
            <div className="mpa-process__after mpa-reveal">
              <strong>После запуска:</strong> ежемесячное сопровождение за 3 500 ₽/мес — обновления, бэкапы, мониторинг сервера, мелкие правки.
            </div>
          </div>
        </section>

        {/* ---- GET LIST ---- */}
        <section className="mpa-section mpa-section--blue">
          <div className="mpa__wrap">
            <div className="mpa-section__head mpa-reveal">
              <span className="mpa-eyebrow">При запуске</span>
              <h2 className="mpa-h2">В день запуска вы получаете</h2>
            </div>
            <ul className="mpa-getlist__list">
              {GET_LIST.map((item, i) => (
                <li className="mpa-getlist__item mpa-reveal" key={i}>
                  <span className="mpa-getlist__check" aria-hidden="true">{I.check}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---- STACK ---- */}
        <section className="mpa-section">
          <div className="mpa__wrap">
            <div className="mpa-section__head mpa-reveal">
              <span className="mpa-eyebrow">Технологии</span>
              <h2 className="mpa-h2">На чём построено</h2>
              <p className="mpa-lead" style={{ marginTop: 16 }}>
                Современный, проверенный стек. Любой Frontend / Backend разработчик с рынка сможет подхватить проект.
              </p>
            </div>
            <div className="mpa-stack__grid">
              {STACK.map((s, i) => (
                <div className="mpa-stack__card mpa-reveal" key={i}>
                  <div className="mpa-stack__title">{s.title}</div>
                  <ul className="mpa-stack__list">
                    {s.items.map((it, j) => <li key={j}>{it}</li>)}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mpa-stack__note mpa-reveal">
              <strong>Все данные на вашем сервере.</strong> JWT-авторизация, bcrypt-хеши паролей, ролевая модель, мягкое удаление. Никто кроме вас не имеет доступа к данным учеников и сотрудников.
            </div>
          </div>
        </section>

        {/* ---- PRICING ---- */}
        <section className="mpa-section mpa-section--cool" id="pricing">
          <div className="mpa__wrap">
            <div className="mpa-section__head mpa-reveal">
              <span className="mpa-eyebrow">Стоимость</span>
              <h2 className="mpa-h2">Прозрачные цены без скрытых платежей</h2>
              <p className="mpa-lead" style={{ marginTop: 16 }}>
                Платите за развёртывание один раз — дальше только ежемесячное сопровождение.
              </p>
            </div>

            <div className="mpa-pricing__grid">
              <div className="mpa-pricing__card mpa-reveal">
                <div className="mpa-pricing__name">Базовый функционал</div>
                <div>
                  <div className="mpa-pricing__price">15 000 ₽</div>
                  <div className="mpa-pricing__price-note">разово, развёртывание</div>
                </div>
                <p className="mpa-pricing__desc">Готовая платформа на базе Kids CEO под ваш бренд.</p>
                <ul className="mpa-pricing__list">
                  {[
                    'База знаний с разделами',
                    'Тестирование сотрудников и учеников',
                    'Общий чат + личные чаты',
                    'Трекер прогресса (ДТП-таблица)',
                    'Трекер созвонов',
                    'Личный кабинет каждого пользователя',
                    'Админка для управления',
                    'Мобильная версия (PWA)',
                    'Развёртывание на вашем домене',
                    'Передача исходного кода',
                  ].map((t, i) => (
                    <li className="mpa-pricing__li" key={i}>
                      <span className="mpa-pricing__check" aria-hidden="true">{I.check}</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
                <div className="mpa-pricing__time">Срок запуска: <strong>1–2 недели</strong></div>
                <a className="mpa-btn mpa-btn--secondary mpa-btn--block" href="#cta">Заказать платформу</a>
              </div>

              <div className="mpa-pricing__card mpa-pricing__card--featured mpa-reveal">
                <span className="mpa-pricing__featured-tag">Гибкое решение</span>
                <div className="mpa-pricing__name">Индивидуальный запрос</div>
                <div>
                  <div className="mpa-pricing__price">20–25 000 ₽</div>
                  <div className="mpa-pricing__price-note">за каждый кастомный модуль</div>
                </div>
                <p className="mpa-pricing__desc">Базовый функционал + ваши уникальные доработки.</p>
                <ul className="mpa-pricing__list">
                  {[
                    'Геймификация (баллы, бейджи, уровни)',
                    'Домашние задания с проверкой',
                    'Сертификаты при завершении программы',
                    'Дашборд аналитики для собственника',
                    'Интеграция с Zoom / Google Meet',
                    'Приём оплат (Robokassa / ЮKassa)',
                    'Email-рассылки и автонапоминания',
                    'Кастомные роли и права доступа',
                    'Любая своя бизнес-логика',
                  ].map((t, i) => (
                    <li className="mpa-pricing__li" key={i}>
                      <span className="mpa-pricing__check" aria-hidden="true">{I.check}</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
                <div className="mpa-pricing__time">Срок запуска: <strong>2–3 недели</strong></div>
                <a className="mpa-btn mpa-btn--primary mpa-btn--block" href="#cta">Обсудить задачу</a>
              </div>
            </div>

            <div className="mpa-pricing__support mpa-reveal">
              <div className="mpa-pricing__support-head">
                <div className="mpa-pricing__support-tag">Обслуживание и поддержка</div>
                <div className="mpa-pricing__support-price">3 500 ₽/мес</div>
              </div>
              <ul className="mpa-pricing__support-list">
                {SUPPORT_LIST.map((t, i) => (
                  <li key={i}>{I.check}<span>{t}</span></li>
                ))}
              </ul>
            </div>

            <p className="mpa-pricing__note">
              Все цены окончательные. Доменное имя оформляется на вас. Можно начать с базового тарифа и добавлять индивидуальные модули по мере роста.
            </p>
          </div>
        </section>

        {/* ---- FAQ ---- */}
        <section className="mpa-section" id="faq">
          <div className="mpa__wrap">
            <div className="mpa-section__head mpa-reveal">
              <span className="mpa-eyebrow">FAQ</span>
              <h2 className="mpa-h2">Частые вопросы</h2>
            </div>
            <div className="mpa-faq__list">
              {FAQ.map((item, i) => (
                <details className="mpa-faq__item mpa-reveal" key={i}>
                  <summary className="mpa-faq__q">
                    <span>{item.q}</span>
                    <span className="mpa-faq__q-ico" aria-hidden="true">{I.plus}</span>
                  </summary>
                  <div className="mpa-faq__a"><p>{item.a}</p></div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ---- FINAL CTA ---- */}
        <section className="mpa-section mpa-section--blue" id="cta">
          <div className="mpa__wrap">
            <div className="mpa-cta__head mpa-reveal">
              <span className="mpa-eyebrow">Связаться</span>
              <h2 className="mpa-h2" style={{ marginTop: 12 }}>Получите бесплатный разбор вашего проекта</h2>
              <p className="mpa-lead" style={{ marginTop: 16 }}>
                За 30 минут разберём вашу задачу, предложим архитектуру платформы и оценим срок и стоимость. Без обязательств — выберите удобный способ связи.
              </p>
            </div>

            <div className="mpa-cta__channels">
              <a
                className="mpa-cta__channel mpa-cta__channel--primary mpa-reveal"
                href="https://t.me/Cyberj1nn"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="mpa-cta__channel-ico" aria-hidden="true">{I.telegram}</span>
                <span className="mpa-cta__channel-title">Написать в Telegram</span>
                <span className="mpa-cta__channel-handle">@Cyberj1nn</span>
              </a>

              <a
                className="mpa-cta__channel mpa-reveal"
                href="https://wa.me/79278060278"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="mpa-cta__channel-ico" aria-hidden="true">{I.whatsapp}</span>
                <span className="mpa-cta__channel-title">Написать в WhatsApp</span>
                <span className="mpa-cta__channel-handle">+7 927 806-02-78</span>
              </a>

              <a
                className="mpa-cta__channel mpa-reveal"
                href="mailto:fesha.lucky@gmail.com"
              >
                <span className="mpa-cta__channel-ico" aria-hidden="true">{I.mail}</span>
                <span className="mpa-cta__channel-title">Написать на почту</span>
                <span className="mpa-cta__channel-handle">fesha.lucky@gmail.com</span>
              </a>
            </div>

            <p className="mpa-cta__note">Отвечаем в течение 1–2 часов в рабочее время (МСК).</p>
          </div>
        </section>

        {/* ---- FOOTER ---- */}
        <footer className="mpa-footer">
          <div className="mpa__wrap">
            <div className="mpa-footer__grid">

              <div>
                <div className="mpa-footer__brand">
                  <span className="mpa-footer__brand-mark">M</span>
                  Sochi Sites
                </div>
                <div className="mpa-footer__col-title">Студия</div>
                <ul className="mpa-footer__list">
                  <li><a href="https://sochi-sites.ru/" target="_blank" rel="noopener noreferrer">sochi-sites.ru</a></li>
                  <li><a href="https://sochi-sites.ru/oferta" target="_blank" rel="noopener noreferrer">Оферта</a></li>
                </ul>
              </div>

              <div>
                <div className="mpa-footer__col-title">Контакты</div>
                <ul className="mpa-footer__list">
                  <li><a href="https://t.me/Cyberj1nn" target="_blank" rel="noopener noreferrer">Telegram: @Cyberj1nn</a></li>
                  <li><a href="https://wa.me/79278060278" target="_blank" rel="noopener noreferrer">WhatsApp: +7 927 806-02-78</a></li>
                  <li><a href="mailto:fesha.lucky@gmail.com">fesha.lucky@gmail.com</a></li>
                </ul>
              </div>

              <div>
                <div className="mpa-footer__col-title">Реквизиты</div>
                <div className="mpa-footer__legal">
                  <p><strong>ИП Малафеев Дмитрий Владимирович</strong></p>
                  <p>ИНН: 730210225270</p>
                  <p>ОГРН: 321732500056804</p>
                  <p>Почтовый адрес: 433515, РФ, Ульяновская обл., г. Димитровград, ул. Гвардейская, д. 29, кв. 2</p>
                  <p>E-mail: fesha.lucky@gmail.com</p>
                </div>
              </div>

            </div>
          </div>
        </footer>
      </main>

      {/* ---- STICKY MOBILE CTA ---- */}
      <div className={`mpa-sticky-cta${showSticky ? ' mpa-sticky-cta--shown' : ''}`}>
        <a className="mpa-btn mpa-btn--primary" href="#cta">Получить разбор</a>
      </div>

    </div>
  );
}
