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

export default function CulinaryNavigatorDinnerPage() {
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
            <div className="cln-rhero__crumbs">Кулинарный навигатор&nbsp;/&nbsp;<b>Ужин</b></div>
            <span className="cln-eyebrow">рецепт №&nbsp;03 · вечер</span>
            <h1 className="cln-rhero__ttl">Запечённые овощи с&nbsp;курицей и&nbsp;сыром</h1>
            <p className="cln-rhero__lead">
              Лёгкий ужин на&nbsp;одном противне: сочная курица, карамелизованные овощи и&nbsp;расплавленный сыр сверху. Минимум мытья посуды, максимум пользы&nbsp;— то, что нужно после долгого дня.
            </p>
            <div className="cln-rhero__stats">
              <div className="cln-stat"><div className="cln-stat__n">35 мин</div><div className="cln-stat__l">время</div></div>
              <div className="cln-stat"><div className="cln-stat__n">2</div><div className="cln-stat__l">порции</div></div>
              <div className="cln-stat"><div className="cln-stat__n">★★☆</div><div className="cln-stat__l">сложность</div></div>
              <div className="cln-stat"><div className="cln-stat__n">≈ 280₽</div><div className="cln-stat__l">бюджет</div></div>
            </div>
          </div>

          <aside className="cln-rhero__photo cln-rhero__photo--dinner">
            <span className="cln-rhero__sticker cln-rhero__sticker--dinner">ужин</span>
            <div className="cln-rhero__caption">«Поставил в&nbsp;духовку&nbsp;— и&nbsp;успеваешь досмотреть серию.»</div>
          </aside>
        </div>
      </section>

      <section className="cln-recipe">
        <div className="cln__wrap cln-recipe__grid">

          <aside className="cln-ing">
            <span className="cln-eyebrow">что нужно</span>
            <h2 className="cln-ing__ttl">Ингредиенты</h2>
            <ul className="cln-ing__list">
              <li><span>Куриное филе (или&nbsp;бёдра)</span><b>300 г</b></li>
              <li><span>Картофель молодой</span><b>3 шт</b></li>
              <li><span>Кабачок</span><b>1 небольшой</b></li>
              <li><span>Перец болгарский</span><b>1 шт</b></li>
              <li><span>Помидоры черри</span><b>8–10 шт</b></li>
              <li><span>Сыр (моцарелла&nbsp;/ твёрдый)</span><b>80 г</b></li>
              <li><span>Оливковое масло</span><b>2 ст.л.</b></li>
              <li><span>Сушёные травы (орегано, тимьян)</span><b>1 ч.л.</b></li>
              <li><span>Чеснок</span><b>2 зубчика</b></li>
              <li><span>Соль, перец</span><b>по вкусу</b></li>
            </ul>
          </aside>

          <div className="cln-steps">
            <span className="cln-eyebrow">порядок действий</span>
            <h2 className="cln-steps__ttl">Пошаговое приготовление</h2>

            <div className="cln-step">
              <div className="cln-step__n">1</div>
              <div className="cln-step__body">
                <h3 className="cln-step__h">Разогрей духовку</h3>
                <p className="cln-step__t">Включи духовку на&nbsp;<b>200&nbsp;°C</b>&nbsp;— она прогреется, пока ты&nbsp;нарезаешь овощи. Противень застели пергаментом или слегка смажь маслом.</p>
              </div>
            </div>

            <div className="cln-step">
              <div className="cln-step__n">2</div>
              <div className="cln-step__body">
                <h3 className="cln-step__h">Подготовь овощи</h3>
                <p className="cln-step__t">Картофель разрежь пополам (или на&nbsp;четвертинки, если крупный), кабачок&nbsp;— крупными кружками, перец&nbsp;— полосками, черри оставь целыми. Чеснок раздави плоской стороной ножа&nbsp;— кожицу не&nbsp;снимай.</p>
              </div>
            </div>

            <div className="cln-step">
              <div className="cln-step__n">3</div>
              <div className="cln-step__body">
                <h3 className="cln-step__h">Замаринуй курицу и&nbsp;овощи</h3>
                <p className="cln-step__t">Филе нарежь крупными кусками. В&nbsp;большой миске соедини курицу и&nbsp;овощи, добавь оливковое масло, травы, соль, перец. <b>Перемешай руками</b>&nbsp;— так маринад лучше распределится.</p>
              </div>
            </div>

            <div className="cln-step">
              <div className="cln-step__n">4</div>
              <div className="cln-step__body">
                <h3 className="cln-step__h">Отправь в&nbsp;духовку</h3>
                <p className="cln-step__t">Выложи всё на&nbsp;противень ровным слоем&nbsp;— <b>не&nbsp;нагромождая горкой</b>, иначе получится тушёнка, а&nbsp;не&nbsp;запечёнка. Запекай 20&nbsp;минут, затем перемешай лопаткой.</p>
              </div>
            </div>

            <div className="cln-step">
              <div className="cln-step__n">5</div>
              <div className="cln-step__body">
                <h3 className="cln-step__h">Добавь сыр</h3>
                <p className="cln-step__t">Посыпь тёртым сыром (или выложи ломтиками моцареллы) и&nbsp;верни в&nbsp;духовку ещё на&nbsp;<b>8–10&nbsp;минут</b>&nbsp;— до&nbsp;золотистой корочки и&nbsp;румяных овощей.</p>
              </div>
            </div>

            <div className="cln-step">
              <div className="cln-step__n">6</div>
              <div className="cln-step__body">
                <h3 className="cln-step__h">Подавай горячим</h3>
                <p className="cln-step__t">Дай постоять 2–3&nbsp;минуты&nbsp;— соки разойдутся. По&nbsp;желанию посыпь свежей зеленью и&nbsp;сбрызни лимонным соком. Можно есть прямо с&nbsp;противня.</p>
              </div>
            </div>

            <div className="cln-tip">
              <div className="cln-tip__ico"><TipIcon /></div>
              <div>
                <div className="cln-tip__h">лайфхак студента</div>
                <p className="cln-tip__t">Нет духовки? Всё&nbsp;то&nbsp;же самое можно сделать в&nbsp;большой сковороде под&nbsp;крышкой&nbsp;— только овощи нарежь помельче, а&nbsp;сыр добавь в&nbsp;самом конце и&nbsp;дай&nbsp;расплавиться.</p>
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
