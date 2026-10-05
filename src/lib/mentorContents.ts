import { toast } from 'sonner'
import { MessageSquareText, Presentation, ScrollText, Wrench } from 'lucide-react'
import { getSignedUrl } from '@/lib/storage'
import type { MentorContent, MentorContentKind } from '@/types/database'

export type ContentKindOption = { value: MentorContentKind; label: string; icon: typeof Presentation }

// Conteúdos de produção das aulas (Conteúdo gravado › Conteúdos)
export const CONTENT_KINDS: ContentKindOption[] = [
  { value: 'slides', label: 'Slides', icon: Presentation },
  { value: 'ferramentas', label: 'Ferramentas', icon: Wrench },
  { value: 'scripts', label: 'Scripts', icon: ScrollText },
]

// Scripts de vendas (Comercial › Scripts)
export const SALES_SCRIPT_KINDS: ContentKindOption[] = [
  { value: 'comercial', label: 'Scripts comerciais', icon: MessageSquareText },
]

export async function openContent(content: MentorContent) {
  if (content.url) {
    window.open(content.url, '_blank', 'noopener,noreferrer')
    return
  }
  try {
    const url = await getSignedUrl('mentor-contents', content.file_path!)
    window.open(url, '_blank', 'noopener,noreferrer')
  } catch {
    toast.error('Não foi possível abrir o ficheiro.')
  }
}
