import * as React from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { CHALLENGE_OPTIONS } from '@/lib/challenges'
import type { BusinessType } from '@/types/database'

const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  independente: 'Trabalhador independente',
  empresa: 'Empresa',
  ainda_nao_comecei: 'Ainda não comecei',
}

export function StudentCheckIn() {
  const { profile, refreshProfile } = useAuth()
  const [businessType, setBusinessType] = React.useState<BusinessType | ''>('')
  const [businessArea, setBusinessArea] = React.useState('')
  const [currentClients, setCurrentClients] = React.useState('')
  const [currentServices, setCurrentServices] = React.useState('')
  const [challenges, setChallenges] = React.useState<string[]>([])
  const [otherChallenges, setOtherChallenges] = React.useState('')
  const [enrollmentReason, setEnrollmentReason] = React.useState('')
  const [successDefinition, setSuccessDefinition] = React.useState('')
  const [learningGoals, setLearningGoals] = React.useState('')
  const [additionalNotes, setAdditionalNotes] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [loaded, setLoaded] = React.useState(false)

  React.useEffect(() => {
    if (profile && !loaded) {
      setBusinessType(profile.business_type ?? '')
      setBusinessArea(profile.business_area ?? '')
      setCurrentClients(profile.current_clients ?? '')
      setCurrentServices(profile.current_services ?? '')
      setChallenges(profile.challenges ?? [])
      setOtherChallenges(profile.other_challenges ?? '')
      setEnrollmentReason(profile.enrollment_reason ?? '')
      setSuccessDefinition(profile.success_definition ?? '')
      setLearningGoals(profile.learning_goals ?? '')
      setAdditionalNotes(profile.additional_notes ?? '')
      setLoaded(true)
    }
  }, [profile, loaded])

  function toggleChallenge(option: string) {
    setChallenges((current) =>
      current.includes(option) ? current.filter((c) => c !== option) : [...current, option],
    )
  }

  async function handleSave() {
    if (!profile) return
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        business_type: businessType || null,
        business_area: businessArea.trim() || null,
        current_clients: currentClients.trim() || null,
        current_services: currentServices.trim() || null,
        challenges: challenges.length > 0 ? challenges : null,
        other_challenges: otherChallenges.trim() || null,
        enrollment_reason: enrollmentReason.trim() || null,
        success_definition: successDefinition.trim() || null,
        learning_goals: learningGoals.trim() || null,
        additional_notes: additionalNotes.trim() || null,
      })
      .eq('id', profile.id)
    setSaving(false)
    if (error) {
      toast.error('Não foi possível guardar o check-in.')
      return
    }
    await refreshProfile()
    toast.success('Check-in guardado. Obrigada!')
  }

  if (!profile || !loaded) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner className="size-6" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Link
        to="/aluno/individual"
        className="flex w-fit items-center gap-1 text-sm text-fg-muted hover:text-fg"
      >
        <ArrowLeft className="size-4" /> Voltar ao acompanhamento individual
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-fg">Check-in Mentoria</h1>
        <p className="text-sm text-fg-muted">
          O teu ponto de partida — ajuda-nos a perceber onde estás agora, para te acompanharmos
          melhor ao longo da mentoria. Podes atualizar isto sempre que quiseres.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="col-span-1 flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="checkin-business-type">Tipo de negócio</Label>
          <Select value={businessType || undefined} onValueChange={(v) => setBusinessType(v as BusinessType)}>
            <SelectTrigger id="checkin-business-type">
              <SelectValue placeholder="Selecionar…" />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(BUSINESS_TYPE_LABELS) as [BusinessType, string][]).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="checkin-business-area">Área de atuação</Label>
          <Input
            id="checkin-business-area"
            placeholder="Ex.: Contabilidade digital"
            value={businessArea}
            onChange={(e) => setBusinessArea(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="checkin-current-clients">Nº de clientes atuais</Label>
          <Input
            id="checkin-current-clients"
            placeholder="Ex.: 5"
            value={currentClients}
            onChange={(e) => setCurrentClients(e.target.value)}
          />
        </div>
        <div className="col-span-1 flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="checkin-current-services">Quais os serviços que tens atualmente?</Label>
          <Textarea
            id="checkin-current-services"
            value={currentServices}
            onChange={(e) => setCurrentServices(e.target.value)}
          />
        </div>
        <div className="col-span-1 flex flex-col gap-1.5 sm:col-span-2">
          <Label>Quais os teus maiores desafios atualmente?</Label>
          <div className="grid grid-cols-1 gap-2 rounded-md border border-border p-3 sm:grid-cols-2">
            {CHALLENGE_OPTIONS.map((option) => (
              <label key={option} className="flex items-center gap-2 text-sm text-fg">
                <Checkbox checked={challenges.includes(option)} onCheckedChange={() => toggleChallenge(option)} />
                {option}
              </label>
            ))}
          </div>
        </div>
        <div className="col-span-1 flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="checkin-other-challenges">Outros desafios não enumerados no ponto anterior</Label>
          <Input
            id="checkin-other-challenges"
            value={otherChallenges}
            onChange={(e) => setOtherChallenges(e.target.value)}
          />
        </div>
        <div className="col-span-1 flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="checkin-enrollment-reason">Quais os motivos de te teres inscrito neste programa?</Label>
          <Textarea
            id="checkin-enrollment-reason"
            value={enrollmentReason}
            onChange={(e) => setEnrollmentReason(e.target.value)}
          />
        </div>
        <div className="col-span-1 flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="checkin-success-definition">
            Quando terminares a mentoria, como vais saber que foi um sucesso para ti?
          </Label>
          <Textarea
            id="checkin-success-definition"
            value={successDefinition}
            onChange={(e) => setSuccessDefinition(e.target.value)}
          />
        </div>
        <div className="col-span-1 flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="checkin-learning-goals">Tens alguma dúvida ou algo que gostavas MESMO de aprender?</Label>
          <Textarea
            id="checkin-learning-goals"
            value={learningGoals}
            onChange={(e) => setLearningGoals(e.target.value)}
          />
        </div>
        <div className="col-span-1 flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="checkin-additional-notes">Algo tópico a acrescentar?</Label>
          <Textarea
            id="checkin-additional-notes"
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
          />
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-fit">
        Guardar
      </Button>
    </div>
  )
}
