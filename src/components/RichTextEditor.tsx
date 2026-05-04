import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Youtube from '@tiptap/extension-youtube';
import Image from '@tiptap/extension-image';
import { uploadImage } from '../lib/imageHelpers';

type Props = {
  value: string;
  onChange: (html: string) => void;
};

const extensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
  }),
  Underline,
  Link.configure({ openOnClick: false, autolink: true }),
  Placeholder.configure({ placeholder: 'Text sekce…' }),
  Youtube.configure({
    width: 640,
    height: 360,
    HTMLAttributes: { class: 'rounded-lg max-w-full w-full aspect-video' },
  }),
  Image.configure({
    HTMLAttributes: { class: 'max-w-full h-auto rounded inline-block my-2' },
  }),
];

export default function RichTextEditor({ value, onChange }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    content: value,
    editorProps: {
      attributes: {
        class:
          'tiptap max-w-none min-h-[220px] px-3 py-3 focus:outline-none text-gray-800 text-sm leading-relaxed [&_iframe]:max-w-full',
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const cur = editor.getHTML();
    if (value !== cur) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) {
    return <div className="min-h-[220px] border border-gray-200 rounded-lg bg-gray-50 animate-pulse" />;
  }

  const addLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Adresa odkazu (URL):', prev ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const addYoutube = () => {
    const url = window.prompt('Odkaz na YouTube (např. https://www.youtube.com/watch?v=…):', 'https://');
    if (!url?.trim()) return;
    editor.chain().focus().setYoutubeVideo({ src: url.trim() }).run();
  };

  const addImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const url = await uploadImage(file);
        editor.chain().focus().setImage({ src: url }).run();
      } catch (err) {
        console.error(err);
        alert('Chyba při nahrávání obrázku.');
      }
    };
    input.click();
  };

  const btn = (active: boolean) =>
    `px-2 py-1.5 rounded text-xs font-bold transition-colors ${
      active ? 'bg-[#132333] text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
    }`;

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
      <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 bg-gray-50">
        <button type="button" className={btn(editor.isActive('bold'))} onClick={() => editor.chain().focus().toggleBold().run()}>
          B
        </button>
        <button type="button" className={btn(editor.isActive('italic'))} onClick={() => editor.chain().focus().toggleItalic().run()}>
          I
        </button>
        <button
          type="button"
          className={btn(editor.isActive('underline'))}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          U
        </button>
        <button
          type="button"
          className={btn(editor.isActive('strike'))}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          S
        </button>
        <span className="w-px bg-gray-200 mx-1 self-stretch" />
        <button type="button" className={btn(editor.isActive('heading', { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </button>
        <button type="button" className={btn(editor.isActive('heading', { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          H3
        </button>
        <button type="button" className={btn(editor.isActive('bulletList'))} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          • Seznam
        </button>
        <button type="button" className={btn(editor.isActive('orderedList'))} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          1. Seznam
        </button>
        <button type="button" className={btn(editor.isActive('blockquote'))} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          Citace
        </button>
        <span className="w-px bg-gray-200 mx-1 self-stretch" />
        <button type="button" className={btn(editor.isActive('link'))} onClick={addLink}>
          Odkaz
        </button>
        <button type="button" className={btn(false)} onClick={addImage}>
          Obrázek
        </button>
        <button type="button" className={btn(false)} onClick={addYoutube}>
          YouTube
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
