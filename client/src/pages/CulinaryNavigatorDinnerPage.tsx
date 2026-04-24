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
            <h1 className="cln-rhero__ttl">Ленивая пицца на&nbsp;сковороде</h1>
            <p className="cln-rhero__lead">
              Пицца без&nbsp;теста и&nbsp;духовки. Смешал жидкое тесто на&nbsp;сметане, вылил на&nbsp;сковороду, засыпал начинкой&nbsp;— через 20&nbsp;минут под&nbsp;крышкой у&nbsp;тебя свежая пицца.
            </p>
            <div className="cln-rhero__stats">
              <div className="cln-stat"><div className="cln-stat__n">35 мин</div><div className="cln-stat__l">время</div></div>
              <div className="cln-stat"><div className="cln-stat__n">2</div><div className="cln-stat__l">порции</div></div>
              <div className="cln-stat"><div className="cln-stat__n">★★☆</div><div className="cln-stat__l">сложность</div></div>
              <div className="cln-stat"><div className="cln-stat__n">~500</div><div className="cln-stat__l">ккал</div></div>
            </div>
          </div>

          <aside className="cln-rhero__photo cln-rhero__photo--dinner">
            <span className="cln-rhero__sticker cln-rhero__sticker--dinner">ужин</span>
            <div className="cln-rhero__caption">«Тесто на&nbsp;сметане, сковорода, крышка&nbsp;— никакой духовки.»</div>
          </aside>
        </div>
      </section>

      <section className="cln-recipe">
        <div className="cln__wrap cln-recipe__grid">

          <aside className="cln-ing">
            <span className="cln-eyebrow">что нужно</span>
            <h2 className="cln-ing__ttl">Ингредиенты</h2>
            <ul className="cln-ing__list">
              <li><span>Мука</span><b>100–120 г</b></li>
              <li><span>Яйцо</span><b>1 шт</b></li>
              <li><span>Сметана</span><b>4 ст.л.</b></li>
              <li><span>Подсолнечное масло</span><b>3 ст.л.</b></li>
              <li><span>Кетчуп</span><b>4 ст.л.</b></li>
              <li><span>Помидоры</span><b>2 шт</b></li>
              <li><span>Сыр (моцарелла)</span><b>120 г</b></li>
              <li><span>Тёртый пармезан</span><b>50 г</b></li>
              <li><span>Базилик</span><b>пучок</b></li>
              <li><span>Соль, чёрный перец</span><b>по вкусу</b></li>
            </ul>
          </aside>

          <div className="cln-steps">
            <span className="cln-eyebrow">порядок действий</span>
            <h2 className="cln-steps__ttl">Пошаговое приготовление</h2>

            <div className="cln-step">
              <div className="cln-step__n">1</div>
              <div className="cln-step__body">
                <h3 className="cln-step__h">Замешай тесто</h3>
                <p className="cln-step__t">Смешай сметану, яйцо, <b>1 ст.л.&nbsp;масла</b> и&nbsp;щепотку соли. Всыпь муку и&nbsp;перемешай до&nbsp;состояния <b>жидкого теста</b>. Дай постоять 10&nbsp;минут.</p>
              </div>
            </div>

            <div className="cln-step">
              <div className="cln-step__n">2</div>
              <div className="cln-step__body">
                <h3 className="cln-step__h">Подготовь начинку</h3>
                <p className="cln-step__t">Нарежь помидоры и&nbsp;сыр (моцареллу) <b>тонкими кружками</b>, измельчи базилик. Пармезан натри на&nbsp;мелкой тёрке.</p>
              </div>
            </div>

            <div className="cln-step">
              <div className="cln-step__n">3</div>
              <div className="cln-step__body">
                <h3 className="cln-step__h">Сделай основу</h3>
                <p className="cln-step__t">Вылей тесто на&nbsp;разогретую с&nbsp;маслом сковороду и&nbsp;разровняй. Слегка подсуши под&nbsp;крышкой <b>2&nbsp;минуты</b> на&nbsp;слабом огне.</p>
              </div>
            </div>

            <div className="cln-step">
              <div className="cln-step__n">4</div>
              <div className="cln-step__body">
                <h3 className="cln-step__h">Собери пиццу</h3>
                <p className="cln-step__t">Смажь основу <b>кетчупом</b> равномерным слоем. Сверху выложи базилик, затем сыр, сверху помидоры. Посыпь пармезаном.</p>
              </div>
            </div>

            <div className="cln-step">
              <div className="cln-step__n">5</div>
              <div className="cln-step__body">
                <h3 className="cln-step__h">Томи под&nbsp;крышкой</h3>
                <p className="cln-step__t">Томи на&nbsp;<b>медленном огне</b> около 20&nbsp;минут, пока сыр полностью не&nbsp;расплавится. Готово&nbsp;— ешь горячей!</p>
              </div>
            </div>

            <div className="cln-tip">
              <div className="cln-tip__ico"><TipIcon /></div>
              <div>
                <div className="cln-tip__h">лайфхак студента</div>
                <p className="cln-tip__t">Моцарелла тянется красивее, но&nbsp;любой плавящийся сыр тоже подойдёт&nbsp;— главное, крупно натереть и&nbsp;не&nbsp;экономить.</p>
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
