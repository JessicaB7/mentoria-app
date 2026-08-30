import { supabase } from '@/lib/supabase'
import type { CrmContact } from '@/types/database'

type ConvertResult =
  | { ok: true; credentials: { email: string; password: string } }
  | { ok: false; error: string }

export async function convertContactToStudent(contact: CrmContact): Promise<ConvertResult> {
  if (!contact.email) {
    return {
      ok: false,
      error: `"${contact.name}" não tem email — adiciona um email ao contacto para criar a conta de aluno.`,
    }
  }

  const { data, error } = await supabase.functions.invoke('create-student', {
    body: { email: contact.email, full_name: contact.name, phone: contact.phone },
  })
  if (error || data?.error) {
    return { ok: false, error: data?.error ?? 'Não foi possível criar a conta de aluno.' }
  }

  await supabase
    .from('profiles')
    .update({
      phone: contact.phone,
      start_date: contact.meeting_date,
      mentoria_value: contact.value,
      payment_method: contact.payment_method,
      installments_count: contact.installments_count,
    })
    .eq('id', data.user_id)
  await supabase.from('crm_contacts').update({ student_id: data.user_id }).eq('id', contact.id)

  return { ok: true, credentials: { email: contact.email, password: data.password } }
}
