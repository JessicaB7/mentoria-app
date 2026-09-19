import * as React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Star } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { StudentFeedback } from '@/types/database'

export function FeedbackForm({ studentId, endDate }: { studentId: string; endDate: string | null }) {
  const queryClient = useQueryClient()
  const [rating, setRating] = React.useState(0)
  const [comment, setComment] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  const { data: existing, isLoading } = useQuery({
    queryKey: ['student-feedback', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_feedback')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as StudentFeedback | null
    },
  })

  const eligible = React.useMemo(() => {
    if (!endDate) return false
    const from = new Date(`${endDate}T00:00:00`)
    from.setDate(from.getDate() - 14)
    return new Date() >= from
  }, [endDate])

  async function submit() {
    if (!rating) return
    setSaving(true)
    const { error } = await supabase.from('student_feedback').insert({
      student_id: studentId,
      rating,
      comment: comment.trim() || null,
    })
    setSaving(false)
    if (error) {
      toast.error('Não foi possível enviar o feedback.')
      return
    }
    toast.success('Obrigada pelo feedback!')
    queryClient.invalidateQueries({ queryKey: ['student-feedback', studentId] })
  }

  if (isLoading || !eligible) return null

  if (existing) {
    return (
      <Card>
        <CardContent className="pt-4">
          <p className="text-sm text-fg">Obrigada pelo teu feedback — já foi registado. 🙏</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Como foi a tua experiência?</CardTitle>
        <CardDescription>
          O teu ciclo de mentoria está a chegar ao fim — conta-nos como correu.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button key={value} type="button" onClick={() => setRating(value)}>
              <Star
                className={cn('size-6', value <= rating ? 'fill-primary text-primary' : 'text-fg-muted')}
              />
            </button>
          ))}
        </div>
        <Textarea
          placeholder="Algum comentário (opcional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <Button onClick={submit} disabled={!rating || saving} className="w-fit">
          Enviar feedback
        </Button>
      </CardContent>
    </Card>
  )
}
