import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getCategories,
  getCategoryContent,
  getContentDetail,
  deleteContent,
  reorderContent,
  type Category,
  type ContentListItem,
  type ContentDetail,
} from '../api/content';
import { getTabs, type Tab } from '../api/auth';
import ContentItem from '../components/ContentItem';
import ContentEditor from '../components/ContentEditor';
import './ContentPage.css';

const TAB_TITLES: Record<string, string> = {
  lectures: 'Лекции',
  instructions: 'Инструкции',
  'program-360': 'Программа Руководитель 360',
  marathons: 'Марафоны',
};

export default function ContentPage() {
  const location = useLocation();
  const tab = location.pathname.split('/').filter(Boolean).pop() || '';
  const { user } = useAuth();
  const isAdmin = ['superadmin', 'admin', 'mentor'].includes(user?.role || '');

  const [tabData, setTabData] = useState<Tab | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [activeParent, setActiveParent] = useState<number | null>(null);
  const [items, setItems] = useState<ContentListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<ContentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editorMode, setEditorMode] = useState<'create' | 'edit' | null>(null);
  const [editItem, setEditItem] = useState<ContentDetail | null>(null);

  const title = TAB_TITLES[tab || ''] || tab || '';

  // Загрузка tab_id
  useEffect(() => {
    if (!tab) return;
    getTabs().then((tabs) => {
      const found = tabs.find((t) => t.slug === tab);
      if (found) setTabData(found);
    });
  }, [tab]);

  // Загрузка категорий
  useEffect(() => {
    if (!tab) return;
    setLoading(true);
    setDetail(null);
    setEditorMode(null);
    setActiveCategory(null);
    setActiveParent(null);
    setItems([]);
    getCategories(tab)
      .then((cats) => {
        setCategories(cats);
        const parents = cats.filter((c) => c.parentId === null);
        if (parents.length > 0) {
          const firstParent = parents[0];
          const hasChildren = cats.some((c) => c.parentId === firstParent.id);
          setActiveParent(hasChildren ? firstParent.id : null);
          setActiveCategory(firstParent.id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tab]);

  const parentCategories = categories.filter((c) => c.parentId === null);
  const childCategories = activeParent
    ? categories.filter((c) => c.parentId === activeParent)
    : [];

  const selectParent = (parent: Category) => {
    const hasChildren = categories.some((c) => c.parentId === parent.id);
    setActiveParent(hasChildren ? parent.id : null);
    setActiveCategory(parent.id);
  };

  const reloadContent = useCallback(() => {
    if (!activeCategory) return;
    setPage(1);
    getCategoryContent(activeCategory, 1).then((res) => {
      setItems(res.items);
      setTotal(res.total);
    });
  }, [activeCategory]);

  // Загрузка контента при смене категории
  useEffect(() => {
    if (!activeCategory) return;
    setPage(1);
    setDetail(null);
    setEditorMode(null);
    getCategoryContent(activeCategory, 1)
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
      })
      .catch(console.error);
  }, [activeCategory]);

  const loadMore = () => {
    if (!activeCategory) return;
    const nextPage = page + 1;
    getCategoryContent(activeCategory, nextPage).then((res) => {
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

  const moveItem = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;

    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    const reindexed = next.map((it, i) => ({ ...it, sortOrder: i }));
    setItems(reindexed);

    try {
      await reorderContent(reindexed.map((it) => ({ id: it.id, sortOrder: it.sortOrder })));
    } catch (err) {
      console.error('Reorder error:', err);
      alert('Не удалось сохранить порядок');
      reloadContent();
    }
  };

  if (loading) {
    return <div className="content-page-loading">Загрузка...</div>;
  }

  if (editorMode && tabData) {
    return (
      <ContentEditor
        tabId={tabData.id}
        categoryId={activeCategory}
        categories={categories}
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

      {parentCategories.length > 0 && (
        <div className="content-page-categories">
          {parentCategories.map((cat) => {
            const activeCat = categories.find((c) => c.id === activeCategory);
            const isActive =
              activeCategory === cat.id || activeCat?.parentId === cat.id;
            return (
              <button
                key={cat.id}
                className={`category-chip ${isActive ? 'category-chip--active' : ''}`}
                onClick={() => selectParent(cat)}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      )}

      {childCategories.length > 0 && (
        <div className="content-page-categories content-page-subcategories">
          {childCategories.map((cat) => (
            <button
              key={cat.id}
              className={`category-chip category-chip--sub ${activeCategory === cat.id ? 'category-chip--active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      <div className="content-page-list">
        {items.length === 0 ? (
          <div className="content-page-empty">Нет материалов</div>
        ) : (
          items.map((item, index) => (
            <div key={item.id} className="content-card" onClick={() => openDetail(item.id)}>
              <div className="content-card-main">
                <h3 className="content-card-title">{item.title}</h3>
                <div className="content-card-meta">
                  <span>{item.authorName}</span>
                  <span>·</span>
                  <span>{new Date(item.createdAt).toLocaleDateString('ru-RU')}</span>
                  {item.videoUrl && <span className="content-card-badge">🎬 Видео</span>}
                </div>
              </div>
              {isAdmin && (
                <div className="content-card-reorder" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="content-card-reorder-btn"
                    onClick={(e) => { e.stopPropagation(); moveItem(index, -1); }}
                    disabled={index === 0}
                    title="Переместить вверх"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="content-card-reorder-btn"
                    onClick={(e) => { e.stopPropagation(); moveItem(index, 1); }}
                    disabled={index === items.length - 1}
                    title="Переместить вниз"
                  >
                    ↓
                  </button>
                </div>
              )}
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
