import { Link } from 'react-router-dom';
import './CulinaryNavigatorPage.css';

function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export default function CulinaryNavigatorPage() {
  return (
    <div className="cln cln--main">

      <section className="cln-hero">
        <div className="cln__wrap cln-hero__grid">

          <div className="cln-hero__tile">
            <span className="cln-hero__sticker">быстро · вкусно · бюджетно</span>
            <span className="cln-eyebrow">рецепты на каждый день</span>
            <h1 className="cln-hero__headline">Кулинарный<br />навигатор<br />для&nbsp;<em>студентов</em></h1>
            <p className="cln-hero__sub">
              Три приёма пищи&nbsp;— три&nbsp;проверенных рецепта. Простые ингредиенты, минимум посуды, максимум вкуса. Всё&nbsp;что нужно, чтобы хорошо поесть между парами и&nbsp;сессией.
            </p>
            <div className="cln-hero__chips">
              <span className="cln-hero__chip">⏱ до&nbsp;30&nbsp;минут</span>
              <span className="cln-hero__chip">🍳 без&nbsp;духовки</span>
              <span className="cln-hero__chip">💸 бюджетно</span>
            </div>
          </div>

          <aside className="cln-hero__photo">
            <div className="cln-hero__photo-cap">
              <b>три&nbsp;кадра — три&nbsp;блюда</b>
              Выбирай приём пищи — и&nbsp;открывай рецепт
            </div>
          </aside>

        </div>
      </section>

      <section className="cln-meals">
        <div className="cln__wrap">

          <header className="cln-meals__head">
            <span className="cln-eyebrow">выбери приём пищи</span>
            <h2 className="cln-h2">Завтрак, обед или&nbsp;ужин?</h2>
            <p className="cln-lead">Три готовых рецепта&nbsp;— по&nbsp;одному на&nbsp;каждую часть дня. Нажми на&nbsp;карточку, чтобы открыть рецепт целиком.</p>
          </header>

          <div className="cln-meals__grid">

            <Link className="cln-meal cln-meal--breakfast" to="/Culinary_Navigator/breakfast">
              <span className="cln-meal__tag">утро</span>
              <span className="cln-meal__num">01</span>
              <h3 className="cln-meal__ttl">Завтрак</h3>
              <p className="cln-meal__sub">Овсяный блин&nbsp;— сытный завтрак из&nbsp;трёх ингредиентов за&nbsp;10&nbsp;минут.</p>
              <span className="cln-meal__cta">
                Открыть рецепт
                <ArrowRight />
              </span>
            </Link>

            <Link className="cln-meal cln-meal--lunch" to="/Culinary_Navigator/lunch">
              <span className="cln-meal__tag">день</span>
              <span className="cln-meal__num">02</span>
              <h3 className="cln-meal__ttl">Обед</h3>
              <p className="cln-meal__sub">Овощной крем-суп&nbsp;— полезно и&nbsp;сытно, в&nbsp;одной кастрюле.</p>
              <span className="cln-meal__cta">
                Открыть рецепт
                <ArrowRight />
              </span>
            </Link>

            <Link className="cln-meal cln-meal--dinner" to="/Culinary_Navigator/dinner">
              <span className="cln-meal__tag">вечер</span>
              <span className="cln-meal__num">03</span>
              <h3 className="cln-meal__ttl">Ужин</h3>
              <p className="cln-meal__sub">Ленивая пицца на&nbsp;сковороде&nbsp;— без&nbsp;теста и&nbsp;духовки, 20&nbsp;минут под&nbsp;крышкой.</p>
              <span className="cln-meal__cta">
                Открыть рецепт
                <ArrowRight />
              </span>
            </Link>

          </div>
        </div>
      </section>

      <section className="cln-strip">
        <div className="cln__wrap">
          <div className="cln-strip__card">
            <div className="cln-strip__ttl">
              Продукты&nbsp;— из&nbsp;ближайшего магазина. Техника&nbsp;— плита и&nbsp;микроволновка. <b>Никакой магии&nbsp;— только вкус.</b>
            </div>
            <div className="cln-strip__icon">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#FDF8EC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 6 8" /><path d="M10 2v6" /><path d="M14 2v6a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3" />
                <path d="M17 2c2 2 3 4 3 7s-1 5-3 7l-1 6h-3l-1-6" />
              </svg>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
