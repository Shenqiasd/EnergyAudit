export type AuditProjectStatus =
  | 'pending_start'
  | 'configuring'
  | 'filing'
  | 'pending_submit'
  | 'pending_report'
  | 'report_processing'
  | 'pending_review'
  | 'in_review'
  | 'pending_rectification'
  | 'in_rectification'
  | 'completed'
  | 'closed';

export type ProjectMemberRole =
  | 'enterprise_contact'
  | 'enterprise_filler'
  | 'assigned_reviewer'
  | 'project_manager';
