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
            <h1 className="cln-rhero__ttl">Паста с&nbsp;курицей в&nbsp;сливочном соусе</h1>
            <p className="cln-rhero__lead">
              Сытный обед в&nbsp;одной сковороде&nbsp;— никакой груды посуды. Готовая паста, нежная курица и&nbsp;шёлковый соус из&nbsp;сливок с&nbsp;пармезаном. Справляется даже тот, кто «вообще не&nbsp;готовит».
            </p>
            <div className="cln-rhero__stats">
              <div className="cln-stat"><div className="cln-stat__n">20 мин</div><div className="cln-stat__l">время</div></div>
              <div className="cln-stat"><div className="cln-stat__n">2</div><div className="cln-stat__l">порции</div></div>
              <div className="cln-stat"><div className="cln-stat__n">★★☆</div><div className="cln-stat__l">сложность</div></div>
              <div className="cln-stat"><div className="cln-stat__n">≈ 320₽</div><div className="cln-stat__l">бюджет</div></div>
            </div>
          </div>

          <aside className="cln-rhero__photo cln-rhero__photo--lunch">
            <span className="cln-rhero__sticker cln-rhero__sticker--lunch">обед</span>
            <div className="cln-rhero__caption">«Одна сковорода, двадцать минут&nbsp;— и&nbsp;ты&nbsp;уже обедаешь.»</div>
          </aside>
        </div>
      </section>

      <section className="cln-recipe">
        <div className="cln__wrap cln-recipe__grid">

          <aside className="cln-ing">
            <span className="cln-eyebrow">что нужно</span>
            <h2 className="cln-ing__ttl">Ингредиенты</h2>
            <ul className="cln-ing__list">
              <li><span>Паста (пенне&nbsp;/ фузилли)</span><b>200 г</b></li>
              <li><span>Куриное филе</span><b>250 г</b></li>
              <li><span>Сливки 10–20&nbsp;%</span><b>200 мл</b></li>
              <li><span>Чеснок</span><b>2 зубчика</b></li>
              <li><span>Пармезан&nbsp;/ любой твёрдый сыр</span><b>40 г</b></li>
              <li><span>Оливковое масло</span><b>1 ст.л.</b></li>
              <li><span>Соль, чёрный перец</span><b>по вкусу</b></li>
              <li><span>Зелень (петрушка)</span><b>горсть</b></li>
            </ul>
          </aside>

          <div className="cln-steps">
            <span className="cln-eyebrow">порядок действий</span>
            <h2 className="cln-steps__ttl">Пошаговое приготовление</h2>

            <div className="cln-step">
              <div className="cln-step__n">1</div>
              <div className="cln-step__body">
                <h3 className="cln-step__h">Отвари пасту</h3>
                <p className="cln-step__t">В&nbsp;кастрюле доведи воду до&nbsp;кипения, посоли (<b>1&nbsp;ч.л. на&nbsp;литр</b>) и&nbsp;вари пасту на&nbsp;минуту меньше, чем указано на&nbsp;упаковке. Перед сливом сохрани <b>100&nbsp;мл воды</b>&nbsp;— она пригодится для&nbsp;соуса.</p>
              </div>
            </div>

            <div className="cln-step">
              <div className="cln-step__n">2</div>
              <div className="cln-step__body">
                <h3 className="cln-step__h">Обжарь курицу</h3>
                <p className="cln-step__t">Нарежь филе кубиками по&nbsp;1,5&nbsp;см. Разогрей сковороду с&nbsp;оливковым маслом, обжаривай курицу <b>5–6&nbsp;минут</b>, помешивая, до&nbsp;золотистой корочки. Посоли, поперчи и&nbsp;переложи в&nbsp;тарелку.</p>
              </div>
            </div>

            <div className="cln-step">
              <div className="cln-step__n">3</div>
              <div className="cln-step__body">
                <h3 className="cln-step__h">Сделай соус</h3>
                <p className="cln-step__t">В&nbsp;ту&nbsp;же сковороду брось пропущенный через пресс чеснок, обжарь <b>30&nbsp;секунд</b> до&nbsp;аромата&nbsp;— не&nbsp;дай подгореть. Влей сливки, доведи до&nbsp;лёгкого кипения и&nbsp;потоми 2&nbsp;минуты.</p>
              </div>
            </div>

            <div className="cln-step">
              <div className="cln-step__n">4</div>
              <div className="cln-step__body">
                <h3 className="cln-step__h">Собери блюдо</h3>
                <p className="cln-step__t">Добавь в&nbsp;соус натёртый пармезан, перемешай до&nbsp;однородности. Верни курицу, положи пасту и&nbsp;влей пару ложек отложенной воды&nbsp;— соус станет <b>шелковистым</b>. Прогрей всё&nbsp;минуту.</p>
              </div>
            </div>

            <div className="cln-step">
              <div className="cln-step__n">5</div>
              <div className="cln-step__body">
                <h3 className="cln-step__h">Подавай</h3>
                <p className="cln-step__t">Разложи пасту по&nbsp;тарелкам, сверху посыпь рубленой петрушкой и&nbsp;ещё щепоткой сыра. По&nbsp;желанию&nbsp;— капля лимонного сока.</p>
              </div>
            </div>

            <div className="cln-tip">
              <div className="cln-tip__ico"><TipIcon /></div>
              <div>
                <div className="cln-tip__h">лайфхак студента</div>
                <p className="cln-tip__t">Нет сливок? Используй смесь молока (150&nbsp;мл) и&nbsp;сливочного масла (30&nbsp;г)&nbsp;— результат почти тот же, а&nbsp;в&nbsp;холодильнике чаще найдётся.</p>
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
