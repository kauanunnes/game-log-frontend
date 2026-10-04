import type { Page, ReportDecision, ReportedReview } from '@/types/api'
import { api } from './client'

/** @param page começa em 0 */
export const listOpenReports = (page: number) =>
  api<Page<ReportedReview>>(`/admin/reports?page=${page}&size=10`)

/** Vale para todas as denúncias abertas da avaliação. */
export const resolveReport = (id: number, decision: ReportDecision) =>
  api<void>(`/admin/reports/${id}`, { method: 'PATCH', body: { decision } })
