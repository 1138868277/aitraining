import { z } from 'zod';

/** 审批状态枚举 */
export const ApprovalStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type ApprovalStatus = (typeof ApprovalStatus)[keyof typeof ApprovalStatus];

/** 草稿状态枚举 */
export const DraftStatus = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type DraftStatus = (typeof DraftStatus)[keyof typeof DraftStatus];

/** 提交审批请求 */
export const submitApprovalSchema = z.object({
  typeCode: z.string().min(1, '请选择类型'),
  secondClassCode: z.string().min(1, '请选择二级类码'),
  secondClassName: z.string().min(1, '二级类码名称不能为空'),
  dataCategoryCode: z.string().min(1, '请输入数据类码'),
  dataCategoryName: z.string().min(1, '请输入数据类码名称'),
  dataCode: z.string().min(1, '请输入数据码'),
  dataName: z.string().min(1, '请输入数据码名称'),
});

export type SubmitApprovalRequest = z.infer<typeof submitApprovalSchema>;

/** 提交审批响应 */
export const submitApprovalResponseSchema = z.object({
  draftId: z.number(),
  approvalId: z.number(),
});

export type SubmitApprovalResponse = z.infer<typeof submitApprovalResponseSchema>;

/** 审批记录项 */
export const approvalItemSchema = z.object({
  approvalId: z.number(),
  typeCode: z.string(),
  secondClassCode: z.string(),
  secondClassName: z.string(),
  dataCategoryCode: z.string(),
  dataCategoryName: z.string(),
  dataCode: z.string(),
  dataName: z.string(),
  status: z.string(),
  rejectReason: z.string().nullable(),
  submitter: z.string(),
  reviewer: z.string().nullable(),
  submitTm: z.string(),
  reviewTm: z.string().nullable(),
});

export type ApprovalItem = z.infer<typeof approvalItemSchema>;

/** 审批列表响应 */
export const approvalListResponseSchema = z.object({
  items: z.array(approvalItemSchema),
  total: z.number(),
});

export type ApprovalListResponse = z.infer<typeof approvalListResponseSchema>;

/** 我的提交记录项 */
export const mySubmissionItemSchema = z.object({
  draftId: z.number(),
  typeCode: z.string(),
  secondClassCode: z.string(),
  secondClassName: z.string(),
  dataCategoryCode: z.string(),
  dataCategoryName: z.string(),
  dataCode: z.string(),
  dataName: z.string(),
  status: z.string(),
  rejectReason: z.string().nullable(),
  submitTm: z.string().nullable(),
  createTm: z.string(),
});

export type MySubmissionItem = z.infer<typeof mySubmissionItemSchema>;

/** 拒绝请求 */
export const rejectApprovalSchema = z.object({
  reason: z.string().min(1, '请填写拒绝原因'),
});

export type RejectApprovalRequest = z.infer<typeof rejectApprovalSchema>;
