import * as React from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function StudentHome() {
  const { profile, refreshProfile } = useAuth()
  const [fullName, setFullName] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    setFullName(profile?.full_name ?? '')
    setPhone(profile?.phone ?? '')
  }, [profile])

  const dirty = profile != null && (fullName !== profile.full_name || phone !== (profile.phone ?? ''))
  const initials = profile?.full_name?.slice(0, 2).toUpperCase() ?? '??'

  async function handleSave() {
    if (!profile || !fullName.trim()) return
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim(), phone: phone.trim() || null })
      .eq('id', profile.id)
    setSaving(false)
    if (error) {
      toast.error('Não foi possível guardar os teus dados.')
      return
    }
    await refreshProfile()
    toast.success('Dados atualizados.')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Avatar className="size-12">
          <AvatarFallback className="text-base">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl font-semibold text-fg">Olá, {profile?.full_name}</h1>
          <p className="text-sm text-fg-muted">Bem-vindo(a) de volta à tua mentoria.</p>
        </div>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-base">Os teus dados</CardTitle>
          <CardDescription>Mantém o teu nome e contacto atualizados.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="student-name">Nome completo</Label>
            <Input id="student-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="student-phone">Telefone</Label>
            <Input
              id="student-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="912 345 678"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="student-email">Email</Label>
            <Input id="student-email" value={profile?.email ?? ''} disabled />
          </div>
          <Button onClick={handleSave} disabled={!dirty || saving || !fullName.trim()} className="w-fit">
            Guardar
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
