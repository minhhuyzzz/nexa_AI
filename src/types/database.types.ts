export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string
          admin_email: string | null
          admin_id: string | null
          created_at: string
          details: Json
          id: string
          ip_address: string | null
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          admin_email?: string | null
          admin_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          admin_email?: string | null
          admin_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_credit_reservations: {
        Row: {
          amount: number
          created_at: string
          id: string
          payer_id: string
          payer_type: string
          remaining_credits: number | null
          request_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          payer_id: string
          payer_type: string
          remaining_credits?: number | null
          request_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payer_id?: string
          payer_type?: string
          remaining_credits?: number | null
          request_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_evaluations: {
        Row: {
          completion_tokens: number | null
          confidence_flag: string
          confidence_score: number
          created_at: string
          criterion_scores: Json
          evidence_quote: string | null
          feedback: string
          id: string
          item_id: string
          max_score: number
          model_name: string
          override_feedback: string | null
          override_score: number | null
          prompt_tokens: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          strengths: string | null
          submission_id: string
          total_score: number
          weaknesses: string | null
        }
        Insert: {
          completion_tokens?: number | null
          confidence_flag: string
          confidence_score: number
          created_at?: string
          criterion_scores?: Json
          evidence_quote?: string | null
          feedback: string
          id?: string
          item_id: string
          max_score?: number
          model_name?: string
          override_feedback?: string | null
          override_score?: number | null
          prompt_tokens?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          strengths?: string | null
          submission_id: string
          total_score?: number
          weaknesses?: string | null
        }
        Update: {
          completion_tokens?: number | null
          confidence_flag?: string
          confidence_score?: number
          created_at?: string
          criterion_scores?: Json
          evidence_quote?: string | null
          feedback?: string
          id?: string
          item_id?: string
          max_score?: number
          model_name?: string
          override_feedback?: string | null
          override_score?: number | null
          prompt_tokens?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          strengths?: string | null
          submission_id?: string
          total_score?: number
          weaknesses?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_evaluations_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "assessment_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_evaluations_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_evaluations_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "assessment_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_events: {
        Row: {
          completion_tokens: number | null
          cost_estimated: number | null
          created_at: string
          error_message: string | null
          feature: string
          id: string
          latency_ms: number | null
          model: string
          organization_id: string | null
          prompt_tokens: number | null
          provider: string
          status: string
          total_tokens: number | null
          user_id: string | null
        }
        Insert: {
          completion_tokens?: number | null
          cost_estimated?: number | null
          created_at?: string
          error_message?: string | null
          feature: string
          id?: string
          latency_ms?: number | null
          model: string
          organization_id?: string | null
          prompt_tokens?: number | null
          provider: string
          status?: string
          total_tokens?: number | null
          user_id?: string | null
        }
        Update: {
          completion_tokens?: number | null
          cost_estimated?: number | null
          created_at?: string
          error_message?: string | null
          feature?: string
          id?: string
          latency_ms?: number | null
          model?: string
          organization_id?: string | null
          prompt_tokens?: number | null
          provider?: string
          status?: string
          total_tokens?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_campaigns: {
        Row: {
          assessment_id: string
          assessor_ids: Json
          class_ids: Json
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string
          id: string
          organization_id: string
          passing_score: number
          security_settings: Json | null
          starts_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assessment_id: string
          assessor_ids?: Json
          class_ids?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string
          id?: string
          organization_id: string
          passing_score?: number
          security_settings?: Json | null
          starts_at?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assessment_id?: string
          assessor_ids?: Json
          class_ids?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string
          id?: string
          organization_id?: string
          passing_score?: number
          security_settings?: Json | null
          starts_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_campaigns_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_frameworks: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_default: boolean
          status: string
          title: string
          updated_at: string
          version: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean
          status?: string
          title: string
          updated_at?: string
          version: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean
          status?: string
          title?: string
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_frameworks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_items: {
        Row: {
          assessment_id: string
          competency_id: string | null
          context: string | null
          created_at: string
          difficulty_level: string | null
          id: string
          is_multi_competency: boolean | null
          order_index: number
          points: number
          prompt: string
          question_bank_item_id: string | null
          rubric_guide: string | null
          submission_modes: Json | null
          target_competencies: Json | null
          type: string
        }
        Insert: {
          assessment_id: string
          competency_id?: string | null
          context?: string | null
          created_at?: string
          difficulty_level?: string | null
          id?: string
          is_multi_competency?: boolean | null
          order_index?: number
          points?: number
          prompt: string
          question_bank_item_id?: string | null
          rubric_guide?: string | null
          submission_modes?: Json | null
          target_competencies?: Json | null
          type?: string
        }
        Update: {
          assessment_id?: string
          competency_id?: string | null
          context?: string | null
          created_at?: string
          difficulty_level?: string | null
          id?: string
          is_multi_competency?: boolean | null
          order_index?: number
          points?: number
          prompt?: string
          question_bank_item_id?: string | null
          rubric_guide?: string | null
          submission_modes?: Json | null
          target_competencies?: Json | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_items_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_items_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "competencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_items_question_bank_item_id_fkey"
            columns: ["question_bank_item_id"]
            isOneToOne: false
            referencedRelation: "question_bank_items"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_submissions: {
        Row: {
          assessment_id: string
          campaign_id: string | null
          class_assignment_id: string | null
          evaluated_at: string | null
          evaluated_by: string | null
          evaluator_notes: string | null
          grading_status: string | null
          id: string
          integrity_flag: string | null
          is_passed: boolean | null
          max_score: number | null
          percentage: number | null
          points_awarded: number | null
          proctoring_summary: Json | null
          started_at: string
          status: string
          submitted_at: string | null
          time_spent_seconds: number | null
          total_score: number | null
          user_id: string
        }
        Insert: {
          assessment_id: string
          campaign_id?: string | null
          class_assignment_id?: string | null
          evaluated_at?: string | null
          evaluated_by?: string | null
          evaluator_notes?: string | null
          grading_status?: string | null
          id?: string
          integrity_flag?: string | null
          is_passed?: boolean | null
          max_score?: number | null
          percentage?: number | null
          points_awarded?: number | null
          proctoring_summary?: Json | null
          started_at?: string
          status?: string
          submitted_at?: string | null
          time_spent_seconds?: number | null
          total_score?: number | null
          user_id: string
        }
        Update: {
          assessment_id?: string
          campaign_id?: string | null
          class_assignment_id?: string | null
          evaluated_at?: string | null
          evaluated_by?: string | null
          evaluator_notes?: string | null
          grading_status?: string | null
          id?: string
          integrity_flag?: string | null
          is_passed?: boolean | null
          max_score?: number | null
          percentage?: number | null
          points_awarded?: number | null
          proctoring_summary?: Json | null
          started_at?: string
          status?: string
          submitted_at?: string | null
          time_spent_seconds?: number | null
          total_score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_submissions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_submissions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "assessment_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_submissions_class_assignment_id_fkey"
            columns: ["class_assignment_id"]
            isOneToOne: false
            referencedRelation: "class_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_submissions_evaluated_by_fkey"
            columns: ["evaluated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          access_tier: string | null
          created_at: string
          created_by: string | null
          description: string | null
          duration_minutes: number
          framework_id: string | null
          id: string
          is_published: boolean
          is_system_baseline: boolean
          is_vip: boolean | null
          organization_id: string | null
          owner_user_id: string | null
          passing_score: number
          point_reward: number
          security_settings: Json | null
          snapshot_data: Json | null
          system_code: string | null
          target_domain: string | null
          title: string
          updated_at: string
          version: string | null
          visibility: string | null
        }
        Insert: {
          access_tier?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number
          framework_id?: string | null
          id?: string
          is_published?: boolean
          is_system_baseline?: boolean
          is_vip?: boolean | null
          organization_id?: string | null
          owner_user_id?: string | null
          passing_score?: number
          point_reward?: number
          security_settings?: Json | null
          snapshot_data?: Json | null
          system_code?: string | null
          target_domain?: string | null
          title: string
          updated_at?: string
          version?: string | null
          visibility?: string | null
        }
        Update: {
          access_tier?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number
          framework_id?: string | null
          id?: string
          is_published?: boolean
          is_system_baseline?: boolean
          is_vip?: boolean | null
          organization_id?: string | null
          owner_user_id?: string | null
          passing_score?: number
          point_reward?: number
          security_settings?: Json | null
          snapshot_data?: Json | null
          system_code?: string | null
          target_domain?: string | null
          title?: string
          updated_at?: string
          version?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "assessment_frameworks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_inquiries: {
        Row: {
          contact_email: string
          contact_name: string
          contact_phone: string
          created_at: string
          expected_learners: number
          id: string
          notes: string | null
          org_name: string
          org_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          contact_email: string
          contact_name: string
          contact_phone: string
          created_at?: string
          expected_learners?: number
          id?: string
          notes?: string | null
          org_name: string
          org_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          contact_email?: string
          contact_name?: string
          contact_phone?: string
          created_at?: string
          expected_learners?: number
          id?: string
          notes?: string | null
          org_name?: string
          org_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_inquiries_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      class_assignments: {
        Row: {
          ai_grading_enabled: boolean | null
          allow_late_submission: boolean | null
          allowed_evidence_types: string[] | null
          assessment_id: string
          campaign_id: string | null
          class_id: string
          created_at: string
          deadline: string | null
          estimated_ai_credits: number | null
          id: string
          immediate_results: boolean | null
          max_evidence_mb: number | null
          reminder_before_hours: number | null
          require_evidence: boolean | null
          security_settings: Json | null
          shuffle_questions: boolean | null
          start_time: string | null
          status: string | null
          timezone: string | null
        }
        Insert: {
          ai_grading_enabled?: boolean | null
          allow_late_submission?: boolean | null
          allowed_evidence_types?: string[] | null
          assessment_id: string
          campaign_id?: string | null
          class_id: string
          created_at?: string
          deadline?: string | null
          estimated_ai_credits?: number | null
          id?: string
          immediate_results?: boolean | null
          max_evidence_mb?: number | null
          reminder_before_hours?: number | null
          require_evidence?: boolean | null
          security_settings?: Json | null
          shuffle_questions?: boolean | null
          start_time?: string | null
          status?: string | null
          timezone?: string | null
        }
        Update: {
          ai_grading_enabled?: boolean | null
          allow_late_submission?: boolean | null
          allowed_evidence_types?: string[] | null
          assessment_id?: string
          campaign_id?: string | null
          class_id?: string
          created_at?: string
          deadline?: string | null
          estimated_ai_credits?: number | null
          id?: string
          immediate_results?: boolean | null
          max_evidence_mb?: number | null
          reminder_before_hours?: number | null
          require_evidence?: boolean | null
          security_settings?: Json | null
          shuffle_questions?: boolean | null
          start_time?: string | null
          status?: string | null
          timezone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_assignments_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_assignments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "assessment_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "evaluator_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_files: {
        Row: {
          class_id: string
          created_at: string
          file_name: string
          file_size_bytes: number | null
          file_type: string
          file_url: string
          id: string
          uploader_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          file_name: string
          file_size_bytes?: number | null
          file_type?: string
          file_url: string
          id?: string
          uploader_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          file_name?: string
          file_size_bytes?: number | null
          file_type?: string
          file_url?: string
          id?: string
          uploader_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_files_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "evaluator_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_class_files_profiles"
            columns: ["uploader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      class_members: {
        Row: {
          class_id: string
          id: string
          joined_at: string
          role_in_class: string | null
          student_code: string | null
          sub_group: string | null
          user_id: string
        }
        Insert: {
          class_id: string
          id?: string
          joined_at?: string
          role_in_class?: string | null
          student_code?: string | null
          sub_group?: string | null
          user_id: string
        }
        Update: {
          class_id?: string
          id?: string
          joined_at?: string
          role_in_class?: string | null
          student_code?: string | null
          sub_group?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_members_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "evaluator_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_class_members_profiles"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      class_messages: {
        Row: {
          class_id: string
          content: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          class_id: string
          content: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          class_id?: string
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_messages_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "evaluator_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_class_messages_profiles"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      class_post_replies: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_post_replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "class_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_class_post_replies_profiles"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      class_posts: {
        Row: {
          author_id: string
          class_id: string
          content: string
          created_at: string
          id: string
          is_pinned: boolean | null
          linked_assignment_id: string | null
          linked_file_id: string | null
          post_type: string
          title: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          class_id: string
          content: string
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          linked_assignment_id?: string | null
          linked_file_id?: string | null
          post_type?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          class_id?: string
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          linked_assignment_id?: string | null
          linked_file_id?: string | null
          post_type?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_posts_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "evaluator_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_posts_linked_assignment_id_fkey"
            columns: ["linked_assignment_id"]
            isOneToOne: false
            referencedRelation: "class_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_class_posts_profiles"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_post_linked_file"
            columns: ["linked_file_id"]
            isOneToOne: false
            referencedRelation: "class_files"
            referencedColumns: ["id"]
          },
        ]
      }
      community_contributions: {
        Row: {
          admin_feedback: string | null
          attached_files: Json | null
          code: string
          created_at: string
          difficulty: string
          domain: string
          id: string
          points_rewarded: number | null
          prompt: string
          question_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          solution_notes: string | null
          status: string
          title: string
          user_id: string
        }
        Insert: {
          admin_feedback?: string | null
          attached_files?: Json | null
          code: string
          created_at?: string
          difficulty?: string
          domain: string
          id?: string
          points_rewarded?: number | null
          prompt: string
          question_type: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          solution_notes?: string | null
          status?: string
          title: string
          user_id: string
        }
        Update: {
          admin_feedback?: string | null
          attached_files?: Json | null
          code?: string
          created_at?: string
          difficulty?: string
          domain?: string
          id?: string
          points_rewarded?: number | null
          prompt?: string
          question_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          solution_notes?: string | null
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_contributions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_contributions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      competencies: {
        Row: {
          behavioral_indicators: Json
          created_at: string
          description: string
          display_order: number
          domain_id: string
          id: string
          skill_code: string
          target_level: number
          title: string
        }
        Insert: {
          behavioral_indicators?: Json
          created_at?: string
          description: string
          display_order?: number
          domain_id: string
          id?: string
          skill_code: string
          target_level?: number
          title: string
        }
        Update: {
          behavioral_indicators?: Json
          created_at?: string
          description?: string
          display_order?: number
          domain_id?: string
          id?: string
          skill_code?: string
          target_level?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "competencies_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "competency_domains"
            referencedColumns: ["id"]
          },
        ]
      }
      competency_analyses: {
        Row: {
          created_at: string
          id: string
          learning_pathway: Json
          model_name: string
          overall_level: string
          pedagogical_feedback: string
          radar_data: Json
          skill_gaps: Json
          strengths: string | null
          submission_id: string
          user_id: string
          weaknesses: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          learning_pathway?: Json
          model_name?: string
          overall_level?: string
          pedagogical_feedback: string
          radar_data?: Json
          skill_gaps?: Json
          strengths?: string | null
          submission_id: string
          user_id: string
          weaknesses?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          learning_pathway?: Json
          model_name?: string
          overall_level?: string
          pedagogical_feedback?: string
          radar_data?: Json
          skill_gaps?: Json
          strengths?: string | null
          submission_id?: string
          user_id?: string
          weaknesses?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competency_analyses_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "assessment_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      competency_domains: {
        Row: {
          code: string
          created_at: string
          description: string
          domain_index: number
          framework_id: string
          id: string
          title: string
          weight_percent: number
        }
        Insert: {
          code: string
          created_at?: string
          description: string
          domain_index: number
          framework_id: string
          id?: string
          title: string
          weight_percent?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          domain_index?: number
          framework_id?: string
          id?: string
          title?: string
          weight_percent?: number
        }
        Relationships: [
          {
            foreignKeyName: "competency_domains_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "assessment_frameworks"
            referencedColumns: ["id"]
          },
        ]
      }
      competency_evidence: {
        Row: {
          competency_id: string
          created_at: string
          evidence_text: string | null
          evidence_url: string | null
          id: string
          score: number
          source_id: string | null
          source_type: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
          weight: number
        }
        Insert: {
          competency_id: string
          created_at?: string
          evidence_text?: string | null
          evidence_url?: string | null
          id?: string
          score: number
          source_id?: string | null
          source_type: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
          weight?: number
        }
        Update: {
          competency_id?: string
          created_at?: string
          evidence_text?: string | null
          evidence_url?: string | null
          id?: string
          score?: number
          source_id?: string | null
          source_type?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "competency_evidence_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "competencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competency_evidence_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competency_evidence_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_logs: {
        Row: {
          consent_version: string
          created_at: string
          id: string
          ip_address: string | null
          is_granted: boolean
          user_agent: string | null
          user_id: string
        }
        Insert: {
          consent_version: string
          created_at?: string
          id?: string
          ip_address?: string | null
          is_granted?: boolean
          user_agent?: string | null
          user_id: string
        }
        Update: {
          consent_version?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          is_granted?: boolean
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consent_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_catalog: {
        Row: {
          created_at: string | null
          domain_codes: string[]
          duration: string | null
          format: string | null
          id: string
          language: string | null
          last_verified_at: string | null
          learning_outcomes: string[] | null
          level: string | null
          official_url: string
          price_type: string | null
          provider: string
          review_status: string | null
          short_description: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          domain_codes: string[]
          duration?: string | null
          format?: string | null
          id: string
          language?: string | null
          last_verified_at?: string | null
          learning_outcomes?: string[] | null
          level?: string | null
          official_url: string
          price_type?: string | null
          provider: string
          review_status?: string | null
          short_description?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          domain_codes?: string[]
          duration?: string | null
          format?: string | null
          id?: string
          language?: string | null
          last_verified_at?: string | null
          learning_outcomes?: string[] | null
          level?: string | null
          official_url?: string
          price_type?: string | null
          provider?: string
          review_status?: string | null
          short_description?: string | null
          title?: string
        }
        Relationships: []
      }
      credentials: {
        Row: {
          assessment_id: string | null
          assessment_title: string
          candidate_name: string
          competency_level: string
          content_sha256: string
          credential_code: string
          id: string
          is_revoked: boolean
          issued_at: string
          max_score: number
          pdf_sha256: string | null
          pdf_url: string | null
          qr_data: string | null
          revoked_reason: string | null
          score_percentage: number
          submission_id: string | null
          total_score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          assessment_id?: string | null
          assessment_title: string
          candidate_name: string
          competency_level?: string
          content_sha256: string
          credential_code: string
          id?: string
          is_revoked?: boolean
          issued_at?: string
          max_score?: number
          pdf_sha256?: string | null
          pdf_url?: string | null
          qr_data?: string | null
          revoked_reason?: string | null
          score_percentage: number
          submission_id?: string | null
          total_score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          assessment_id?: string | null
          assessment_title?: string
          candidate_name?: string
          competency_level?: string
          content_sha256?: string
          credential_code?: string
          id?: string
          is_revoked?: boolean
          issued_at?: string
          max_score?: number
          pdf_sha256?: string | null
          pdf_url?: string | null
          qr_data?: string | null
          revoked_reason?: string | null
          score_percentage?: number
          submission_id?: string | null
          total_score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credentials_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credentials_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: true
            referencedRelation: "assessment_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluator_classes: {
        Row: {
          class_code: string
          created_at: string
          description: string | null
          evaluator_id: string
          group_type: string | null
          id: string
          instructor_id: string | null
          instructor_name: string | null
          max_capacity: number | null
          name: string
          organization_id: string | null
          owner_user_id: string | null
          security_settings: Json | null
          settings: Json | null
          status: string | null
          term: string | null
          visibility: string | null
        }
        Insert: {
          class_code: string
          created_at?: string
          description?: string | null
          evaluator_id: string
          group_type?: string | null
          id?: string
          instructor_id?: string | null
          instructor_name?: string | null
          max_capacity?: number | null
          name: string
          organization_id?: string | null
          owner_user_id?: string | null
          security_settings?: Json | null
          settings?: Json | null
          status?: string | null
          term?: string | null
          visibility?: string | null
        }
        Update: {
          class_code?: string
          created_at?: string
          description?: string | null
          evaluator_id?: string
          group_type?: string | null
          id?: string
          instructor_id?: string | null
          instructor_name?: string | null
          max_capacity?: number | null
          name?: string
          organization_id?: string | null
          owner_user_id?: string | null
          security_settings?: Json | null
          settings?: Json | null
          status?: string | null
          term?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluator_classes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluator_classes_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluator_profiles: {
        Row: {
          certificate_url: string | null
          created_at: string
          id: string
          is_verified_badge: boolean
          organization_name: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          certificate_url?: string | null
          created_at?: string
          id?: string
          is_verified_badge?: boolean
          organization_name?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          certificate_url?: string | null
          created_at?: string
          id?: string
          is_verified_badge?: boolean
          organization_name?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluator_profiles_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluator_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_rooms: {
        Row: {
          access_policy: string
          allow_late_join: boolean
          assessment_id: string
          auto_submit_on_timeout: boolean
          class_id: string | null
          created_at: string
          created_by: string
          ended_at: string | null
          id: string
          is_active: boolean
          is_locked: boolean
          max_participants: number
          organization_id: string | null
          owner_user_id: string | null
          proctoring_profile: string
          results_publish_settings: Json
          results_published: boolean
          room_code: string
          room_description: string | null
          room_mode: string
          scheduled_end: string | null
          scheduled_start: string | null
          show_pin: boolean
          started_at: string | null
          status: string
          system_notifications_enabled: boolean
          theme_id: string
          title: string
          visibility: string | null
        }
        Insert: {
          access_policy?: string
          allow_late_join?: boolean
          assessment_id: string
          auto_submit_on_timeout?: boolean
          class_id?: string | null
          created_at?: string
          created_by: string
          ended_at?: string | null
          id?: string
          is_active?: boolean
          is_locked?: boolean
          max_participants?: number
          organization_id?: string | null
          owner_user_id?: string | null
          proctoring_profile?: string
          results_publish_settings?: Json
          results_published?: boolean
          room_code: string
          room_description?: string | null
          room_mode?: string
          scheduled_end?: string | null
          scheduled_start?: string | null
          show_pin?: boolean
          started_at?: string | null
          status?: string
          system_notifications_enabled?: boolean
          theme_id?: string
          title: string
          visibility?: string | null
        }
        Update: {
          access_policy?: string
          allow_late_join?: boolean
          assessment_id?: string
          auto_submit_on_timeout?: boolean
          class_id?: string | null
          created_at?: string
          created_by?: string
          ended_at?: string | null
          id?: string
          is_active?: boolean
          is_locked?: boolean
          max_participants?: number
          organization_id?: string | null
          owner_user_id?: string | null
          proctoring_profile?: string
          results_publish_settings?: Json
          results_published?: boolean
          room_code?: string
          room_description?: string | null
          room_mode?: string
          scheduled_end?: string | null
          scheduled_start?: string | null
          show_pin?: boolean
          started_at?: string | null
          status?: string
          system_notifications_enabled?: boolean
          theme_id?: string
          title?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_rooms_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_rooms_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "evaluator_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_rooms_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_rooms_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_tickets: {
        Row: {
          admin_notes: string | null
          category: string | null
          content: string
          created_at: string
          id: string
          organization_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
          subject: string
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          admin_notes?: string | null
          category?: string | null
          content: string
          created_at?: string
          id?: string
          organization_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          subject: string
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          admin_notes?: string | null
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          organization_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          subject?: string
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_tickets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_tickets_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      item_options: {
        Row: {
          content: string
          explanation: string | null
          id: string
          is_correct: boolean
          item_id: string
          order_index: number
        }
        Insert: {
          content: string
          explanation?: string | null
          id?: string
          is_correct?: boolean
          item_id: string
          order_index?: number
        }
        Update: {
          content?: string
          explanation?: string | null
          id?: string
          is_correct?: boolean
          item_id?: string
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "item_options_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "assessment_items"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_competency_snapshots: {
        Row: {
          created_at: string
          domain_scores: Json
          id: string
          overall_score: number
          skill_scores: Json
          snapshot_trigger: string
          user_id: string
        }
        Insert: {
          created_at?: string
          domain_scores?: Json
          id?: string
          overall_score: number
          skill_scores?: Json
          snapshot_trigger: string
          user_id: string
        }
        Update: {
          created_at?: string
          domain_scores?: Json
          id?: string
          overall_score?: number
          skill_scores?: Json
          snapshot_trigger?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learner_competency_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_modules: {
        Row: {
          access_tier: string
          assessment_id: string | null
          competency_id: string | null
          content_markdown: string | null
          created_at: string
          description: string | null
          domain_code: string
          duration_minutes: number
          id: string
          is_published: boolean
          order_index: number
          path_id: string | null
          point_reward: number
          prerequisite_module_id: string | null
          skill_code: string
          title: string
          updated_at: string
        }
        Insert: {
          access_tier?: string
          assessment_id?: string | null
          competency_id?: string | null
          content_markdown?: string | null
          created_at?: string
          description?: string | null
          domain_code: string
          duration_minutes?: number
          id?: string
          is_published?: boolean
          order_index?: number
          path_id?: string | null
          point_reward?: number
          prerequisite_module_id?: string | null
          skill_code: string
          title: string
          updated_at?: string
        }
        Update: {
          access_tier?: string
          assessment_id?: string | null
          competency_id?: string | null
          content_markdown?: string | null
          created_at?: string
          description?: string | null
          domain_code?: string
          duration_minutes?: number
          id?: string
          is_published?: boolean
          order_index?: number
          path_id?: string | null
          point_reward?: number
          prerequisite_module_id?: string | null
          skill_code?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_modules_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_modules_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "competencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_modules_path_id_fkey"
            columns: ["path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_modules_prerequisite_module_id_fkey"
            columns: ["prerequisite_module_id"]
            isOneToOne: false
            referencedRelation: "learning_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_paths: {
        Row: {
          access_tier: string
          created_at: string
          description: string | null
          domain_codes: string[] | null
          id: string
          is_published: boolean
          order_index: number
          point_reward: number
          slug: string | null
          title: string
          updated_at: string
        }
        Insert: {
          access_tier?: string
          created_at?: string
          description?: string | null
          domain_codes?: string[] | null
          id?: string
          is_published?: boolean
          order_index?: number
          point_reward?: number
          slug?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          access_tier?: string
          created_at?: string
          description?: string | null
          domain_codes?: string[] | null
          id?: string
          is_published?: boolean
          order_index?: number
          point_reward?: number
          slug?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      org_audit_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_role: string | null
          created_at: string
          details: Json | null
          id: string
          organization_id: string
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          organization_id: string
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          organization_id?: string
          target_id?: string | null
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_entitlements: {
        Row: {
          ai_credits_granted: number
          ai_credits_used: number
          contract_number: string | null
          created_at: string
          expires_at: string
          id: string
          is_active: boolean
          max_assessments: number
          max_seats: number
          organization_id: string
          starts_at: string
        }
        Insert: {
          ai_credits_granted?: number
          ai_credits_used?: number
          contract_number?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          max_assessments?: number
          max_seats?: number
          organization_id: string
          starts_at?: string
        }
        Update: {
          ai_credits_granted?: number
          ai_credits_used?: number
          contract_number?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          max_assessments?: number
          max_seats?: number
          organization_id?: string
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_entitlements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          org_role: string
          organization_id: string
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          org_role?: string
          organization_id: string
          status?: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          org_role?: string
          organization_id?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_join_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          is_revoked: boolean
          max_uses: number
          organization_id: string
          title: string | null
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          is_revoked?: boolean
          max_uses?: number
          organization_id: string
          title?: string | null
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          is_revoked?: boolean
          max_uses?: number
          organization_id?: string
          title?: string | null
          used_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "organization_join_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_join_codes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_membership_requests: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          join_code_id: string | null
          organization_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          student_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          join_code_id?: string | null
          organization_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          student_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          join_code_id?: string | null
          organization_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          student_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_membership_requests_join_code_id_fkey"
            columns: ["join_code_id"]
            isOneToOne: false
            referencedRelation: "organization_join_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_membership_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_membership_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_membership_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_policies: {
        Row: {
          allow_code_join: boolean | null
          allowed_domains: string[] | null
          anti_cheat_enabled: boolean | null
          auto_publish_results: boolean | null
          fullscreen_enforced: boolean | null
          organization_id: string
          passing_score: number | null
          require_approval_for_join: boolean | null
          show_detailed_breakdown: boolean | null
          tab_switch_limit: number | null
          time_limit_minutes: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          allow_code_join?: boolean | null
          allowed_domains?: string[] | null
          anti_cheat_enabled?: boolean | null
          auto_publish_results?: boolean | null
          fullscreen_enforced?: boolean | null
          organization_id: string
          passing_score?: number | null
          require_approval_for_join?: boolean | null
          show_detailed_breakdown?: boolean | null
          tab_switch_limit?: number | null
          time_limit_minutes?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          allow_code_join?: boolean | null
          allowed_domains?: string[] | null
          anti_cheat_enabled?: boolean | null
          auto_publish_results?: boolean | null
          fullscreen_enforced?: boolean | null
          organization_id?: string
          passing_score?: number | null
          require_approval_for_join?: boolean | null
          show_detailed_breakdown?: boolean | null
          tab_switch_limit?: number | null
          time_limit_minutes?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_policies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_policies_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          banner_url: string | null
          code: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          expected_learners: number | null
          id: string
          is_active: boolean
          logo_url: string | null
          max_members: number
          name: string
          notes: string | null
          plan_tier: string | null
          quota_assessments: number
          slug: string
          status: string | null
          type: string
        }
        Insert: {
          banner_url?: string | null
          code?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          expected_learners?: number | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          max_members?: number
          name: string
          notes?: string | null
          plan_tier?: string | null
          quota_assessments?: number
          slug: string
          status?: string | null
          type?: string
        }
        Update: {
          banner_url?: string | null
          code?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          expected_learners?: number | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          max_members?: number
          name?: string
          notes?: string | null
          plan_tier?: string | null
          quota_assessments?: number
          slug?: string
          status?: string | null
          type?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          idempotency_key: string
          organization_id: string | null
          plan_code: string
          plan_id: string | null
          provider: string
          raw_payload: Json | null
          status: string
          transaction_reference: string
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          idempotency_key: string
          organization_id?: string | null
          plan_code: string
          plan_id?: string | null
          provider?: string
          raw_payload?: Json | null
          status?: string
          transaction_reference: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          idempotency_key?: string
          organization_id?: string | null
          plan_code?: string
          plan_id?: string | null
          provider?: string
          raw_payload?: Json | null
          status?: string
          transaction_reference?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "service_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "platform_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      point_ledger: {
        Row: {
          created_at: string
          delta: number
          event_type: string
          id: string
          idempotency_key: string
          metadata: Json | null
          policy_version: string
          source_id: string | null
          source_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delta: number
          event_type: string
          id?: string
          idempotency_key: string
          metadata?: Json | null
          policy_version?: string
          source_id?: string | null
          source_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          delta?: number
          event_type?: string
          id?: string
          idempotency_key?: string
          metadata?: Json | null
          policy_version?: string
          source_id?: string | null
          source_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "point_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      proctoring_events: {
        Row: {
          created_at: string
          details: Json | null
          event_type: string
          id: string
          room_id: string | null
          severity: string
          submission_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          room_id?: string | null
          severity?: string
          submission_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          room_id?: string | null
          severity?: string
          submission_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proctoring_events_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "exam_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proctoring_events_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "assessment_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proctoring_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          admin_role: string | null
          avatar_url: string | null
          avg_competency_score: number
          created_at: string
          credits: number
          email: string
          full_name: string
          id: string
          is_onboarded: boolean
          is_suspended: boolean
          last_login_date: string | null
          login_streak: number
          nickname: string
          plan_tier: string
          points: number
          rank_tier: string
          role: string
          specialization: string | null
          suspended_at: string | null
          suspended_reason: string | null
          tokens_revoked_at: string | null
          total_login_days: number
          updated_at: string
        }
        Insert: {
          admin_role?: string | null
          avatar_url?: string | null
          avg_competency_score?: number
          created_at?: string
          credits?: number
          email: string
          full_name: string
          id: string
          is_onboarded?: boolean
          is_suspended?: boolean
          last_login_date?: string | null
          login_streak?: number
          nickname: string
          plan_tier?: string
          points?: number
          rank_tier?: string
          role: string
          specialization?: string | null
          suspended_at?: string | null
          suspended_reason?: string | null
          tokens_revoked_at?: string | null
          total_login_days?: number
          updated_at?: string
        }
        Update: {
          admin_role?: string | null
          avatar_url?: string | null
          avg_competency_score?: number
          created_at?: string
          credits?: number
          email?: string
          full_name?: string
          id?: string
          is_onboarded?: boolean
          is_suspended?: boolean
          last_login_date?: string | null
          login_streak?: number
          nickname?: string
          plan_tier?: string
          points?: number
          rank_tier?: string
          role?: string
          specialization?: string | null
          suspended_at?: string | null
          suspended_reason?: string | null
          tokens_revoked_at?: string | null
          total_login_days?: number
          updated_at?: string
        }
        Relationships: []
      }
      question_bank_items: {
        Row: {
          code: string | null
          competency_id: string | null
          created_at: string
          created_by: string | null
          default_points: number
          difficulty_level: string
          id: string
          owner_user_id: string | null
          prompt: string
          rubric_definition: Json | null
          rubric_id: string | null
          scope: string | null
          status: string
          type: string
          updated_at: string
          version: number
        }
        Insert: {
          code?: string | null
          competency_id?: string | null
          created_at?: string
          created_by?: string | null
          default_points?: number
          difficulty_level?: string
          id?: string
          owner_user_id?: string | null
          prompt: string
          rubric_definition?: Json | null
          rubric_id?: string | null
          scope?: string | null
          status?: string
          type: string
          updated_at?: string
          version?: number
        }
        Update: {
          code?: string | null
          competency_id?: string | null
          created_at?: string
          created_by?: string | null
          default_points?: number
          difficulty_level?: string
          id?: string
          owner_user_id?: string | null
          prompt?: string
          rubric_definition?: Json | null
          rubric_id?: string | null
          scope?: string | null
          status?: string
          type?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "question_bank_items_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "competencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_bank_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_bank_items_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_bank_items_rubric_id_fkey"
            columns: ["rubric_id"]
            isOneToOne: false
            referencedRelation: "rubrics"
            referencedColumns: ["id"]
          },
        ]
      }
      question_bank_options: {
        Row: {
          content: string
          created_at: string
          explanation: string | null
          id: string
          is_correct: boolean
          item_id: string
          order_index: number
        }
        Insert: {
          content: string
          created_at?: string
          explanation?: string | null
          id?: string
          is_correct?: boolean
          item_id: string
          order_index?: number
        }
        Update: {
          content?: string
          created_at?: string
          explanation?: string | null
          id?: string
          is_correct?: boolean
          item_id?: string
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "question_bank_options_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "question_bank_items"
            referencedColumns: ["id"]
          },
        ]
      }
      renewal_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          notes: string | null
          organization_id: string
          period_months: number
          requested_by: string | null
          requested_credits: number | null
          requested_seats: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          organization_id: string
          period_months?: number
          requested_by?: string | null
          requested_credits?: number | null
          requested_seats?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string
          period_months?: number
          requested_by?: string | null
          requested_credits?: number | null
          requested_seats?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "renewal_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renewal_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renewal_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      room_announcements: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          room_id: string
          target_audience: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          id?: string
          room_id: string
          target_audience?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          room_id?: string
          target_audience?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_announcements_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "exam_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_participants: {
        Row: {
          answers_count: number
          connection_status: string
          id: string
          is_ready: boolean
          joined_at: string
          last_heartbeat_at: string | null
          ready_at: string | null
          room_id: string
          score: number | null
          status: string
          submission_id: string | null
          submitted_at: string | null
          total_questions: number
          user_id: string
        }
        Insert: {
          answers_count?: number
          connection_status?: string
          id?: string
          is_ready?: boolean
          joined_at?: string
          last_heartbeat_at?: string | null
          ready_at?: string | null
          room_id: string
          score?: number | null
          status?: string
          submission_id?: string | null
          submitted_at?: string | null
          total_questions?: number
          user_id: string
        }
        Update: {
          answers_count?: number
          connection_status?: string
          id?: string
          is_ready?: boolean
          joined_at?: string
          last_heartbeat_at?: string | null
          ready_at?: string | null
          room_id?: string
          score?: number | null
          status?: string
          submission_id?: string | null
          submitted_at?: string | null
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "exam_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_participants_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "assessment_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      rubric_criteria: {
        Row: {
          id: string
          max_points: number
          name: string
          order_index: number
          rubric_id: string
          weight_percent: number
        }
        Insert: {
          id?: string
          max_points?: number
          name: string
          order_index?: number
          rubric_id: string
          weight_percent?: number
        }
        Update: {
          id?: string
          max_points?: number
          name?: string
          order_index?: number
          rubric_id?: string
          weight_percent?: number
        }
        Relationships: [
          {
            foreignKeyName: "rubric_criteria_rubric_id_fkey"
            columns: ["rubric_id"]
            isOneToOne: false
            referencedRelation: "rubrics"
            referencedColumns: ["id"]
          },
        ]
      }
      rubric_levels: {
        Row: {
          criterion_id: string
          description: string
          id: string
          level_name: string
          score_percent: number
        }
        Insert: {
          criterion_id: string
          description: string
          id?: string
          level_name: string
          score_percent: number
        }
        Update: {
          criterion_id?: string
          description?: string
          id?: string
          level_name?: string
          score_percent?: number
        }
        Relationships: [
          {
            foreignKeyName: "rubric_levels_criterion_id_fkey"
            columns: ["criterion_id"]
            isOneToOne: false
            referencedRelation: "rubric_criteria"
            referencedColumns: ["id"]
          },
        ]
      }
      rubrics: {
        Row: {
          created_at: string
          description: string | null
          id: string
          item_id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          item_id: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          item_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "rubrics_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "assessment_items"
            referencedColumns: ["id"]
          },
        ]
      }
      service_plans: {
        Row: {
          billing_cycle: string
          code: string
          created_at: string
          credits_included: number
          description: string | null
          features: Json
          id: string
          is_active: boolean
          max_members: number
          name: string
          price_vnd: number
          role_target: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          billing_cycle?: string
          code: string
          created_at?: string
          credits_included?: number
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          max_members?: number
          name: string
          price_vnd?: number
          role_target?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          billing_cycle?: string
          code?: string
          created_at?: string
          credits_included?: number
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          max_members?: number
          name?: string
          price_vnd?: number
          role_target?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      submission_answers: {
        Row: {
          auto_graded: boolean
          created_at: string
          evidence_url: string | null
          file_url: string | null
          id: string
          is_correct: boolean | null
          item_id: string
          live_url: string | null
          score_awarded: number | null
          selected_option_id: string | null
          submission_id: string
          text_response: string | null
        }
        Insert: {
          auto_graded?: boolean
          created_at?: string
          evidence_url?: string | null
          file_url?: string | null
          id?: string
          is_correct?: boolean | null
          item_id: string
          live_url?: string | null
          score_awarded?: number | null
          selected_option_id?: string | null
          submission_id: string
          text_response?: string | null
        }
        Update: {
          auto_graded?: boolean
          created_at?: string
          evidence_url?: string | null
          file_url?: string | null
          id?: string
          is_correct?: boolean | null
          item_id?: string
          live_url?: string | null
          score_awarded?: number | null
          selected_option_id?: string | null
          submission_id?: string
          text_response?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submission_answers_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "assessment_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_answers_selected_option_id_fkey"
            columns: ["selected_option_id"]
            isOneToOne: false
            referencedRelation: "item_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_answers_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "assessment_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_course_progress: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string | null
          id: string
          is_self_reported: boolean | null
          started_at: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string | null
          id?: string
          is_self_reported?: boolean | null
          started_at?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string | null
          id?: string
          is_self_reported?: boolean | null
          started_at?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_course_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_course_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_learning_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean
          module_id: string
          points_awarded: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          module_id: string
          points_awarded?: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          module_id?: string
          points_awarded?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_learning_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "learning_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notifications: {
        Row: {
          category: string
          created_at: string
          id: string
          is_read: boolean
          link_url: string | null
          message: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          is_read?: boolean
          link_url?: string | null
          message: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_read?: boolean
          link_url?: string | null
          message?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_organizations: {
        Row: {
          created_at: string
          id: string
          org_role: string
          organization_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_role?: string
          organization_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_role?: string
          organization_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_organizations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_full_item_options: {
        Args: { p_item_id: string }
        Returns: boolean
      }
      deduct_ai_credits: {
        Args: { p_amount?: number; p_user_id: string }
        Returns: number
      }
      deduct_organization_ai_credits: {
        Args: { p_amount?: number; p_org_id: string }
        Returns: number
      }
      fulfill_payment_transaction: {
        Args: {
          p_provider_ref?: string
          p_raw_payload?: Json
          p_transaction_id: string
        }
        Returns: Json
      }
      get_assessment_answer_keys_for_submission: {
        Args: { p_assessment_id: string; p_submission_id: string }
        Returns: {
          correct_option_id: string
          item_id: string
          points: number
        }[]
      }
      get_assessment_for_candidate: {
        Args: { p_assessment_id: string }
        Returns: Json
      }
      get_user_managed_org_ids: {
        Args: { p_user_id: string }
        Returns: {
          organization_id: string
        }[]
      }
      grant_points_atomic: {
        Args: {
          p_delta: number
          p_event_type: string
          p_idempotency_key: string
          p_metadata?: Json
          p_source_id: string
          p_source_type: string
          p_user_id: string
        }
        Returns: Json
      }
      is_admin_or_service: { Args: never; Returns: boolean }
      is_class_evaluator: { Args: { p_class_id: string }; Returns: boolean }
      is_class_member: { Args: { p_class_id: string }; Returns: boolean }
      is_nickname_available: { Args: { p_nickname: string }; Returns: boolean }
      make_unique_nickname: {
        Args: { p_base: string; p_user_id: string }
        Returns: string
      }
      refund_ai_credits: {
        Args: { p_amount?: number; p_user_id: string }
        Returns: number
      }
      refund_organization_ai_credits: {
        Args: { p_amount?: number; p_org_id: string }
        Returns: number
      }
      register_new_user: {
        Args: {
          p_email: string
          p_full_name: string
          p_password: string
          p_role: string
          p_username: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
