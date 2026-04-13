import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getTabContent,
  getContentDetail,
  deleteContent,
  type ContentListItem,
  type ContentDetail,
} from '../api/content';
import { getTabs, type Tab } from '../api/auth';
import ContentItem from '../components/ContentItem';
import ContentEditor from '../components/ContentEditor';
import './ContentPage.css';

const TAB_TITLES: Record<string, string> = {
  podcasts: 'Подкасты',
  books: 'Книги',
  films: 'Фильмы',
};

export default function SimplePage() {
  const { tab } = useParams<{ tab: string }>();
  const { user } = useAuth();
  const isAdmin = ['superadmin', 'admin', 'mentor'].includes(user?.role || '');

  const [tabData, setTabData] = useState<Tab | null>(null);
  const [items, setItems] = useState<ContentListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<ContentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editorMode, setEditorMode] = useState<'create' | 'edit' | null>(null);
  const [editItem, setEditItem] = useState<ContentDetail | null>(null);

  const title = TAB_TITLES[tab || ''] || tab || '';

  useEffect(() => {
    if (!tab) return;
    getTabs().then((tabs) => {
      const found = tabs.find((t) => t.slug === tab);
      if (found) setTabData(found);
    });
  }, [tab]);

  const reloadContent = useCallback(() => {
    if (!tab) return;
    setPage(1);
    getTabContent(tab, 1).then((res) => {
      setItems(res.items);
      setTotal(res.total);
    });
  }, [tab]);

  useEffect(() => {
    if (!tab) return;
    setLoading(true);
    setDetail(null);
    setEditorMode(null);
    setPage(1);
    getTabContent(tab, 1)
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tab]);

  const loadMore = () => {
    if (!tab) return;
    const nextPage = page + 1;
    getTabContent(tab, nextPage).then((res) => {
      setItems((prev) => [...prev, ...res.items]);
      setPage(nextPage);
    });
  };

  const openDetail = (id: string) => {
    getContentDetail(id).then(setDetail).catch(console.error);
  };

  const handleEdit = (item: ContentDetail) => {
    setEditItem(item);
    setEditorMode('edit');
    setDetail(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить этот материал?')) return;
    await deleteContent(id);
    setDetail(null);
    reloadContent();
  };

  const handleSaved = () => {
    setEditorMode(null);
    setEditItem(null);
    reloadContent();
  };

  if (loading) {
    return <div className="content-page-loading">Загрузка...</div>;
  }

  if (editorMode && tabData) {
    return (
      <ContentEditor
        tabId={tabData.id}
        editItem={editorMode === 'edit' ? editItem : null}
        onSaved={handleSaved}
        onCancel={() => { setEditorMode(null); setEditItem(null); }}
      />
    );
  }

  if (detail) {
    return (
      <ContentItem
        content={detail}
        onBack={() => setDetail(null)}
        onEdit={isAdmin ? () => handleEdit(detail) : undefined}
        onDelete={isAdmin ? () => handleDelete(detail.id) : undefined}
      />
    );
  }

  return (
    <div className="content-page">
      <div className="content-page-header">
        <h1 className="content-page-title">{title}</h1>
        {isAdmin && tabData && (
          <button className="content-page-create" onClick={() => setEditorMode('create')}>
            + Создать
          </button>
        )}
      </div>

      <div className="content-page-list">
        {items.length === 0 ? (
          <div className="content-page-empty">Нет материалов</div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="content-card" onClick={() => openDetail(item.id)}>
              <h3 className="content-card-title">{item.title}</h3>
              <div className="content-card-meta">
                <span>{item.authorName}</span>
                <span>·</span>
                <span>{new Date(item.createdAt).toLocaleDateString('ru-RU')}</span>
                {item.videoUrl && <span className="content-card-badge">🎬 Видео</span>}
              </div>
            </div>
          ))
        )}
      </div>

      {items.length < total && (
        <button className="content-page-more" onClick={loadMore}>
          Показать ещё
        </button>
      )}
    </div>
  );
}
