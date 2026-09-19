export type UserRole = 'admin' | 'mentor' | 'student'

// Admin and mentor have the exact same access level in the app.
export function isStaff(role: UserRole | null | undefined): boolean {
    return role === 'admin' || role === 'mentor'
}
export type CrmStage = 'lead' | 'contacted' | 'proposal' | 'won' | 'lost'
export type CrmTaskStatus = 'pending' | 'done'

export type PaymentMethod = 'pronto' | 'prestacoes'
export type PaymentChannel = 'transferencia' | 'stripe' | 'debito_direto'
export type BusinessType = 'independente' | 'empresa' | 'ainda_nao_comecei'
export type ModuleCategory = 'modulo' | 'individual' | 'ao_vivo'
export type SessionType = 'boas_vindas' | 'convidado' | 'encerramento' | 'presencial'
export type GoalStatus = 'por_comecar' | 'em_andamento' | 'concluido'
export type DeliverableStatus = 'em_analise' | 'revisto'
export type OnboardingStatus =
  | 'convidado'
  | 'contrato_enviado'
  | 'entrada_paga'
  | 'debito_ativo'
  | 'ativo'

export type Profile = {
    id: string
    email: string
    full_name: string
    phone: string | null
    role: UserRole
    avatar_url: string | null
    start_date: string | null
    end_date: string | null
    cycle_notes: string | null
    main_goal: string | null
    mentoria_value: number | null
    down_payment: number | null
    payment_method: PaymentMethod | null
    payment_channel: PaymentChannel | null
    installments_count: number | null
    tax_id: string | null
    business_type: BusinessType | null
    business_area: string | null
    current_clients: string | null
    biggest_challenge: string | null
    onboarding_status: OnboardingStatus
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
    session_date: string | null
    session_type: SessionType | null
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

export type AppSetting = {
    key: string
    value: string | null
    updated_at: string
}

export type StudentGoal = {
    id: string
    student_id: string
    title: string
    status: GoalStatus
    due_date: string | null
    position: number
    created_at: string
}

export type StudentDeliverable = {
    id: string
    student_id: string
    title: string
    url: string
    status: DeliverableStatus
    created_at: string
}

export type StudentFeedback = {
    id: string
    student_id: string
    rating: number
    comment: string | null
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
                  app_settings: Table<AppSetting>
                  student_goals: Table<StudentGoal>
                  student_deliverables: Table<StudentDeliverable>
                  student_feedback: Table<StudentFeedback>
          }
          Views: Record<string, never>
          Functions: Record<string, never>
          Enums: Record<string, never>
          CompositeTypes: Record<string, never>
    }
}
