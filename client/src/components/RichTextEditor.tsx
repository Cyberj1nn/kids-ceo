import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import './RichTextEditor.css';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Image,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  const addLink = () => {
    const url = prompt('Введите URL ссылки:');
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    const url = prompt('Введите URL изображения:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className="rte">
      <div className="rte-toolbar">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'rte-btn--active' : ''}
          title="Жирный"
        >
          <b>B</b>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'rte-btn--active' : ''}
          title="Курсив"
        >
          <i>I</i>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive('underline') ? 'rte-btn--active' : ''}
          title="Подчёркнутый"
        >
          <u>U</u>
        </button>
        <div className="rte-separator" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'rte-btn--active' : ''}
          title="Заголовок"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive('heading', { level: 3 }) ? 'rte-btn--active' : ''}
          title="Подзаголовок"
        >
          H3
        </button>
        <div className="rte-separator" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'rte-btn--active' : ''}
          title="Маркированный список"
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'rte-btn--active' : ''}
          title="Нумерованный список"
        >
          1. List
        </button>
        <div className="rte-separator" />
        <button type="button" onClick={addLink} title="Ссылка">🔗</button>
        <button type="button" onClick={addImage} title="Изображение">🖼️</button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'rte-btn--active' : ''}
          title="Цитата"
        >
          ❝
        </button>
      </div>
      <EditorContent editor={editor} className="rte-content" />
    </div>
  );
}
