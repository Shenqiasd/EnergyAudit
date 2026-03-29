import { Controller, Get, Param, Res } from '@nestjs/common';
import type { FastifyReply } from 'fastify';

import { Roles } from '../auth/roles.decorator';
import { PdfGeneratorService } from './pdf-generator.service';

@Roles('enterprise_user', 'manager', 'reviewer')
@Controller()
export class ReportExportController {
  constructor(
    private readonly pdfGenerator: PdfGeneratorService,
  ) {}

  @Get('reports/:id/export/pdf')
  async exportReportPdf(
    @Param('id') id: string,
    @Res() reply: FastifyReply,
  ) {
    const buffer = await this.pdfGenerator.generateReportPdf(id);

    reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename="report-${id}.pdf"`)
      .send(buffer);
  }

  @Get('reports/:id/export/docx')
  async exportReportDocx(
    @Param('id') id: string,
    @Res() reply: FastifyReply,
  ) {
    const buffer = await this.pdfGenerator.generateReportDocx(id);

    reply
      .header(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      )
      .header('Content-Disposition', `attachment; filename="report-${id}.docx"`)
      .send(buffer);
  }

  @Get('reviews/:id/export/pdf')
  async exportReviewPdf(
    @Param('id') id: string,
    @Res() reply: FastifyReply,
  ) {
    const buffer = await this.pdfGenerator.generateReviewReport(id);

    reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename="review-${id}.pdf"`)
      .send(buffer);
  }

  @Get('rectifications/:id/export/pdf')
  async exportRectificationPdf(
    @Param('id') id: string,
    @Res() reply: FastifyReply,
  ) {
    const buffer = await this.pdfGenerator.generateRectificationReport(id);

    reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename="rectification-${id}.pdf"`)
      .send(buffer);
  }
}
