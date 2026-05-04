import { useParams } from 'react-router-dom';
import './PlaceholderPage.css';

const TAB_TITLES: Record<string, string> = {
  'beseda': 'Общая беседа',
  'beseda-arkhetipy': 'Беседа Архетипы',
  'beseda-opora': 'Беседа Опора',
  'beseda-otnosheniya': 'Беседа Отношения',
  'beseda-finansy': 'Беседа Финансы',
  'lectures': 'Лекции',
  'instructions': 'Инструкции',
  'podcasts': 'Подкасты',
  'books': 'Книги',
  'films': 'Фильмы',
  'program-360': 'Программа Руководитель 360',
  'marathons': 'Марафоны',
  'personal-chat': 'Личная беседа',
  'dtp': 'ДТП',
  'call-tracker': 'Трекер созвонов',
  'admin': 'Админка',
};

export default function PlaceholderPage() {
  const { tab } = useParams<{ tab: string }>();
  const title = TAB_TITLES[tab || ''] || tab || 'Страница';

  return (
    <div className="placeholder-page">
      <h1>{title}</h1>
      <p>Раздел в разработке</p>
    </div>
  );
}
