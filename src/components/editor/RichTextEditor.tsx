'use client';

import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Heading1, 
  Heading2, 
  List, 
  ListOrdered, 
  Quote, 
  Table as TableIcon,
  Undo,
  Redo,
  Trash
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  editable?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start writing your experiment logs, procedures, and observations here...',
  editable = true,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Placeholder.configure({
        placeholder,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[250px] p-4 text-zinc-900',
      },
    },
  });

  // Sync editor content with external value updates (e.g. from initial load)
  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div className="w-full border border-zinc-200 rounded-lg min-h-[300px] bg-zinc-50 animate-pulse" />
    );
  }

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div className={cn(
      "w-full border border-zinc-200 rounded-lg overflow-hidden bg-white transition-all",
      {
        "focus-within:border-primary focus-within:ring-1 focus-within:ring-primary": editable
      }
    )}>
      {editable && (
        <div className="flex flex-wrap items-center gap-1 p-2 bg-zinc-50 border-b border-zinc-200">
          {/* History */}
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1.5 rounded-md hover:bg-zinc-200 disabled:opacity-30 text-zinc-600 transition cursor-pointer"
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1.5 rounded-md hover:bg-zinc-200 disabled:opacity-30 text-zinc-600 transition cursor-pointer"
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </button>
          
          <div className="w-px h-5 bg-zinc-200 mx-1" />

          {/* Formats */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              "p-1.5 rounded-md text-zinc-600 transition cursor-pointer",
              editor.isActive('bold') ? "bg-zinc-200 text-zinc-950 font-bold" : "hover:bg-zinc-200"
            )}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(
              "p-1.5 rounded-md text-zinc-600 transition cursor-pointer",
              editor.isActive('italic') ? "bg-zinc-200 text-zinc-950" : "hover:bg-zinc-200"
            )}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={cn(
              "p-1.5 rounded-md text-zinc-600 transition cursor-pointer",
              editor.isActive('underline') ? "bg-zinc-200 text-zinc-950" : "hover:bg-zinc-200"
            )}
            title="Underline"
          >
            <UnderlineIcon className="h-4 w-4" />
          </button>

          <div className="w-px h-5 bg-zinc-200 mx-1" />

          {/* Headings */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={cn(
              "p-1.5 rounded-md text-zinc-600 transition cursor-pointer",
              editor.isActive('heading', { level: 1 }) ? "bg-zinc-200 text-zinc-950" : "hover:bg-zinc-200"
            )}
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={cn(
              "p-1.5 rounded-md text-zinc-600 transition cursor-pointer",
              editor.isActive('heading', { level: 2 }) ? "bg-zinc-200 text-zinc-950" : "hover:bg-zinc-200"
            )}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </button>

          <div className="w-px h-5 bg-zinc-200 mx-1" />

          {/* Lists */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(
              "p-1.5 rounded-md text-zinc-600 transition cursor-pointer",
              editor.isActive('bulletList') ? "bg-zinc-200 text-zinc-950" : "hover:bg-zinc-200"
            )}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(
              "p-1.5 rounded-md text-zinc-600 transition cursor-pointer",
              editor.isActive('orderedList') ? "bg-zinc-200 text-zinc-950" : "hover:bg-zinc-200"
            )}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn(
              "p-1.5 rounded-md text-zinc-600 transition cursor-pointer",
              editor.isActive('blockquote') ? "bg-zinc-200 text-zinc-950" : "hover:bg-zinc-200"
            )}
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </button>

          <div className="w-px h-5 bg-zinc-200 mx-1" />

          {/* Tables */}
          <button
            type="button"
            onClick={insertTable}
            className="p-1.5 rounded-md hover:bg-zinc-200 text-zinc-600 transition cursor-pointer"
            title="Insert Table (3x3)"
          >
            <TableIcon className="h-4 w-4" />
          </button>

          {editor.isActive('table') && (
            <>
              <button
                type="button"
                onClick={() => editor.chain().focus().addColumnBefore().run()}
                className="px-1.5 py-0.5 text-xs font-semibold rounded hover:bg-zinc-200 text-zinc-600 transition cursor-pointer"
              >
                +Col L
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                className="px-1.5 py-0.5 text-xs font-semibold rounded hover:bg-zinc-200 text-zinc-600 transition cursor-pointer"
              >
                +Col R
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().deleteColumn().run()}
                className="px-1.5 py-0.5 text-xs font-semibold rounded hover:bg-zinc-200 text-zinc-600 transition cursor-pointer"
              >
                -Col
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().addRowBefore().run()}
                className="px-1.5 py-0.5 text-xs font-semibold rounded hover:bg-zinc-200 text-zinc-600 transition cursor-pointer"
              >
                +Row A
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().addRowAfter().run()}
                className="px-1.5 py-0.5 text-xs font-semibold rounded hover:bg-zinc-200 text-zinc-600 transition cursor-pointer"
              >
                +Row B
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().deleteRow().run()}
                className="px-1.5 py-0.5 text-xs font-semibold rounded hover:bg-zinc-200 text-zinc-600 transition cursor-pointer"
              >
                -Row
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().deleteTable().run()}
                className="p-1 rounded hover:bg-rose-100 hover:text-rose-600 text-zinc-600 transition cursor-pointer"
                title="Delete Table"
              >
                <Trash className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      )}
      <div className="prose max-w-none min-h-[300px] overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
