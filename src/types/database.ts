export type UserRole = 'admin' | 'mentor' | 'student'

// Admin and mentor have the exact same access level in the app.
export function isStaff(role: UserRole | null | undefined): boolean {
    return role === 'admin' || role === 'mentor'
}
export type CrmStage = 'lead' | 'contacted' | 'proposal' | 'won' | 'lost'
export type CrmTaskStatus = 'pending' | 'done'

export type PaymentMethod = 'pronto' | 'prestacoes'
export type ModuleCategory = 'modulo' | 'individual' | 'ao_vivo'

export type Profile = {
    id: string
    email: string
    full_name: string
    phone: string | null
    role: UserRole
    avatar_url: string | null
    start_date: string | null
    mentoria_value: number | null
    payment_method: PaymentMethod | null
    installments_count: number | null
    created_at: string
}

export type Module = {
    id: string
    title: string
    description: string | null
    position: number
    published: boolean
    cover_path: string | null
    created_at: string
}

export type Lesson = {
    id: string
    module_id: string | null
    category: ModuleCategory
    student_id: string | null
    title: string
    description: string | null
    video_path: string | null
    duration_minutes: number | null
    position: number
    published: boolean
    created_at: string
}

export type Material = {
    id: string
    lesson_id: string
    title: string
    file_path: string
    file_type: string | null
    created_at: string
}

export type SessionRecording = {
  id: string
  lesson_id: string
  title: string
  url: string
  position: number
  created_at: string
}

export type LessonProgress = {
    id: string
    student_id: string
    lesson_id: string
    completed: boolean
    completed_at: string | null
}

export type CrmContact = {
    id: string
    name: string
    email: string | null
    phone: string | null
    source: string | null
    stage: CrmStage
    notes: string | null
    meeting_date: string | null
    meeting_time: string | null
    value: number | null
    payment_method: PaymentMethod | null
    payment_term: string | null
    installments_count: number | null
    student_id: string | null
    owner_id: string | null
    created_at: string
    updated_at: string
}

export type CrmTask = {
    id: string
    contact_id: string
    title: string
    due_date: string | null
    status: CrmTaskStatus
    assigned_to: string | null
    created_at: string
}

export type Payment = {
    id: string
    student_id: string
    amount: number
    paid_at: string
    notes: string | null
    created_at: string
}

type Table<Row> = { Row: Row; Insert: Partial<Row>; Update: Partial<Row>; Relationships: [] }

export type Database = {
    public: {
          Tables: {
                  profiles: Table<Profile>
                  modules: Table<Module>
                  lessons: Table<Lesson>
                  materials: Table<Material>
                  session_recordings: Table<SessionRecording>
                  lesson_progress: Table<LessonProgress>
                  crm_contacts: Table<CrmContact>
                  crm_tasks: Table<CrmTask>
                  payments: Table<Payment>
          }
          Views: Record<string, never>
          Functions: Record<string, never>
          Enums: Record<string, never>
          CompositeTypes: Record<string, never>
    }
}
