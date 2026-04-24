import { Link } from 'react-router-dom';
import './CulinaryNavigatorPage.css';

function ChevronLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12 12 3l9 9" />
      <path d="M5 10v10a1 1 0 0 0 1 1h3v-6h6v6h3a1 1 0 0 0 1-1V10" />
    </svg>
  );
}

function TipIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FDF8EC" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6" /><path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
    </svg>
  );
}

export default function CulinaryNavigatorBreakfastPage() {
  return (
    <div className="cln cln--recipe">

      <nav className="cln-nav">
        <div className="cln__wrap cln-nav__row">
          <Link className="cln-btn-back" to="/Culinary_Navigator">
            <ChevronLeft />
            На главную
          </Link>
        </div>
      </nav>

      <section className="cln-rhero">
        <div className="cln__wrap cln-rhero__grid">
          <div className="cln-rhero__text">
            <div className="cln-rhero__crumbs">Кулинарный навигатор&nbsp;/&nbsp;<b>Завтрак</b></div>
            <span className="cln-eyebrow">рецепт №&nbsp;01 · утро</span>
            <h1 className="cln-rhero__ttl">Овсяный блин</h1>
            <p className="cln-rhero__lead">
              Быстрый сытный завтрак из&nbsp;трёх ингредиентов&nbsp;— хлопьев, яйца и&nbsp;капли масла. 10&nbsp;минут на&nbsp;всё, одна сковорода, никакой готовки накануне.
            </p>
            <div className="cln-rhero__stats">
              <div className="cln-stat"><div className="cln-stat__n">10 мин</div><div className="cln-stat__l">время</div></div>
              <div className="cln-stat"><div className="cln-stat__n">1</div><div className="cln-stat__l">порция</div></div>
              <div className="cln-stat"><div className="cln-stat__n">★☆☆</div><div className="cln-stat__l">сложность</div></div>
              <div className="cln-stat"><div className="cln-stat__n">~370</div><div className="cln-stat__l">ккал</div></div>
            </div>
          </div>

          <aside className="cln-rhero__photo cln-rhero__photo--breakfast">
            <span className="cln-rhero__sticker cln-rhero__sticker--breakfast">завтрак</span>
            <div className="cln-rhero__caption">«Разбил яйцо, смешал с&nbsp;хлопьями&nbsp;— и&nbsp;блин готов.»</div>
          </aside>
        </div>
      </section>

      <section className="cln-recipe">
        <div className="cln__wrap cln-recipe__grid">

          <aside className="cln-ing">
            <span className="cln-eyebrow">что нужно</span>
            <h2 className="cln-ing__ttl">Ингредиенты</h2>
            <ul className="cln-ing__list">
              <li><span>Овсяные/ячменные хлопья (или&nbsp;смесь)</span><b>50 г</b></li>
              <li><span>Яйцо</span><b>1 шт</b></li>
              <li><span>Масло растительное</span><b>1 ст.л.</b></li>
              <li><span>Специи</span><b>по вкусу</b></li>
              <li><span>Соль</span><b>щепотка</b></li>
            </ul>
          </aside>

          <div className="cln-steps">
            <span className="cln-eyebrow">порядок действий</span>
            <h2 className="cln-steps__ttl">Пошаговое приготовление</h2>

            <div className="cln-step">
              <div className="cln-step__n">1</div>
              <div className="cln-step__body">
                <h3 className="cln-step__h">Разогрей сковороду</h3>
                <p className="cln-step__t">Поставь сковороду на&nbsp;<b>средний огонь</b>, добавь немного масла. Пока прогревается&nbsp;— готовь смесь.</p>
              </div>
            </div>

            <div className="cln-step">
              <div className="cln-step__n">2</div>
              <div className="cln-step__body">
                <h3 className="cln-step__h">Взбей яйцо</h3>
                <p className="cln-step__t">В&nbsp;миску разбей яйцо и&nbsp;взбей вилкой до&nbsp;однородности&nbsp;— без&nbsp;фанатизма, просто чтобы белок и&nbsp;желток соединились.</p>
              </div>
            </div>

            <div className="cln-step">
              <div className="cln-step__n">3</div>
              <div className="cln-step__body">
                <h3 className="cln-step__h">Добавь хлопья</h3>
                <p className="cln-step__t">Всыпь хлопья так, чтобы они <b>легли плотным слоем</b> на&nbsp;яйцо. Добавь щепотку соли и&nbsp;специи&nbsp;— паприка, чёрный перец, сухие травы.</p>
              </div>
            </div>

            <div className="cln-step">
              <div className="cln-step__n">4</div>
              <div className="cln-step__body">
                <h3 className="cln-step__h">Размешай массу</h3>
                <p className="cln-step__t">Тщательно перемешай, чтобы <b>каждый хлопушок</b> обволокся яйцом&nbsp;— иначе блин будет рассыпаться.</p>
              </div>
            </div>

            <div className="cln-step">
              <div className="cln-step__n">5</div>
              <div className="cln-step__body">
                <h3 className="cln-step__h">Вылей на&nbsp;сковородку</h3>
                <p className="cln-step__t">Выложи массу на&nbsp;разогретую сковороду и&nbsp;разровняй вилкой так, чтобы <b>толщина блина была равномерной</b>.</p>
              </div>
            </div>

            <div className="cln-step">
              <div className="cln-step__n">6</div>
              <div className="cln-step__body">
                <h3 className="cln-step__h">Переверни</h3>
                <p className="cln-step__t">Как только нижняя часть начнёт <b>румяниться</b>&nbsp;— переверни блин лопаткой. Держи на&nbsp;сковороде до&nbsp;золотистой корочки с&nbsp;обеих сторон.</p>
              </div>
            </div>

            <div className="cln-step">
              <div className="cln-step__n">7</div>
              <div className="cln-step__body">
                <h3 className="cln-step__h">Сервируй</h3>
                <p className="cln-step__t">Сними со&nbsp;сковородки, подавай тёплым. Сверху&nbsp;— что угодно: мёд, ягоды, сыр, авокадо или&nbsp;просто сметана.</p>
              </div>
            </div>

            <div className="cln-tip">
              <div className="cln-tip__ico"><TipIcon /></div>
              <div>
                <div className="cln-tip__h">лайфхак студента</div>
                <p className="cln-tip__t">Добавь сверху мёд, банан или&nbsp;сыр&nbsp;— один и&nbsp;тот же блин превращается в&nbsp;сладкий или&nbsp;солёный завтрак.</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      <section className="cln-foot">
        <Link className="cln-btn-home" to="/Culinary_Navigator">
          <HomeIcon />
          На главную
        </Link>
      </section>

    </div>
  );
}
