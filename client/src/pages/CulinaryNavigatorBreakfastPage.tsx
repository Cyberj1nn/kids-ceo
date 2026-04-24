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
            <h1 className="cln-rhero__ttl">Овсянка с&nbsp;бананом и&nbsp;арахисовой пастой</h1>
            <p className="cln-rhero__lead">
              Бодрящий завтрак, который готовится быстрее, чем закипает чайник. Сладость банана, ореховая паста и&nbsp;капля мёда превращают обычную овсянку в&nbsp;приличный завтрак&nbsp;— и&nbsp;даёт энергию до&nbsp;обеда.
            </p>
            <div className="cln-rhero__stats">
              <div className="cln-stat"><div className="cln-stat__n">7 мин</div><div className="cln-stat__l">время</div></div>
              <div className="cln-stat"><div className="cln-stat__n">1</div><div className="cln-stat__l">порция</div></div>
              <div className="cln-stat"><div className="cln-stat__n">★☆☆</div><div className="cln-stat__l">сложность</div></div>
              <div className="cln-stat"><div className="cln-stat__n">≈ 90₽</div><div className="cln-stat__l">бюджет</div></div>
            </div>
          </div>

          <aside className="cln-rhero__photo cln-rhero__photo--breakfast">
            <span className="cln-rhero__sticker cln-rhero__sticker--breakfast">завтрак</span>
            <div className="cln-rhero__caption">«Встал, насыпал, залил&nbsp;— готово. Чайник ещё&nbsp;свистит.»</div>
          </aside>
        </div>
      </section>

      <section className="cln-recipe">
        <div className="cln__wrap cln-recipe__grid">

          <aside className="cln-ing">
            <span className="cln-eyebrow">что нужно</span>
            <h2 className="cln-ing__ttl">Ингредиенты</h2>
            <ul className="cln-ing__list">
              <li><span>Овсяные хлопья</span><b>50 г</b></li>
              <li><span>Молоко (или&nbsp;вода)</span><b>200 мл</b></li>
              <li><span>Банан, спелый</span><b>1 шт</b></li>
              <li><span>Арахисовая паста</span><b>1 ст.л.</b></li>
              <li><span>Мёд</span><b>1 ч.л.</b></li>
              <li><span>Корица молотая</span><b>щепотка</b></li>
              <li><span>Соль</span><b>по вкусу</b></li>
            </ul>
          </aside>

          <div className="cln-steps">
            <span className="cln-eyebrow">порядок действий</span>
            <h2 className="cln-steps__ttl">Пошаговое приготовление</h2>

            <div className="cln-step">
              <div className="cln-step__n">1</div>
              <div className="cln-step__body">
                <h3 className="cln-step__h">Закипяти жидкость</h3>
                <p className="cln-step__t">В&nbsp;небольшом ковшике доведи молоко (или&nbsp;воду) до&nbsp;лёгкого кипения. Добавь щепотку соли&nbsp;— она <b>раскроет вкус</b>, хлопья не&nbsp;станут пресными.</p>
              </div>
            </div>

            <div className="cln-step">
              <div className="cln-step__n">2</div>
              <div className="cln-step__body">
                <h3 className="cln-step__h">Засыпь овсянку</h3>
                <p className="cln-step__t">Всыпь хлопья, убавь огонь до&nbsp;минимума и&nbsp;вари, помешивая, <b>3–4&nbsp;минуты</b> до&nbsp;густоты. Если любишь пожиже&nbsp;— добавь ещё 30&nbsp;мл молока.</p>
              </div>
            </div>

            <div className="cln-step">
              <div className="cln-step__n">3</div>
              <div className="cln-step__body">
                <h3 className="cln-step__h">Подготовь банан</h3>
                <p className="cln-step__t">Половину банана нарежь кружочками, вторую половину разомни вилкой в&nbsp;пюре&nbsp;— оно даст естественную сладость прямо в&nbsp;кашу.</p>
              </div>
            </div>

            <div className="cln-step">
              <div className="cln-step__n">4</div>
              <div className="cln-step__body">
                <h3 className="cln-step__h">Смешай основу</h3>
                <p className="cln-step__t">Сними ковшик с&nbsp;огня, вмешай банановое пюре, арахисовую пасту и&nbsp;мёд. Перемешивай <b>не&nbsp;дольше 30&nbsp;секунд</b>&nbsp;— паста должна едва разойтись, создавая прожилки.</p>
              </div>
            </div>

            <div className="cln-step">
              <div className="cln-step__n">5</div>
              <div className="cln-step__body">
                <h3 className="cln-step__h">Подавай</h3>
                <p className="cln-step__t">Переложи в&nbsp;тарелку, сверху разложи кружочки банана, присыпь корицей. По&nbsp;желанию&nbsp;— капля мёда и&nbsp;горсть орехов.</p>
              </div>
            </div>

            <div className="cln-tip">
              <div className="cln-tip__ico"><TipIcon /></div>
              <div>
                <div className="cln-tip__h">лайфхак студента</div>
                <p className="cln-tip__t">Нет плиты? Залей хлопья молоком с&nbsp;вечера, оставь в&nbsp;холодильнике&nbsp;— утром получишь «ленивую овсянку» без&nbsp;варки.</p>
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
