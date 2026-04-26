/**
 * @techbirds/sdk — typed API client.
 *
 * Hand-written until codegen lands; replace with generated types from
 * /openapi.json in Phase 7.
 */

export interface ApiClientOptions {
  baseUrl: string;
  credentials?: RequestCredentials;
  headers?: HeadersInit;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ApiClient {
  constructor(private readonly opts: ApiClientOptions) {}

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
    const baseHeaders: Record<string, string> = isFormData
      ? {}
      : { "Content-Type": "application/json" };
    const res = await fetch(`${this.opts.baseUrl}${path}`, {
      credentials: this.opts.credentials ?? "include",
      ...init,
      headers: {
        ...baseHeaders,
        ...(this.opts.headers ?? {}),
        ...(init.headers ?? {}),
      },
    });
    const text = await res.text();
    const body = text ? JSON.parse(text) : null;
    if (!res.ok) throw new ApiError(res.status, body, `${res.status} ${res.statusText}`);
    return body as T;
  }

  get<T>(path: string) {
    return this.request<T>(path);
  }
  post<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined });
  }
  patch<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined });
  }
  delete<T>(path: string) {
    return this.request<T>(path, { method: "DELETE" });
  }

  // ─── Public endpoints ──────────────────────────────────────────────────────

  health() {
    return this.get<HealthStatus>("/health");
  }

  createEnquiry(input: EnquiryCreate) {
    return this.post<EnquiryResponse>("/v1/enquiries", input);
  }

  // ─── Blog ────────────────────────────────────────────────────────────────
  listBlogPosts(params: { page?: number; pageSize?: number; tag?: string } = {}) {
    const q = new URLSearchParams();
    if (params.page) q.set("page", String(params.page));
    if (params.pageSize) q.set("page_size", String(params.pageSize));
    if (params.tag) q.set("tag", params.tag);
    const qs = q.toString();
    return this.get<BlogListResponse>(`/v1/blog/posts${qs ? `?${qs}` : ""}`);
  }

  getBlogPost(slug: string) {
    return this.get<BlogPostDetail>(`/v1/blog/posts/${encodeURIComponent(slug)}`);
  }

  listBlogTags() {
    return this.get<BlogTag[]>("/v1/blog/tags");
  }

  // ─── Auth ────────────────────────────────────────────────────────────────
  requestOtp(email: string) {
    return this.post<GenericOk>("/v1/auth/otp/request", { email });
  }
  verifyOtp(email: string, code: string) {
    return this.post<AuthOk>("/v1/auth/otp/verify", { email, code });
  }
  refreshSession() {
    return this.post<GenericOk>("/v1/auth/refresh");
  }
  logout() {
    return this.post<GenericOk>("/v1/auth/logout");
  }
  me() {
    return this.get<UserPublic>("/v1/auth/me");
  }

  // ─── Attendance ──────────────────────────────────────────────────────────
  punch(note?: string) {
    return this.post<PunchEntry>("/v1/attendance/punch", { note });
  }
  todayState() {
    return this.get<TodayState>("/v1/attendance/today");
  }
  punchHistory(days = 14) {
    return this.get<HistoryResponse>(`/v1/attendance/history?days=${days}`);
  }

  // ─── People ──────────────────────────────────────────────────────────────
  listHolidays(year?: number) {
    const q = year ? `?year=${year}` : "";
    return this.get<Holiday[]>(`/v1/people/holidays${q}`);
  }
  upcomingBirthdays(days = 30) {
    return this.get<Birthday[]>(`/v1/people/birthdays/upcoming?days=${days}`);
  }
  upcomingAnniversaries(days = 30) {
    return this.get<WorkAnniversary[]>(`/v1/people/anniversaries/upcoming?days=${days}`);
  }

  // ─── Leave ───────────────────────────────────────────────────────────────
  listLeaveTypes() {
    return this.get<LeaveTypeOut[]>("/v1/leave/types");
  }
  myLeaveBalance() {
    return this.get<LeaveBalanceOut[]>("/v1/leave/balance");
  }
  myLeaveRequests(limit = 50) {
    return this.get<LeaveRequestOut[]>(`/v1/leave/requests?limit=${limit}`);
  }
  createLeaveRequest(input: LeaveRequestCreate) {
    return this.post<LeaveRequestOut>("/v1/leave/requests", input);
  }
  cancelLeaveRequest(id: string) {
    return this.post<LeaveRequestOut>(`/v1/leave/requests/${id}/cancel`);
  }
  listPendingLeave() {
    return this.get<LeaveRequestOut[]>("/v1/leave/admin/pending");
  }
  decideLeave(id: string, input: LeaveDecision) {
    return this.post<LeaveRequestOut>(`/v1/leave/admin/requests/${id}/decide`, input);
  }

  // ─── Feed ────────────────────────────────────────────────────────────────
  listFeedPosts(page = 1, pageSize = 20) {
    return this.get<FeedListResponse>(`/v1/feed/posts?page=${page}&page_size=${pageSize}`);
  }
  createFeedPost(input: FeedPostCreate) {
    return this.post<FeedPostOut>("/v1/feed/posts", input);
  }
  deleteFeedPost(id: string) {
    return this.delete<void>(`/v1/feed/posts/${id}`);
  }
  reactToFeedPost(id: string, emoji: string) {
    return this.post<FeedPostOut>(`/v1/feed/posts/${id}/react`, { emoji });
  }

  // ─── Payroll ─────────────────────────────────────────────────────────────
  myPayslips(year?: number) {
    const q = year ? `?year=${year}` : "";
    return this.get<PayslipOut[]>(`/v1/payroll/payslips/me${q}`);
  }
  listPayslips(params: { run_id?: string; user_id?: string } = {}) {
    const q = new URLSearchParams();
    if (params.run_id) q.set("run_id", params.run_id);
    if (params.user_id) q.set("user_id", params.user_id);
    const qs = q.toString();
    return this.get<PayslipOut[]>(`/v1/payroll/payslips${qs ? `?${qs}` : ""}`);
  }
  payslipUrl(id: string) {
    return this.get<SignedUrlOut>(`/v1/payroll/payslips/${id}/url`);
  }
  deletePayslip(id: string, reason: string) {
    return this.request<void>(`/v1/payroll/payslips/${id}`, {
      method: "DELETE",
      body: JSON.stringify({ reason }),
    });
  }
  listPayrollRuns() {
    return this.get<PayrollRunOut[]>("/v1/payroll/runs");
  }
  createPayrollRun(input: PayrollRunCreate) {
    return this.post<PayrollRunOut>("/v1/payroll/runs", input);
  }
  computePayrollRun(id: string) {
    return this.post<PayrollRunOut>(`/v1/payroll/runs/${id}/compute`);
  }
  releasePayrollRun(id: string) {
    return this.post<PayrollRunOut>(`/v1/payroll/runs/${id}/release`);
  }
  listSalaryStructures(userId: string) {
    return this.get<SalaryStructureOut[]>(`/v1/payroll/structures/${userId}`);
  }
  createSalaryStructure(input: SalaryStructureCreate) {
    return this.post<SalaryStructureOut>("/v1/payroll/structures", input);
  }

  // ─── Documents ───────────────────────────────────────────────────────────
  myDocuments() {
    return this.get<DocumentOut[]>("/v1/documents/me");
  }
  listDocuments(params: { user_id?: string; doc_type?: DocType } = {}) {
    const q = new URLSearchParams();
    if (params.user_id) q.set("user_id", params.user_id);
    if (params.doc_type) q.set("doc_type", params.doc_type);
    const qs = q.toString();
    return this.get<DocumentOut[]>(`/v1/documents${qs ? `?${qs}` : ""}`);
  }
  documentUrl(id: string) {
    return this.get<SignedUrlOut>(`/v1/documents/${id}/url`);
  }
  uploadDocument(input: {
    user_id: string;
    doc_type: DocType;
    title: string;
    period_label?: string;
    file: File;
  }) {
    const fd = new FormData();
    fd.set("user_id", input.user_id);
    fd.set("doc_type", input.doc_type);
    fd.set("title", input.title);
    if (input.period_label) fd.set("period_label", input.period_label);
    fd.set("file", input.file);
    return this.request<DocumentOut>("/v1/documents", { method: "POST", body: fd });
  }
  deleteDocument(id: string, reason: string) {
    return this.request<void>(`/v1/documents/${id}`, {
      method: "DELETE",
      body: JSON.stringify({ reason }),
    });
  }
}

/** Convenience factory using the Vite env. */
export const createApiClient = (baseUrl: string) => new ApiClient({ baseUrl });

// ─── Domain types ─────────────────────────────────────────────────────────────

export type EnquiryType = "general" | "project" | "careers" | "press" | "other";
export type EnquiryStatus = "new" | "read" | "replied" | "won" | "lost" | "spam";
export type ProjectType = "web" | "mobile" | "erp" | "ecom" | "cloud" | "ai";
export type BudgetRange = "<5L" | "5-15L" | "15-50L" | "50L+";

export interface EnquiryCreate {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  enquiry_type: EnquiryType;
  project_type?: ProjectType;
  budget_range?: BudgetRange;
  message: string;
  turnstile_token: string;
  /** Honeypot — must remain empty. */
  website?: string;
}

export interface EnquiryResponse {
  id: string;
  status: EnquiryStatus;
  created_at: string;
}

// ─── Auth types ──────────────────────────────────────────────────────────────

export interface UserPublic {
  id: string;
  email: string;
  full_name: string;
  is_employee: boolean;
  roles: string[];
  last_login_at: string | null;
}

export interface AuthOk {
  ok: true;
  user: UserPublic;
}

export interface GenericOk {
  ok: true;
}

// ─── Attendance types ────────────────────────────────────────────────────────

export type PunchType = "in" | "out";

export interface PunchEntry {
  id: string;
  type: PunchType;
  source: string;
  note: string | null;
  created_at: string;
}

export interface TodayState {
  is_punched_in: boolean;
  last_entry: PunchEntry | null;
  today_total_minutes: number;
  today_date: string;
}

export interface HistoryDay {
  date: string;
  entries: PunchEntry[];
  total_minutes: number;
}

export interface HistoryResponse {
  days: HistoryDay[];
}

// ─── People types ────────────────────────────────────────────────────────────

export interface Holiday {
  id: string;
  date: string;
  name: string;
  region: string;
  is_optional: boolean;
  notes: string | null;
}

export interface Birthday {
  user_id: string;
  full_name: string;
  designation: string | null;
  dob_day: number;
  dob_month: number;
  days_until: number;
}

export interface WorkAnniversary {
  user_id: string;
  full_name: string;
  designation: string | null;
  joined_at: string;
  years: number;
  days_until: number;
}

// ─── Leave types ─────────────────────────────────────────────────────────────

export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface LeaveTypeOut {
  id: number;
  code: string;
  name: string;
  default_annual_quota: number;
  is_paid: boolean;
  description: string | null;
}

export interface LeaveBalanceOut {
  leave_type_id: number;
  leave_type_code: string;
  leave_type_name: string;
  year: number;
  quota: number;
  used: number;
  remaining: number;
}

export interface LeaveRequestCreate {
  leave_type_id: number;
  from_date: string;
  to_date: string;
  reason?: string;
}

export interface LeaveDecision {
  decision: "approved" | "rejected";
  note?: string;
}

export interface LeaveRequestOut {
  id: string;
  user_id: string;
  user_name: string | null;
  leave_type_id: number;
  leave_type_code: string | null;
  leave_type_name: string | null;
  from_date: string;
  to_date: string;
  days: number;
  reason: string | null;
  status: LeaveStatus;
  decided_by: string | null;
  decided_at: string | null;
  decision_note: string | null;
  created_at: string;
}

// ─── Feed types ──────────────────────────────────────────────────────────────

export interface FeedAttachment {
  url: string;
  kind?: string;
  caption?: string;
}

export interface FeedPostCreate {
  body_md: string;
  attachments?: FeedAttachment[];
  pinned?: boolean;
}

export interface ReactionCount {
  emoji: string;
  count: number;
  reacted: boolean;
}

export interface FeedPostOut {
  id: string;
  author_id: string;
  author_name: string | null;
  body_md: string;
  attachments: FeedAttachment[] | null;
  pinned: boolean;
  reactions: ReactionCount[];
  created_at: string;
}

export interface FeedListResponse {
  items: FeedPostOut[];
  total: number;
  page: number;
  page_size: number;
}

// ─── Payroll types ───────────────────────────────────────────────────────────

export type PayrollRunStatus = "draft" | "locked" | "computed" | "released";

export interface PayrollRunCreate {
  year: number;
  month: number;
  notes?: string;
}

export interface PayrollRunOut {
  id: string;
  year: number;
  month: number;
  status: PayrollRunStatus;
  locked_at: string | null;
  computed_at: string | null;
  released_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface PayslipLine {
  code: string;
  name: string;
  amount: string;
}

export interface PayslipBreakdown {
  earnings: PayslipLine[];
  deductions: PayslipLine[];
}

export interface PayslipOut {
  id: string;
  payroll_run_id: string;
  user_id: string;
  user_name: string | null;
  employee_code: string | null;
  year: number;
  month: number;
  working_days: string;
  paid_days: string;
  gross: string;
  total_earnings: string;
  total_deductions: string;
  net_pay: string;
  breakdown: PayslipBreakdown | null;
  has_pdf: boolean;
  generated_at: string | null;
  deleted_at: string | null;
}

export interface SalaryComponentIn {
  code: string;
  name: string;
  kind: "earning" | "deduction";
  monthly_amount: string | number;
  is_taxable?: boolean;
  sort_order?: number;
}

export interface SalaryComponentOut extends SalaryComponentIn {
  id: number;
}

export interface SalaryStructureCreate {
  user_id: string;
  effective_from: string;
  effective_to?: string | null;
  ctc_annual: string | number;
  notes?: string | null;
  components: SalaryComponentIn[];
}

export interface SalaryStructureOut {
  id: string;
  user_id: string;
  effective_from: string;
  effective_to: string | null;
  ctc_annual: string;
  notes: string | null;
  components: SalaryComponentOut[];
  created_at: string;
}

export interface SignedUrlOut {
  url: string;
  expires_in: number;
}

// ─── Document types ──────────────────────────────────────────────────────────

export type DocType =
  | "offer_letter"
  | "hike_letter"
  | "form_16"
  | "form_26as"
  | "relieving_letter"
  | "id_card"
  | "fnf_letter"
  | "experience_letter";

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  offer_letter: "Offer letter",
  hike_letter: "Hike letter",
  form_16: "Form 16",
  form_26as: "Form 26AS",
  relieving_letter: "Relieving letter",
  id_card: "ID card",
  fnf_letter: "F&F letter",
  experience_letter: "Experience letter",
};

export interface DocumentOut {
  id: string;
  user_id: string;
  user_name: string | null;
  doc_type: DocType;
  title: string;
  period_label: string | null;
  size_bytes: number | null;
  mime_type: string;
  issued_at: string;
  deleted_at: string | null;
}

export interface BlogPostSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  cover_image: string | null;
  tags: string[];
  reading_minutes: number;
  author_name: string | null;
  published_at: string | null;
}

export interface BlogPostDetail extends BlogPostSummary {
  body_md: string;
}

export interface BlogTag {
  tag: string;
  count: number;
}

export interface BlogListResponse {
  items: BlogPostSummary[];
  total: number;
  page: number;
  page_size: number;
}

export interface HealthChecks {
  db: "ok" | "degraded" | "down";
  redis: "ok" | "degraded" | "down";
  r2: "ok" | "degraded" | "down";
  smtp: "ok" | "degraded" | "down";
}

export interface HealthStatus {
  status: "ok" | "degraded" | "down";
  version: string;
  checks: HealthChecks;
}

// ─── Form option lists (for dropdowns; one source of truth) ──────────────────

export const ENQUIRY_TYPES: { value: EnquiryType; label: string }[] = [
  { value: "project", label: "New project" },
  { value: "general", label: "General question" },
  { value: "careers", label: "Careers / hiring" },
  { value: "press", label: "Press / media" },
  { value: "other", label: "Something else" },
];

export const PROJECT_TYPES: { value: ProjectType; label: string }[] = [
  { value: "web", label: "Web app" },
  { value: "mobile", label: "Mobile app" },
  { value: "erp", label: "Custom ERP" },
  { value: "ecom", label: "E-commerce" },
  { value: "cloud", label: "Cloud / DevOps" },
  { value: "ai", label: "AI / Data" },
];

export const BUDGET_RANGES: { value: BudgetRange; label: string }[] = [
  { value: "<5L", label: "Under ₹5 lakh" },
  { value: "5-15L", label: "₹5 – 15 lakh" },
  { value: "15-50L", label: "₹15 – 50 lakh" },
  { value: "50L+", label: "₹50 lakh+" },
];
