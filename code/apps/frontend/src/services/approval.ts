import api from './api';

/** 提交审批 */
export async function submitApproval(data: {
  typeCode: string;
  secondClassCode: string;
  secondClassName: string;
  dataCategoryCode: string;
  dataCategoryName: string;
  dataCode: string;
  dataName: string;
}): Promise<{ draftId: number; approvalId: number }> {
  const res = await api.post('/approval/submit', data);
  return res.data;
}

/** 获取我的提交记录 */
export async function getMySubmissions(pageNum: number = 1, pageSize: number = 20): Promise<{
  items: Array<{
    draftId: number;
    typeCode: string;
    secondClassCode: string;
    secondClassName: string;
    dataCategoryCode: string;
    dataCategoryName: string;
    dataCode: string;
    dataName: string;
    status: string;
    rejectReason: string | null;
    submitTm: string | null;
    createTm: string;
  }>;
  total: number;
}> {
  const res = await api.get('/approval/my-submissions', { params: { pageNum, pageSize } });
  return res.data;
}

/** 获取审批列表（admin） */
export async function getApprovalList(
  pageNum: number = 1,
  pageSize: number = 20,
  status?: string,
  sourceTenant?: string,
): Promise<{
  items: Array<{
    approvalId: number;
    sourceTenant: string;
    typeCode: string;
    secondClassCode: string;
    secondClassName: string;
    dataCategoryCode: string;
    dataCategoryName: string;
    dataCode: string;
    dataName: string;
    status: string;
    rejectReason: string | null;
    submitter: string;
    reviewer: string | null;
    submitTm: string;
    reviewTm: string | null;
  }>;
  total: number;
}> {
  const params: any = { pageNum, pageSize };
  if (status) params.status = status;
  if (sourceTenant) params.sourceTenant = sourceTenant;
  const res = await api.get('/approval/pending-list', { params });
  return res.data;
}

/** 审批通过 */
export async function approveApproval(approvalId: number): Promise<void> {
  await api.post(`/approval/${approvalId}/approve`);
}

/** 审批拒绝 */
export async function rejectApproval(approvalId: number, reason: string): Promise<void> {
  await api.post(`/approval/${approvalId}/reject`, { reason });
}
