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

export default function CulinaryNavigatorLunchPage() {
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
            <div className="cln-rhero__crumbs">Кулинарный навигатор&nbsp;/&nbsp;<b>Обед</b></div>
            <span className="cln-eyebrow">рецепт №&nbsp;02 · день</span>
            <h1 className="cln-rhero__ttl">Овощной крем-суп</h1>
            <p className="cln-rhero__lead">
              Густой кремовый суп из&nbsp;простых овощей&nbsp;— картофель, кабачок, брокколи, шпинат. Одна кастрюля, блендер&nbsp;— и&nbsp;обед на&nbsp;несколько дней вперёд.
            </p>
            <div className="cln-rhero__stats">
              <div className="cln-stat"><div className="cln-stat__n">40 мин</div><div className="cln-stat__l">время</div></div>
              <div className="cln-stat"><div className="cln-stat__n">4</div><div className="cln-stat__l">порции</div></div>
              <div className="cln-stat"><div className="cln-stat__n">★☆☆</div><div className="cln-stat__l">сложность</div></div>
              <div className="cln-stat"><div className="cln-stat__n">~150</div><div className="cln-stat__l">ккал</div></div>
            </div>
          </div>

          <aside className="cln-rhero__photo cln-rhero__photo--lunch">
            <span className="cln-rhero__sticker cln-rhero__sticker--lunch">обед</span>
            <div className="cln-rhero__caption">«Бросил овощи в&nbsp;кипяток, пюрировал&nbsp;— и&nbsp;обед готов.»</div>
          </aside>
        </div>
      </section>

      <section className="cln-recipe">
        <div className="cln__wrap cln-recipe__grid">

          <aside className="cln-ing">
            <span className="cln-eyebrow">что нужно</span>
            <h2 className="cln-ing__ttl">Ингредиенты</h2>
            <ul className="cln-ing__list">
              <li><span>Картофель</span><b>500 г</b></li>
              <li><span>Кабачок</span><b>1 средний</b></li>
              <li><span>Лук репчатый</span><b>1 шт</b></li>
              <li><span>Морковь большая</span><b>2 шт</b></li>
              <li><span>Шпинат</span><b>горсть</b></li>
              <li><span>Брокколи</span><b>100 г</b></li>
              <li><span>Соль, перец, специи</span><b>по вкусу</b></li>
              <li><span>Бульонный кубик</span><b>по желанию</b></li>
              <li><span>Зелень для подачи</span><b>пучок</b></li>
            </ul>
          </aside>

          <div className="cln-steps">
            <span className="cln-eyebrow">порядок действий</span>
            <h2 className="cln-steps__ttl">Пошаговое приготовление</h2>

            <div className="cln-step">
              <div className="cln-step__n">1</div>
              <div className="cln-step__body">
                <h3 className="cln-step__h">Почисти корнеплоды</h3>
                <p className="cln-step__t">Картофель, лук и&nbsp;морковь <b>очисти и&nbsp;нарежь кусочками</b>&nbsp;— крупность не&nbsp;важна, всё равно будет идти под&nbsp;блендер.</p>
              </div>
            </div>

            <div className="cln-step">
              <div className="cln-step__n">2</div>
              <div className="cln-step__body">
                <h3 className="cln-step__h">Подготовь кабачок</h3>
                <p className="cln-step__t">Кабачок вымой и&nbsp;нарежь кружочками или кубиками. Кожицу у&nbsp;молодого кабачка можно не&nbsp;снимать.</p>
              </div>
            </div>

            <div className="cln-step">
              <div className="cln-step__n">3</div>
              <div className="cln-step__body">
                <h3 className="cln-step__h">Разморозь зелёное</h3>
                <p className="cln-step__t">Шпинат и&nbsp;брокколи <b>вынь из&nbsp;морозилки и&nbsp;разморозь</b>&nbsp;— можно прямо на&nbsp;столе, пока режешь остальные овощи.</p>
              </div>
            </div>

            <div className="cln-step">
              <div className="cln-step__n">4</div>
              <div className="cln-step__body">
                <h3 className="cln-step__h">Свари овощи</h3>
                <p className="cln-step__t">Сложи все нарезанные овощи в&nbsp;кастрюлю, залей кипятком так, чтобы <b>вода покрывала всё</b>. Вари до&nbsp;готовности&nbsp;— пока овощи не&nbsp;станут мягкими (~20&nbsp;мин).</p>
              </div>
            </div>

            <div className="cln-step">
              <div className="cln-step__n">5</div>
              <div className="cln-step__body">
                <h3 className="cln-step__h">Приправь</h3>
                <p className="cln-step__t">Добавь соль, перец, любимые специи. По&nbsp;желанию&nbsp;— <b>бульонный кубик</b> для&nbsp;насыщенности вкуса.</p>
              </div>
            </div>

            <div className="cln-step">
              <div className="cln-step__n">6</div>
              <div className="cln-step__body">
                <h3 className="cln-step__h">Пюрируй</h3>
                <p className="cln-step__t">Погружным блендером <b>пюрируй суп</b> прямо в&nbsp;кастрюле до&nbsp;однородной кремовой текстуры. Если хочешь пожиже&nbsp;— добавь немного кипятка.</p>
              </div>
            </div>

            <div className="cln-step">
              <div className="cln-step__n">7</div>
              <div className="cln-step__body">
                <h3 className="cln-step__h">Подавай</h3>
                <p className="cln-step__t">Разлей по&nbsp;тарелкам, укрась свежей зеленью. По&nbsp;желанию&nbsp;— ложка сметаны, семечки или&nbsp;гренки.</p>
              </div>
            </div>

            <div className="cln-tip">
              <div className="cln-tip__ico"><TipIcon /></div>
              <div>
                <div className="cln-tip__h">лайфхак студента</div>
                <p className="cln-tip__t">Суп хранится в&nbsp;холодильнике до&nbsp;3&nbsp;дней&nbsp;— готовь сразу большую кастрюлю, на&nbsp;следующий день он становится только вкуснее.</p>
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
