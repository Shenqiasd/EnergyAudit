import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull, desc } from 'drizzle-orm';
import PDFDocument from 'pdfkit';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  PageNumber,
  NumberFormat,
  Footer,
  BorderStyle,
} from 'docx';

import { DRIZZLE } from '../../db/database.module';
import * as schema from '../../db/schema';
import {
  getSectionsForReport,
  getFieldsForSection,
  getChartRulesForSection,
} from '@energy-audit/reporting';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { ReportSection } from '@energy-audit/reporting';

// ==================== Font path for Chinese support ====================
const FONT_PATH = '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc';
const FALLBACK_FONT = 'Helvetica';

function getFont(): string {
  try {
    require('fs').accessSync(FONT_PATH);
    return FONT_PATH;
  } catch {
    return FALLBACK_FONT;
  }
}

// ==================== PDF Generator Service ====================

@Injectable()
export class PdfGeneratorService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  // ==================== Report PDF ====================

  async generateReportPdf(reportId: string): Promise<Buffer> {
    const reportData = await this.loadReportData(reportId);
    const font = getFont();

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 60, bottom: 60, left: 50, right: 50 },
        bufferPages: true,
        info: {
          Title: `能源审计报告 - ${reportData.enterpriseName}`,
          Author: '能源审计平台',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Cover page
      this.renderCoverPage(doc, reportData, font);

      // Table of contents
      doc.addPage();
      this.renderTableOfContents(doc, reportData.sections, font);

      // Chapters
      for (const section of reportData.sections) {
        doc.addPage();
        this.renderChapter(doc, section, font);
      }

      // Add page numbers to all pages
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc
          .fontSize(9)
          .font(font)
          .text(`第 ${i + 1} 页 / 共 ${pages.count} 页`, 50, doc.page.height - 40, {
            align: 'center',
            width: doc.page.width - 100,
          });
      }

      doc.end();
    });
  }

  // ==================== Report DOCX ====================

  async generateReportDocx(reportId: string): Promise<Buffer> {
    const reportData = await this.loadReportData(reportId);

    const children: (Paragraph | Table)[] = [];

    // Cover page
    children.push(
      new Paragraph({ spacing: { before: 4000 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: '能源审计报告', bold: true, size: 56 })],
      }),
      new Paragraph({ spacing: { before: 600 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: reportData.enterpriseName, size: 36 })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: `审计年度：${reportData.auditYear}`, size: 24 })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: `报告版本：V${reportData.version}`, size: 24 })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: `生成日期：${reportData.generatedDate}`, size: 24 })],
      }),
      new Paragraph({
        children: [new TextRun({ break: 1, text: '' })],
        pageBreakBefore: true,
      }),
    );

    // Table of contents header
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: '目录', bold: true })],
      }),
    );

    for (const section of reportData.sections) {
      children.push(
        new Paragraph({
          spacing: { before: 100 },
          children: [
            new TextRun({ text: `第${section.sortOrder}章  ${section.sectionName}`, size: 24 }),
          ],
        }),
      );
    }

    children.push(
      new Paragraph({
        children: [new TextRun({ break: 1, text: '' })],
        pageBreakBefore: true,
      }),
    );

    // Chapters
    for (const section of reportData.sections) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [
            new TextRun({
              text: `第${section.sortOrder}章  ${section.sectionName}`,
              bold: true,
            }),
          ],
        }),
      );

      // Section content
      const contentLines = (section.content ?? '').split('\n');
      for (const line of contentLines) {
        children.push(
          new Paragraph({
            spacing: { before: 100, after: 100 },
            children: [new TextRun({ text: line, size: 22 })],
          }),
        );
      }

      // Field data table
      if (section.fields && section.fields.length > 0) {
        children.push(
          new Paragraph({
            spacing: { before: 200 },
            children: [new TextRun({ text: '数据明细：', bold: true, size: 22 })],
          }),
        );

        const tableRows = [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 40, type: WidthType.PERCENTAGE },
                children: [new Paragraph({ children: [new TextRun({ text: '指标', bold: true })] })],
              }),
              new TableCell({
                width: { size: 30, type: WidthType.PERCENTAGE },
                children: [new Paragraph({ children: [new TextRun({ text: '数值', bold: true })] })],
              }),
              new TableCell({
                width: { size: 30, type: WidthType.PERCENTAGE },
                children: [new Paragraph({ children: [new TextRun({ text: '单位', bold: true })] })],
              }),
            ],
          }),
        ];

        for (const field of section.fields) {
          tableRows.push(
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: field.label })] })],
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: field.value })] })],
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: field.unit ?? '' })] })],
                }),
              ],
            }),
          );
        }

        children.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: tableRows,
          }),
        );
      }

      // Chart references
      if (section.chartRefs && section.chartRefs.length > 0) {
        children.push(
          new Paragraph({
            spacing: { before: 200 },
            children: [new TextRun({ text: '图表：', bold: true, size: 22 })],
          }),
        );
        for (const chart of section.chartRefs) {
          children.push(
            new Paragraph({
              spacing: { before: 100 },
              children: [
                new TextRun({ text: `[${chart.chartType}] ${chart.title}`, italics: true, size: 22 }),
              ],
            }),
          );
        }
      }

      // Page break after each chapter except the last
      if (section.sortOrder < reportData.sections.length) {
        children.push(
          new Paragraph({
            children: [new TextRun({ break: 1, text: '' })],
            pageBreakBefore: true,
          }),
        );
      }
    }

    const docxDocument = new Document({
      sections: [
        {
          properties: {
            page: {
              pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
            },
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({ children: ['第 ', PageNumber.CURRENT, ' 页'] }),
                  ],
                }),
              ],
            }),
          },
          children,
        },
      ],
    });

    return Packer.toBuffer(docxDocument);
  }

  // ==================== Review Report PDF ====================

  async generateReviewReport(reviewTaskId: string): Promise<Buffer> {
    const reviewData = await this.loadReviewData(reviewTaskId);
    const font = getFont();

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 60, bottom: 60, left: 50, right: 50 },
        bufferPages: true,
        info: {
          Title: '能源审计审核报告',
          Author: '能源审计平台',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width - 100;

      // Title
      doc.fontSize(22).font(font).text('审核报告', { align: 'center' });
      doc.moveDown(1.5);

      // Summary section
      doc.fontSize(16).font(font).text('一、审核概要', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).font(font);
      doc.text(`审核人：${reviewData.reviewerName}`);
      doc.text(`审核日期：${reviewData.reviewDate}`);
      doc.text(`审核状态：${reviewData.status}`);
      doc.text(`总得分：${reviewData.totalScore}`);
      if (reviewData.conclusion) {
        doc.text(`审核结论：${reviewData.conclusion}`);
      }
      doc.moveDown(1);

      // Score breakdown
      doc.fontSize(16).font(font).text('二、评分明细', { underline: true });
      doc.moveDown(0.5);

      if (reviewData.scores.length > 0) {
        this.renderScoreTable(doc, reviewData.scores, font, pageWidth);
      } else {
        doc.fontSize(11).font(font).text('暂无评分数据');
      }
      doc.moveDown(1);

      // Issues section
      doc.fontSize(16).font(font).text('三、审核问题', { underline: true });
      doc.moveDown(0.5);

      if (reviewData.issues.length > 0) {
        for (let i = 0; i < reviewData.issues.length; i++) {
          const issue = reviewData.issues[i];
          doc.fontSize(11).font(font);
          doc.text(`${i + 1}. [${this.getSeverityLabel(issue.severity)}] ${issue.description}`);
          if (issue.moduleCode) {
            doc.text(`   模块：${issue.moduleCode}`, { indent: 20 });
          }
          if (issue.suggestion) {
            doc.text(`   建议：${issue.suggestion}`, { indent: 20 });
          }
          doc.text(`   需要整改：${issue.requiresRectification ? '是' : '否'}`, { indent: 20 });
          doc.moveDown(0.3);
        }
      } else {
        doc.fontSize(11).font(font).text('无审核问题');
      }
      doc.moveDown(1);

      // Conclusion section
      doc.fontSize(16).font(font).text('四、总结', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).font(font);
      doc.text(reviewData.conclusion ?? '审核结论待生成。');

      // Page numbers
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc
          .fontSize(9)
          .font(font)
          .text(`第 ${i + 1} 页 / 共 ${pages.count} 页`, 50, doc.page.height - 40, {
            align: 'center',
            width: pageWidth,
          });
      }

      doc.end();
    });
  }

  // ==================== Rectification Report PDF ====================

  async generateRectificationReport(rectificationTaskId: string): Promise<Buffer> {
    const rectData = await this.loadRectificationData(rectificationTaskId);
    const font = getFont();

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 60, bottom: 60, left: 50, right: 50 },
        bufferPages: true,
        info: {
          Title: '整改报告',
          Author: '能源审计平台',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width - 100;

      // Title
      doc.fontSize(22).font(font).text('整改报告', { align: 'center' });
      doc.moveDown(1.5);

      // Task summary
      doc.fontSize(16).font(font).text('一、整改任务概要', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).font(font);
      doc.text(`任务标题：${rectData.title}`);
      doc.text(`当前状态：${this.getRectificationStatusLabel(rectData.status)}`);
      if (rectData.description) {
        doc.text(`任务描述：${rectData.description}`);
      }
      if (rectData.deadline) {
        doc.text(`截止日期：${rectData.deadline}`);
      }
      doc.text(`是否逾期：${rectData.isOverdue ? '是' : '否'}`);
      if (rectData.completedAt) {
        doc.text(`完成时间：${rectData.completedAt}`);
      }
      doc.moveDown(1);

      // Progress timeline
      doc.fontSize(16).font(font).text('二、整改进度', { underline: true });
      doc.moveDown(0.5);

      if (rectData.progress.length > 0) {
        for (let i = 0; i < rectData.progress.length; i++) {
          const entry = rectData.progress[i];
          doc.fontSize(11).font(font);
          doc.text(`${i + 1}. [${entry.date}] 进度：${entry.progressPercent}%`);
          doc.text(`   备注：${entry.note}`, { indent: 20 });
          doc.text(`   记录人：${entry.recordedBy}`, { indent: 20 });
          doc.moveDown(0.3);
        }
      } else {
        doc.fontSize(11).font(font).text('暂无进度记录');
      }
      doc.moveDown(1);

      // Completion status
      doc.fontSize(16).font(font).text('三、完成情况', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).font(font);

      const latestProgress = rectData.progress.length > 0
        ? rectData.progress[0].progressPercent
        : 0;

      doc.text(`当前进度：${latestProgress}%`);
      doc.text(`整改状态：${this.getRectificationStatusLabel(rectData.status)}`);

      if (rectData.status === 'completed') {
        doc.text('整改已完成。');
      } else if (rectData.status === 'delayed') {
        doc.text('整改已逾期，请尽快完成。');
      } else {
        doc.text('整改进行中，请按期完成。');
      }

      // Page numbers
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc
          .fontSize(9)
          .font(font)
          .text(`第 ${i + 1} 页 / 共 ${pages.count} 页`, 50, doc.page.height - 40, {
            align: 'center',
            width: pageWidth,
          });
      }

      doc.end();
    });
  }

  // ==================== Private helpers ====================

  private async loadReportData(reportId: string) {
    const [report] = await this.db
      .select()
      .from(schema.reports)
      .where(eq(schema.reports.id, reportId))
      .limit(1);

    if (!report) {
      throw new Error('报告不存在');
    }

    const [project] = await this.db
      .select()
      .from(schema.auditProjects)
      .where(eq(schema.auditProjects.id, report.auditProjectId))
      .limit(1);

    const [enterprise] = project
      ? await this.db
          .select()
          .from(schema.enterprises)
          .where(eq(schema.enterprises.id, project.enterpriseId))
          .limit(1)
      : [undefined];

    const [profile] = project
      ? await this.db
          .select()
          .from(schema.enterpriseProfiles)
          .where(eq(schema.enterpriseProfiles.auditProjectId, project.id))
          .limit(1)
      : [undefined];

    const [batch] = project
      ? await this.db
          .select()
          .from(schema.auditBatches)
          .where(eq(schema.auditBatches.id, project.batchId))
          .limit(1)
      : [undefined];

    // Load report sections
    const dbSections = await this.db
      .select()
      .from(schema.reportSections)
      .where(
        and(
          eq(schema.reportSections.reportId, reportId),
          isNull(schema.reportSections.reportVersionId),
        ),
      )
      .orderBy(schema.reportSections.sortOrder);

    // Load data items for field data
    const records = project
      ? await this.db
          .select()
          .from(schema.dataRecords)
          .where(eq(schema.dataRecords.auditProjectId, project.id))
      : [];

    const allItems: Array<{ fieldCode: string; finalValue: string | null; rawValue: string | null; unit: string | null }> = [];
    for (const record of records) {
      const items = await this.db
        .select()
        .from(schema.dataItems)
        .where(eq(schema.dataItems.dataRecordId, record.id));
      allItems.push(
        ...items.map((i) => ({
          fieldCode: i.fieldCode,
          finalValue: i.finalValue,
          rawValue: i.rawValue,
          unit: i.unit,
        })),
      );
    }

    // Load chart outputs
    const chartOutputs = project
      ? await this.db
          .select()
          .from(schema.chartOutputs)
          .where(eq(schema.chartOutputs.auditProjectId, project.id))
      : [];

    const chartMap = new Map(chartOutputs.map((c) => [c.chartConfigCode, c]));

    const templateSections = getSectionsForReport();

    const sections = templateSections.map((tmpl) => {
      const dbSection = dbSections.find((s) => s.sectionCode === tmpl.code);

      const fields = getFieldsForSection(tmpl.code).map((fm) => {
        const item = allItems.find((i) => i.fieldCode === fm.fieldCode);
        return {
          label: fm.label,
          value: item?.finalValue ?? item?.rawValue ?? '暂无数据',
          unit: item?.unit ?? null,
        };
      });

      const chartRules = getChartRulesForSection(tmpl.code);
      const chartRefs = chartRules
        .map((rule) => {
          const chart = chartMap.get(rule.chartCode);
          if (!chart) return null;
          return { chartCode: rule.chartCode, chartType: chart.chartType, title: chart.title };
        })
        .filter((c): c is { chartCode: string; chartType: string; title: string } => c !== null);

      return {
        sectionCode: tmpl.code,
        sectionName: tmpl.name,
        sortOrder: tmpl.sortOrder,
        content: dbSection?.content ?? null,
        fields,
        chartRefs,
      };
    });

    const enterpriseName = profile?.name ?? enterprise?.name ?? '未知企业';
    const auditYear = batch?.year ?? new Date().getFullYear();

    return {
      reportId,
      enterpriseName,
      auditYear,
      version: report.version,
      generatedDate: report.generatedAt
        ? new Date(report.generatedAt).toLocaleDateString('zh-CN')
        : new Date().toLocaleDateString('zh-CN'),
      sections,
    };
  }

  private async loadReviewData(reviewTaskId: string) {
    const [task] = await this.db
      .select()
      .from(schema.reviewTasks)
      .where(eq(schema.reviewTasks.id, reviewTaskId))
      .limit(1);

    if (!task) {
      throw new Error('审核任务不存在');
    }

    const scores = await this.db
      .select()
      .from(schema.reviewScores)
      .where(eq(schema.reviewScores.reviewTaskId, reviewTaskId));

    const issues = await this.db
      .select()
      .from(schema.reviewIssues)
      .where(eq(schema.reviewIssues.reviewTaskId, reviewTaskId));

    const [reviewer] = await this.db
      .select()
      .from(schema.userAccounts)
      .where(eq(schema.userAccounts.id, task.reviewerId))
      .limit(1);

    return {
      reviewTaskId,
      reviewerName: reviewer?.name ?? '未知审核人',
      reviewDate: task.completedAt
        ? new Date(task.completedAt).toLocaleDateString('zh-CN')
        : task.assignedAt
          ? new Date(task.assignedAt).toLocaleDateString('zh-CN')
          : new Date().toLocaleDateString('zh-CN'),
      status: task.status,
      totalScore: task.totalScore ?? '未评分',
      conclusion: task.conclusion,
      scores: scores.map((s) => ({
        category: s.category,
        score: s.score,
        maxScore: s.maxScore,
        comment: s.comment,
      })),
      issues: issues.map((i) => ({
        description: i.description,
        severity: i.severity,
        moduleCode: i.moduleCode,
        suggestion: i.suggestion,
        requiresRectification: i.requiresRectification,
      })),
    };
  }

  private async loadRectificationData(rectificationTaskId: string) {
    const [task] = await this.db
      .select()
      .from(schema.rectificationTasks)
      .where(eq(schema.rectificationTasks.id, rectificationTaskId))
      .limit(1);

    if (!task) {
      throw new Error('整改任务不存在');
    }

    const progress = await this.db
      .select()
      .from(schema.rectificationProgress)
      .where(eq(schema.rectificationProgress.rectificationTaskId, rectificationTaskId))
      .orderBy(desc(schema.rectificationProgress.createdAt));

    return {
      title: task.title,
      description: task.description,
      status: task.status,
      deadline: task.deadline ? new Date(task.deadline).toLocaleDateString('zh-CN') : null,
      isOverdue: task.isOverdue,
      completedAt: task.completedAt ? new Date(task.completedAt).toLocaleDateString('zh-CN') : null,
      progress: progress.map((p) => ({
        date: new Date(p.createdAt).toLocaleDateString('zh-CN'),
        progressPercent: p.progressPercent,
        note: p.note,
        recordedBy: p.recordedBy,
      })),
    };
  }

  private renderCoverPage(
    doc: PDFKit.PDFDocument,
    reportData: { enterpriseName: string; auditYear: number; version: number; generatedDate: string },
    font: string,
  ) {
    doc.moveDown(8);
    doc.fontSize(28).font(font).text('能源审计报告', { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(18).font(font).text(reportData.enterpriseName, { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(14).font(font).text(`审计年度：${reportData.auditYear}`, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).font(font).text(`报告版本：V${reportData.version}`, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).font(font).text(`生成日期：${reportData.generatedDate}`, { align: 'center' });
  }

  private renderTableOfContents(
    doc: PDFKit.PDFDocument,
    sections: Array<{ sectionName: string; sortOrder: number }>,
    font: string,
  ) {
    doc.fontSize(18).font(font).text('目录', { align: 'center' });
    doc.moveDown(1);

    for (const section of sections) {
      doc.fontSize(12).font(font).text(`第${section.sortOrder}章  ${section.sectionName}`);
      doc.moveDown(0.3);
    }
  }

  private renderChapter(
    doc: PDFKit.PDFDocument,
    section: {
      sectionName: string;
      sortOrder: number;
      content: string | null;
      fields: Array<{ label: string; value: string; unit: string | null }>;
      chartRefs: Array<{ chartCode: string; chartType: string; title: string }>;
    },
    font: string,
  ) {
    const pageWidth = doc.page.width - 100;

    doc.fontSize(18).font(font).text(`第${section.sortOrder}章  ${section.sectionName}`);
    doc.moveDown(0.5);

    // Content
    if (section.content) {
      const lines = section.content.split('\n');
      for (const line of lines) {
        doc.fontSize(11).font(font).text(line);
        doc.moveDown(0.2);
      }
    }
    doc.moveDown(0.5);

    // Data table
    if (section.fields.length > 0) {
      doc.fontSize(13).font(font).text('数据明细：');
      doc.moveDown(0.3);

      const tableTop = doc.y;
      const colWidths = [pageWidth * 0.4, pageWidth * 0.3, pageWidth * 0.3];
      const rowHeight = 22;

      // Header row
      doc.fontSize(10).font(font);
      let x = 50;
      doc.rect(x, tableTop, pageWidth, rowHeight).stroke();
      doc.text('指标', x + 5, tableTop + 5, { width: colWidths[0] - 10 });
      x += colWidths[0];
      doc.text('数值', x + 5, tableTop + 5, { width: colWidths[1] - 10 });
      x += colWidths[1];
      doc.text('单位', x + 5, tableTop + 5, { width: colWidths[2] - 10 });

      let currentY = tableTop + rowHeight;
      for (const field of section.fields) {
        x = 50;
        doc.rect(x, currentY, pageWidth, rowHeight).stroke();
        doc.text(field.label, x + 5, currentY + 5, { width: colWidths[0] - 10 });
        x += colWidths[0];
        doc.text(field.value, x + 5, currentY + 5, { width: colWidths[1] - 10 });
        x += colWidths[1];
        doc.text(field.unit ?? '', x + 5, currentY + 5, { width: colWidths[2] - 10 });
        currentY += rowHeight;
      }

      doc.y = currentY + 10;
    }

    // Chart references
    if (section.chartRefs.length > 0) {
      doc.fontSize(13).font(font).text('图表：');
      doc.moveDown(0.3);
      for (const chart of section.chartRefs) {
        doc.fontSize(10).font(font).text(`[${chart.chartType}] ${chart.title}`);
        doc.moveDown(0.2);
      }
    }
  }

  private renderScoreTable(
    doc: PDFKit.PDFDocument,
    scores: Array<{ category: string; score: string; maxScore: string; comment: string | null }>,
    font: string,
    pageWidth: number,
  ) {
    const tableTop = doc.y;
    const colWidths = [pageWidth * 0.25, pageWidth * 0.15, pageWidth * 0.15, pageWidth * 0.45];
    const rowHeight = 22;

    // Header
    doc.fontSize(10).font(font);
    let x = 50;
    doc.rect(x, tableTop, pageWidth, rowHeight).stroke();
    doc.text('评分类别', x + 5, tableTop + 5, { width: colWidths[0] - 10 });
    x += colWidths[0];
    doc.text('得分', x + 5, tableTop + 5, { width: colWidths[1] - 10 });
    x += colWidths[1];
    doc.text('满分', x + 5, tableTop + 5, { width: colWidths[2] - 10 });
    x += colWidths[2];
    doc.text('备注', x + 5, tableTop + 5, { width: colWidths[3] - 10 });

    let currentY = tableTop + rowHeight;
    for (const score of scores) {
      x = 50;
      doc.rect(x, currentY, pageWidth, rowHeight).stroke();
      doc.text(score.category, x + 5, currentY + 5, { width: colWidths[0] - 10 });
      x += colWidths[0];
      doc.text(String(score.score), x + 5, currentY + 5, { width: colWidths[1] - 10 });
      x += colWidths[1];
      doc.text(String(score.maxScore), x + 5, currentY + 5, { width: colWidths[2] - 10 });
      x += colWidths[2];
      doc.text(score.comment ?? '', x + 5, currentY + 5, { width: colWidths[3] - 10 });
      currentY += rowHeight;
    }

    doc.y = currentY + 10;
  }

  private getSeverityLabel(severity: string): string {
    switch (severity) {
      case 'critical':
        return '严重';
      case 'high':
        return '高';
      case 'medium':
        return '中';
      case 'low':
        return '低';
      default:
        return severity;
    }
  }

  private getRectificationStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending_issue: '待下发',
      pending_claim: '待认领',
      in_progress: '整改中',
      pending_acceptance: '待验收',
      completed: '已完成',
      delayed: '已逾期',
      closed: '已关闭',
    };
    return labels[status] ?? status;
  }
}
