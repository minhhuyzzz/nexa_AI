# Graph Report - nexa  (2026-10-31)

## Corpus Check
- Large corpus: 512 files · ~1,040,220 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 1555 nodes · 3566 edges · 86 communities (76 shown, 10 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 48 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Taste Skill & Visual Design Tools
- Taste Skill & Visual Design Tools
- AI Gateway & Adapters
- Admin Assessment Management
- Organization Workspace & Teams
- Organization Workspace & Teams
- Authentication & Onboarding
- Payment & Transactions
- Taste Skill & Visual Design Tools
- Organization Workspace & Teams
- Taste Skill & Visual Design Tools
- Authentication & Onboarding
- Personal Workspace & Learner
- Payment & Transactions
- AI Gateway & Adapters
- Organization Workspace & Teams
- Organization Workspace & Teams
- AI Gateway & Adapters
- .Github > Workflows > Ci.Yml
- General
- Organization Workspace & Teams
- Organization Workspace & Teams
- Taste Skill & Visual Design Tools
- Admin Assessment Management
- Personal Workspace & Learner
- Taste Skill & Visual Design Tools
- General
- Application API Endpoints
- Organization Workspace & Teams
- Taste Skill & Visual Design Tools
- Organization Workspace & Teams
- General
- Taste Skill & Visual Design Tools
- Application API Endpoints
- Organization Workspace & Teams
- Taste Skill & Visual Design Tools
- Taste Skill & Visual Design Tools
- Taste Skill & Visual Design Tools
- Src > Components > Dashboard
- Personal Workspace & Learner
- AI Gateway & Adapters
- Src > Features > Billing
- Organization Workspace & Teams
- Src > App > Live
- Taste Skill & Visual Design Tools
- Application API Endpoints
- Organization Workspace & Teams
- Admin API Services
- Application API Endpoints
- General
- General
- Database & Supabase Services
- Src > App > (Dashboard)
- Organization Workspace & Teams
- Personal Workspace & Learner
- Personal Workspace & Learner
- Src > App > Layout.Tsx
- Src > Features > Competency
- Taste Skill & Visual Design Tools
- Taste Skill & Visual Design Tools
- Taste Skill & Visual Design Tools
- Src > Lib > Utils.Ts
- Organization Workspace & Teams
- Authentication & Onboarding
- Personal Workspace & Learner
- Personal Workspace & Learner
- Src > App > Live
- Database & Supabase Services
- Database & Supabase Services
- Database & Supabase Services
- Src > Features > Assessments
- Taste Skill & Visual Design Tools
- Authentication & Onboarding
- Personal Workspace & Learner
- Src > App > (Dashboard)
- Organization Workspace & Teams
- Admin Assessment Management
- Application API Endpoints
- Src > App > (Dashboard)
- Application API Endpoints
- Application API Endpoints
- Src > App > Live
- Agent Tools & Skills

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 193 edges
2. `next` - 188 edges
3. `createAdminClient()` - 118 edges
4. `lucide-react` - 108 edges
5. `react` - 87 edges
6. `requirePlatformAdmin()` - 63 edges
7. `zod` - 51 edges
8. `createClient()` - 41 edges
9. `getEffectiveUser()` - 32 edges
10. `getOne()` - 31 edges

## Surprising Connections (you probably didn't know these)
- `OrgClassDetailPage()` --calls--> `createAdminClient()`  [EXTRACTED]
  src/app/(dashboard)/org/[slug]/classes/[classId]/page.tsx → src/lib/supabase/admin.ts
- `GET()` --calls--> `createClient()`  [EXTRACTED]
  src/app/api/ai/analyze-competency/route.ts → src/lib/supabase/server.ts
- `GET()` --calls--> `createClient()`  [EXTRACTED]
  src/app/api/assessments/route.ts → src/lib/supabase/server.ts
- `POST()` --calls--> `createClient()`  [EXTRACTED]
  src/app/api/auth/onboarding/route.ts → src/lib/supabase/server.ts
- `GET()` --calls--> `createClient()`  [EXTRACTED]
  src/app/api/courses/route.ts → src/lib/supabase/server.ts

## Import Cycles
- None detected.

## Communities (86 total, 10 thin omitted)

### Community 0 - "Taste Skill & Visual Design Tools"
Cohesion: 0.07
Nodes (85): AIC_FIELDS, AIC_HEADERS, applyThumb(), ARCHIVE_LICENCE, args, argv, base(), clock() (+77 more)

### Community 1 - "Taste Skill & Visual Design Tools"
Cohesion: 0.07
Nodes (85): AIC_FIELDS, AIC_HEADERS, applyThumb(), ARCHIVE_LICENCE, args, argv, base(), clock() (+77 more)

### Community 2 - "AI Gateway & Adapters"
Cohesion: 0.05
Nodes (48): @supabase/supabase-js@^2.49.1, @supabase/supabase-js, GET(), POST(), requestSchema, POST(), requestSchema, dynamic (+40 more)

### Community 3 - "Admin Assessment Management"
Cohesion: 0.06
Nodes (51): AdminAssessmentBankClient(), AssessmentItemRecord, Props, AdminAssessmentDetailClient(), AssessmentDetailData, AssessmentItemDetail, AssessmentItemOption, Props (+43 more)

### Community 4 - "Organization Workspace & Teams"
Cohesion: 0.07
Nodes (33): ForgotPasswordPage(), OnboardingPage(), loadInitialProfile(), AssessmentDetail, AssessmentDetailPage(), AssessmentRow, dynamic, EvaluatorAssessmentsPage() (+25 more)

### Community 5 - "Organization Workspace & Teams"
Cohesion: 0.07
Nodes (34): dynamic, GET(), GET(), POST(), registerSchema, GET(), evaluatorGradeSchema, POST() (+26 more)

### Community 6 - "Authentication & Onboarding"
Cohesion: 0.07
Nodes (36): AuthLayout(), FaqPage(), metadata, dynamic, FrameworkPage(), HomePage(), FeatureItem, FREQUENCY (+28 more)

### Community 7 - "Payment & Transactions"
Cohesion: 0.09
Nodes (26): @payos/node, loginSchema, POST(), createIntentSchema, POST(), POST(), GET(), paymentWebhookPayloadSchema (+18 more)

### Community 8 - "Taste Skill & Visual Design Tools"
Cohesion: 0.09
Nodes (39): adjustments(), argv, assetQueries(), ASSETS_PATH, briefStop(), briefWords(), deal(), dealHero() (+31 more)

### Community 9 - "Organization Workspace & Teams"
Cohesion: 0.09
Nodes (30): dynamic, GET(), POST(), submitJoinSchema, acceptSchema, GET(), POST(), GET() (+22 more)

### Community 10 - "Taste Skill & Visual Design Tools"
Cohesion: 0.10
Nodes (39): adjustments(), argv, assetQueries(), ASSETS_PATH, briefStop(), briefWords(), deal(), dealHero() (+31 more)

### Community 11 - "Authentication & Onboarding"
Cohesion: 0.11
Nodes (30): DELETE(), createFileSchema, GET(), POST(), GET(), POST(), sendMessageSchema, createReplySchema (+22 more)

### Community 12 - "Personal Workspace & Learner"
Cohesion: 0.08
Nodes (30): dynamic, GroupData, LearnerGroupDetailPage(), TabType, AssignmentItem, ClassAssignmentsTab(), ClassAssignmentsTabProps, defaultRubricCriteria (+22 more)

### Community 13 - "Payment & Transactions"
Cohesion: 0.10
Nodes (26): dynamic, escapeCsvCell(), GET(), dynamic, ImportItemRow, POST(), dynamic, GET() (+18 more)

### Community 14 - "AI Gateway & Adapters"
Cohesion: 0.07
Nodes (15): react, AiEventLog, AiGatewayStats, CompetencyDomainItem, CompetencyItem, FrameworkItem, ServicePlan, TransactionItem (+7 more)

### Community 15 - "Organization Workspace & Teams"
Cohesion: 0.09
Nodes (15): nextConfig, next, dynamic, OrgClassesPage(), AcceptInviteContent(), AcceptInvitePage(), BillingResultContent(), BillingResultPage() (+7 more)

### Community 16 - "Organization Workspace & Teams"
Cohesion: 0.08
Nodes (13): lucide-react, ComplianceTelemetry, ConsentLog, ProctoringEvent, BusinessInquiry, OrganizationItem, AIStatusResponse, ComplianceLog (+5 more)

### Community 17 - "AI Gateway & Adapters"
Cohesion: 0.11
Nodes (21): dynamic, GET(), POST(), updateAiConfigSchema, dynamic, POST(), DELETE(), dynamic (+13 more)

### Community 18 - ".Github > Workflows > Ci.Yml"
Cohesion: 0.08
Nodes (25): concurrency, cancel-in-progress, group, GEMINI_API_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_URL, jobs, quality-gate (+17 more)

### Community 19 - "General"
Cohesion: 0.11
Nodes (25): devDependencies, eslint@^9.39.5, eslint-config-next@^15.5.28, postcss@^8.5.3, tailwindcss@^4.0.9, @tailwindcss/postcss@^4.0.9, @types/node@^22.13.5, @types/qrcode@^1.5.6 (+17 more)

### Community 20 - "Organization Workspace & Teams"
Cohesion: 0.13
Nodes (17): PersonalLayout(), NotificationBell(), NotificationItem, OrgAvatarMenu(), fetchUser(), OrgTopbar(), OrgTopbarProps, creatorNavItems (+9 more)

### Community 21 - "Organization Workspace & Teams"
Cohesion: 0.14
Nodes (15): dynamic, GET(), dynamic, OrgAnalyticsPage(), CampaignComparisonChart(), Props, CohortLearningRecommendations(), DOMAIN_NAMES (+7 more)

### Community 22 - "Taste Skill & Visual Design Tools"
Cohesion: 0.10
Nodes (12): allow, args, asJson, fails, HEIGHT, merged, outDir, report (+4 more)

### Community 23 - "Admin Assessment Management"
Cohesion: 0.09
Nodes (17): zod, DELETE(), dynamic, PUT(), updateItemSchema, createAssessmentSchema, dynamic, GET() (+9 more)

### Community 24 - "Personal Workspace & Learner"
Cohesion: 0.12
Nodes (17): LeaderboardUser, LearnerDashboardPage(), loadLeaderboard(), loadStats(), RealAssessment, AIAnalysisData, AIStatusState, CompetencyProfileData (+9 more)

### Community 25 - "Taste Skill & Visual Design Tools"
Cohesion: 0.10
Nodes (12): allow, args, asJson, fails, HEIGHT, merged, outDir, report (+4 more)

### Community 26 - "General"
Cohesion: 0.10
Nodes (20): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+12 more)

### Community 27 - "Application API Endpoints"
Cohesion: 0.17
Nodes (10): generateSchema, POST(), GET(), dynamic, GET(), GET(), CertificateGeneratorService, CertificateInput (+2 more)

### Community 28 - "Organization Workspace & Teams"
Cohesion: 0.16
Nodes (8): GET(), POST(), POST(), dynamic, OrgAIQuotaPage(), dynamic, OrgOverviewPage(), QuotaEnforcementService

### Community 29 - "Taste Skill & Visual Design Tools"
Cohesion: 0.21
Nodes (4): Browser, findChrome(), Page, sleep()

### Community 30 - "Organization Workspace & Teams"
Cohesion: 0.18
Nodes (14): checkOrgManager(), createJoinCodeSchema, dynamic, GET(), PATCH(), POST(), revokeJoinCodeSchema, checkOrgManager() (+6 more)

### Community 31 - "General"
Cohesion: 0.12
Nodes (16): dependencies, class-variance-authority@^0.7.1, @google/genai@^2.30.0, lucide-react@^0.475.0, next@^15.2.1, @payos/node@^2.0.5, pdf-lib@^1.17.1, qrcode@^1.5.4 (+8 more)

### Community 32 - "Taste Skill & Visual Design Tools"
Cohesion: 0.25
Nodes (3): Browser, Page, sleep()

### Community 33 - "Application API Endpoints"
Cohesion: 0.18
Nodes (9): POST(), submitSchema, completeSchema, POST(), GrantPointsParams, GrantPointsResult, PointEventType, PointLedgerService (+1 more)

### Community 34 - "Organization Workspace & Teams"
Cohesion: 0.19
Nodes (11): JoinCodeItem, MemberItem, MembershipRequestItem, OrgMembersClientView(), Props, ROLE_DISPLAY, dynamic, OrgMembersPage() (+3 more)

### Community 35 - "Taste Skill & Visual Design Tools"
Cohesion: 0.17
Nodes (11): args, asJson, byId, EXT, files, findings, R, roots (+3 more)

### Community 36 - "Taste Skill & Visual Design Tools"
Cohesion: 0.17
Nodes (11): args, asJson, byId, EXT, files, findings, R, roots (+3 more)

### Community 37 - "Taste Skill & Visual Design Tools"
Cohesion: 0.29
Nodes (11): assert_contains(), assert_equal(), assert_not_contains(), assert_source_returns_to_caller(), run_test(), skill_test.sh script, test_help_returns_to_sourcing_caller(), test_help_uses_source_invocation() (+3 more)

### Community 38 - "Src > Components > Dashboard"
Cohesion: 0.24
Nodes (9): AdminLayout(), AdminAvatarMenu(), fetchUser(), adminNavSections, AdminSidebar(), NavSection, SubNavItem, adminRouteTitleMap (+1 more)

### Community 39 - "Personal Workspace & Learner"
Cohesion: 0.18
Nodes (11): AIEvaluationData, CandidateSubmission, CriterionLevel, CriterionScoreResult, EvaluatorGradingContent(), EvaluatorGradingPage(), GroupOption, RubricCriterion (+3 more)

### Community 40 - "AI Gateway & Adapters"
Cohesion: 0.27
Nodes (4): AIFlowConfig, AIGatewaySettings, CONFIG_FILE_PATH, CONFIG_FILE_PATH

### Community 41 - "Src > Features > Billing"
Cohesion: 0.24
Nodes (5): vitest, AICreditsCheckResult, OrgEntitlementSummary, PlanTier, QuotaCheckResult

### Community 42 - "Organization Workspace & Teams"
Cohesion: 0.28
Nodes (6): approveInquirySchema, dynamic, POST(), businessInquirySchema, dynamic, POST()

### Community 43 - "Src > App > Live"
Cohesion: 0.31
Nodes (7): LiveControlContent(), LiveControlPage(), Participant, RoomData, ProctoringEventItem, ProctoringTimeline(), ProctoringTimelineProps

### Community 45 - "Application API Endpoints"
Cohesion: 0.32
Nodes (6): @upstash/redis@^1.34.4, @upstash/redis, dynamic, GET(), LeaderboardEntry, getRedisClient()

### Community 46 - "Organization Workspace & Teams"
Cohesion: 0.36
Nodes (6): createOrgSchema, dynamic, GET(), PATCH(), patchOrgSchema, POST()

### Community 47 - "Admin API Services"
Cohesion: 0.25
Nodes (7): dynamic, GET(), OrgRelation, PATCH(), PatchBody, ProfileRow, UserOrgRelation

### Community 48 - "Application API Endpoints"
Cohesion: 0.39
Nodes (7): createClassSchema, DELETE(), GET(), getEffectiveEvaluatorId(), POST(), PUT(), updateClassSchema

### Community 49 - "General"
Cohesion: 0.29
Nodes (4): compat, __dirname, eslintConfig, __filename

### Community 50 - "General"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, start, test, typecheck

### Community 51 - "Database & Supabase Services"
Cohesion: 0.33
Nodes (5): executeSQL(), fs, https, main(), path

### Community 52 - "Src > App > (Dashboard)"
Cohesion: 0.29
Nodes (5): AdminAnalyticsPage(), AnalyticsData, AssessmentQuality, DomainStat, OrganizationOption

### Community 53 - "Organization Workspace & Teams"
Cohesion: 0.38
Nodes (5): OrgGradingClientView(), Props, SubmissionItem, dynamic, OrgGradingPage()

### Community 54 - "Personal Workspace & Learner"
Cohesion: 0.29
Nodes (5): AssessmentItem, domainList, dynamic, formatFilterOptions, tierFilterOptions

### Community 55 - "Personal Workspace & Learner"
Cohesion: 0.33
Nodes (5): AssessmentData, AssessmentTakeContent(), AssessmentTakePage(), Option, Question

### Community 56 - "Src > App > Layout.Tsx"
Cohesion: 0.29
Nodes (4): alexBrush, metadata, playfairDisplay, plusJakartaSans

### Community 57 - "Src > Features > Competency"
Cohesion: 0.33
Nodes (4): CompetencyAggregationService, DomainScore, LongitudinalRadarResult, SkillScore

### Community 58 - "Taste Skill & Visual Design Tools"
Cohesion: 0.60
Nodes (5): install_name(), owned_by_repo(), resolve_link(), install.sh script, wants()

### Community 59 - "Taste Skill & Visual Design Tools"
Cohesion: 0.53
Nodes (5): colourFamily(), hexToHsl(), inRange(), judge(), RULE_IDS

### Community 60 - "Taste Skill & Visual Design Tools"
Cohesion: 0.53
Nodes (5): colourFamily(), hexToHsl(), inRange(), judge(), RULE_IDS

### Community 61 - "Src > Lib > Utils.Ts"
Cohesion: 0.33
Nodes (4): clsx@^2.1.1, tailwind-merge@^3.0.2, clsx, tailwind-merge

### Community 62 - "Organization Workspace & Teams"
Cohesion: 0.40
Nodes (5): bulkImportSchema, checkOrgManager(), dynamic, memberRowSchema, POST()

### Community 63 - "Authentication & Onboarding"
Cohesion: 0.60
Nodes (3): LoginPage(), RegisterPage(), translateAuthError()

### Community 64 - "Personal Workspace & Learner"
Cohesion: 0.47
Nodes (5): CompetencyOption, EvaluatorItemBankPage(), formatTypeBadge(), formatTypeLabel(), QuestionItem

### Community 65 - "Personal Workspace & Learner"
Cohesion: 0.40
Nodes (4): AssessmentOption, EvaluatorLiveRoomPage(), ExamRoom, LiveRoomContent()

### Community 66 - "Src > App > Live"
Cohesion: 0.40
Nodes (5): Participant, RADIAL_ANCHORS, RoomData, WaitingRoomContent(), WaitingRoomPage()

### Community 67 - "Database & Supabase Services"
Cohesion: 0.40
Nodes (5): executeSQL(), fs, https, main(), path

### Community 68 - "Database & Supabase Services"
Cohesion: 0.40
Nodes (5): executeSQL(), fs, https, main(), path

### Community 69 - "Database & Supabase Services"
Cohesion: 0.40
Nodes (5): executeSQL(), fs, https, main(), path

### Community 71 - "Taste Skill & Visual Design Tools"
Cohesion: 0.60
Nodes (4): print_help(), skill.sh script, skill_main(), SKILLS

### Community 72 - "Authentication & Onboarding"
Cohesion: 0.40
Nodes (3): @supabase/ssr@^0.5.2, @supabase/ssr, dynamic

### Community 73 - "Personal Workspace & Learner"
Cohesion: 0.40
Nodes (4): dynamic, GET(), PATCH(), updateProfileSchema

### Community 75 - "Organization Workspace & Teams"
Cohesion: 0.40
Nodes (4): ClassAssignmentRow, ClassMemberRow, dynamic, OrgClassDetailPage()

### Community 76 - "Admin Assessment Management"
Cohesion: 0.50
Nodes (3): createItemSchema, dynamic, POST()

### Community 77 - "Application API Endpoints"
Cohesion: 0.50
Nodes (3): ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES, POST()

### Community 78 - "Src > App > (Dashboard)"
Cohesion: 0.67
Nodes (3): AdminUsersPage(), UserRecord, UsersContent()

## Knowledge Gaps
- **1 isolated node(s):** `SKILLS`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 571 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Organization Workspace & Teams` to `AI Gateway & Adapters`, `Admin Assessment Management`, `Organization Workspace & Teams`, `Organization Workspace & Teams`, `Authentication & Onboarding`, `Payment & Transactions`, `Organization Workspace & Teams`, `Authentication & Onboarding`, `Personal Workspace & Learner`, `Payment & Transactions`, `AI Gateway & Adapters`, `Organization Workspace & Teams`, `AI Gateway & Adapters`, `General`, `Organization Workspace & Teams`, `Organization Workspace & Teams`, `Admin Assessment Management`, `Personal Workspace & Learner`, `Application API Endpoints`, `Organization Workspace & Teams`, `Organization Workspace & Teams`, `General`, `Application API Endpoints`, `Organization Workspace & Teams`, `Src > Components > Dashboard`, `Personal Workspace & Learner`, `Organization Workspace & Teams`, `Src > App > Live`, `Application API Endpoints`, `Organization Workspace & Teams`, `Admin API Services`, `Application API Endpoints`, `Src > App > (Dashboard)`, `Organization Workspace & Teams`, `Personal Workspace & Learner`, `Personal Workspace & Learner`, `Src > App > Layout.Tsx`, `Organization Workspace & Teams`, `Authentication & Onboarding`, `Personal Workspace & Learner`, `Src > App > Live`, `Authentication & Onboarding`, `Personal Workspace & Learner`, `Organization Workspace & Teams`, `Admin Assessment Management`, `Application API Endpoints`, `Src > App > (Dashboard)`, `Application API Endpoints`, `Application API Endpoints`?**
  _High betweenness centrality (0.248) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `createClient()` (e.g. with `[joinCode]/route.test.ts` and `assessment-campaign.service.test.ts`) actually correct?**
  _`createClient()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `SKILLS` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Taste Skill & Visual Design Tools` be split into smaller, more focused modules?**
  _Cohesion score 0.06648426812585499 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `Organization Workspace & Teams` to `AI Gateway & Adapters`, `Admin Assessment Management`, `Organization Workspace & Teams`, `Organization Workspace & Teams`, `Authentication & Onboarding`, `Payment & Transactions`, `Organization Workspace & Teams`, `Personal Workspace & Learner`, `AI Gateway & Adapters`, `Organization Workspace & Teams`, `General`, `Organization Workspace & Teams`, `Organization Workspace & Teams`, `Personal Workspace & Learner`, `Organization Workspace & Teams`, `General`, `Organization Workspace & Teams`, `Src > Components > Dashboard`, `Personal Workspace & Learner`, `Src > App > Live`, `Src > App > (Dashboard)`, `Organization Workspace & Teams`, `Personal Workspace & Learner`, `Personal Workspace & Learner`, `Authentication & Onboarding`, `Personal Workspace & Learner`, `Personal Workspace & Learner`, `Src > App > Live`, `Organization Workspace & Teams`, `Src > App > (Dashboard)`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `createAdminClient()` (e.g. with `organizations/route.test.ts` and `transactions/route.test.ts`) actually correct?**
  _`createAdminClient()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Should `Taste Skill & Visual Design Tools` be split into smaller, more focused modules?**
  _Cohesion score 0.06648426812585499 - nodes in this community are weakly interconnected._