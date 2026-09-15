import * as React from 'react'
import { Bold, Smile } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu'

const EMOJIS = [
  '😀', '🙂', '😉', '😍', '🤩', '🙌', '👍', '👏', '💪', '🎉',
  '🔥', '⭐', '✅', '❌', '❗', '❓', '💡', '📌', '📅', '📞',
  '💬', '📝', '📈', '💰', '🚀', '🤝', '❤️', '👀', '✍️', '🙏',
]

export function RichTextarea({
  id,
  value,
  onChange,
  className,
}: {
  id?: string
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  const ref = React.useRef<HTMLTextAreaElement>(null)
  const [emojiOpen, setEmojiOpen] = React.useState(false)

  function applyAtSelection(build: (selected: string) => { text: string; cursorStart: number; cursorEnd: number }) {
    const ta = ref.current
    if (!ta) return
    const { selectionStart, selectionEnd, value: current } = ta
    const before = current.slice(0, selectionStart)
    const selected = current.slice(selectionStart, selectionEnd)
    const after = current.slice(selectionEnd)
    const { text, cursorStart, cursorEnd } = build(selected)
    const next = `${before}${text}${after}`
    onChange(next)
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(selectionStart + cursorStart, selectionStart + cursorEnd)
    })
  }

  function toggleBold() {
    applyAtSelection((selected) =>
      selected
        ? { text: `**${selected}**`, cursorStart: 2, cursorEnd: 2 + selected.length }
        : { text: '****', cursorStart: 2, cursorEnd: 2 },
    )
  }

  function insertEmoji(emoji: string) {
    applyAtSelection(() => ({ text: emoji, cursorStart: emoji.length, cursorEnd: emoji.length }))
    setEmojiOpen(false)
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <Button type="button" variant="outline" size="icon" className="size-7" onClick={toggleBold} title="Negrito">
          <Bold className="size-3.5" />
        </Button>
        <DropdownMenu open={emojiOpen} onOpenChange={setEmojiOpen}>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="icon" className="size-7" title="Inserir emoji">
              <Smile className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="grid w-56 grid-cols-8 gap-0.5 p-2">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => insertEmoji(emoji)}
                className="flex size-6 items-center justify-center rounded text-base hover:bg-border/50"
              >
                {emoji}
              </button>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Textarea
        id={id}
        ref={ref}
        className={className}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
