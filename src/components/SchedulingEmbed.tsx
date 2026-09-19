import { useIndividualIntroSettings } from '@/components/IndividualIntro'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function SchedulingEmbed() {
  const { data: settings } = useIndividualIntroSettings()
  if (!settings?.schedulingUrl) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Agendar sessão</CardTitle>
      </CardHeader>
      <CardContent>
        <iframe
          src={settings.schedulingUrl}
          title="Agendamento de sessão"
          className="h-[700px] w-full rounded-md border border-border"
        />
      </CardContent>
    </Card>
  )
}
