/**
 * 模板主对象
 * 对齐设计文档 5.1 平台核心对象 - Template
 */
export interface Template {
  id: string;
  code: string;
  name: string;
  description?: string;
  /** 当前激活版本 ID */
  activeVersionId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 模板版本对象
 * 对齐设计文档 5.1 平台核心对象 - TemplateVersion
 */
export interface TemplateVersion {
  id: string;
  templateId: string;
  versionNumber: number;
  /** 版本标签 (如 "2026-v1") */
  versionLabel?: string;
  /** 是否为当前激活版本 */
  isActive: boolean;
  /** 模块配置快照 (JSON) */
  moduleConfigSnapshot?: string;
  /** 发布时间 */
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export function createTemplate(
  overrides: Partial<Template> = {},
): Template {
  return {
    id: "template_1",
    code: "energy-audit-2026",
    name: "2026年度能源审计模板",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createTemplateVersion(
  overrides: Partial<TemplateVersion> = {},
): TemplateVersion {
  return {
    id: "tv_1",
    templateId: "template_1",
    versionNumber: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}
