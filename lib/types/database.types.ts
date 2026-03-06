export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      branches: {
        Row: {
          id: string
          name: string
          location: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          location: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          location?: string
          created_at?: string
        }
      }
      members: {
        Row: {
          id: string
          full_name: string
          gender: 'Male' | 'Female'
          date_of_birth: string
          phone_number: string | null
          baptism_year: number | null
          home_address: string
          branch_id: string
          registration_source: 'admin' | 'self_registration'
          email: string | null
          is_verified: boolean
          verified_at: string | null
          created_at: string
          family_id: string | null
          family_role: 'head' | 'spouse' | 'child' | 'other' | null
          registered_by_member_id: string | null
        }
        Insert: {
          id?: string
          full_name: string
          gender: 'Male' | 'Female'
          date_of_birth: string
          phone_number?: string | null
          baptism_year?: number | null
          home_address: string
          branch_id: string
          registration_source?: 'admin' | 'self_registration'
          email?: string | null
          is_verified?: boolean
          verified_at?: string | null
          created_at?: string
          family_id?: string | null
          family_role?: 'head' | 'spouse' | 'child' | 'other' | null
          registered_by_member_id?: string | null
        }
        Update: {
          id?: string
          full_name?: string
          gender?: 'Male' | 'Female'
          date_of_birth?: string
          phone_number?: string | null
          baptism_year?: number | null
          home_address?: string
          branch_id?: string
          registration_source?: 'admin' | 'self_registration'
          email?: string | null
          is_verified?: boolean
          verified_at?: string | null
          created_at?: string
          family_id?: string | null
          family_role?: 'head' | 'spouse' | 'child' | 'other' | null
          registered_by_member_id?: string | null
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          branch_id: string
          event_date: string
          qr_token: string
          is_active: boolean
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          branch_id: string
          event_date: string
          qr_token: string
          is_active?: boolean
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          branch_id?: string
          event_date?: string
          qr_token?: string
          is_active?: boolean
          created_by?: string
          created_at?: string
        }
      }
      attendance: {
        Row: {
          id: string
          member_id: string
          event_id: string
          checked_in_at: string
        }
        Insert: {
          id?: string
          member_id: string
          event_id: string
          checked_in_at?: string
        }
        Update: {
          id?: string
          member_id?: string
          event_id?: string
          checked_in_at?: string
        }
      }
      admin_profiles: {
        Row: {
          id: string
          user_id: string
          role: 'super_admin' | 'branch_admin'
          branch_id: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: 'super_admin' | 'branch_admin'
          branch_id?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'super_admin' | 'branch_admin'
          branch_id?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_age: {
        Args: {
          dob: string
        }
        Returns: number
      }
    }
    Enums: {
      gender: 'Male' | 'Female'
      registration_source: 'admin' | 'self_registration'
      family_role: 'head' | 'spouse' | 'child' | 'other'
      admin_role: 'super_admin' | 'branch_admin'
    }
  }
}

// Convenience alias for family role
export type FamilyRole = 'head' | 'spouse' | 'child' | 'other'

// Helper types
export type Branch = Database['public']['Tables']['branches']['Row']
export type Member = Database['public']['Tables']['members']['Row']
export type Event = Database['public']['Tables']['events']['Row']
export type Attendance = Database['public']['Tables']['attendance']['Row']

export type InsertBranch = Database['public']['Tables']['branches']['Insert']
export type InsertMember = Database['public']['Tables']['members']['Insert']
export type InsertEvent = Database['public']['Tables']['events']['Insert']
export type InsertAttendance = Database['public']['Tables']['attendance']['Insert']

// Extended types with relations
export type MemberWithBranch = Member & {
  branches: Branch
}

export type EventWithBranch = Event & {
  branches: Branch
}

export type AttendanceWithDetails = Attendance & {
  members: MemberWithBranch
  events: Event
}

// Family member with check-in status (used in the check-in flow)
export type FamilyMemberCheckIn = Pick<Member, 'id' | 'full_name' | 'gender' | 'date_of_birth' | 'family_role'> & {
  already_checked_in: boolean
}

// Admin profile types
export type AdminRole = 'super_admin' | 'branch_admin'
export type AdminProfile = Database['public']['Tables']['admin_profiles']['Row']
export type InsertAdminProfile = Database['public']['Tables']['admin_profiles']['Insert']

// Admin profile joined with user email (returned by listAdminUsers)
export type AdminUser = AdminProfile & {
  email: string
  branch_name: string | null
}
