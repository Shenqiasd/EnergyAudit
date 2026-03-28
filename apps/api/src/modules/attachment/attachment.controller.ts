import {
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';

import { AttachmentService } from './attachment.service';

import type { FastifyRequest } from 'fastify';

@Controller('attachments')
export class AttachmentController {
  constructor(private readonly attachmentService: AttachmentService) {}

  @Post()
  async upload(@Req() request: FastifyRequest) {
    const body = request.body as Record<string, unknown> | undefined;

    if (!body) {
      throw new HttpException('请求体不能为空', HttpStatus.BAD_REQUEST);
    }

    const ownerType = body.ownerType as string | undefined;
    const ownerId = body.ownerId as string | undefined;
    const fileName = body.fileName as string | undefined;
    const mimeType = (body.mimeType as string | undefined) ?? 'application/octet-stream';
    const uploadedBy = body.uploadedBy as string | undefined;
    const fileData = body.fileData as string | undefined;

    if (!ownerType || !ownerId || !fileName || !uploadedBy) {
      throw new HttpException('缺少必要参数 (ownerType, ownerId, fileName, uploadedBy)', HttpStatus.BAD_REQUEST);
    }

    const data = fileData ? Buffer.from(fileData, 'base64') : Buffer.alloc(0);

    return this.attachmentService.upload({
      ownerType,
      ownerId,
      fileName,
      fileSize: data.length,
      mimeType,
      uploadedBy,
      data,
    });
  }

  @Get(':id')
  async download(@Param('id') id: string) {
    const { attachment, data } = await this.attachmentService.download(id);
    return {
      ...attachment,
      fileData: data.toString('base64'),
    };
  }

  @Get('entity/:entityType/:entityId')
  async listByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.attachmentService.listByEntity(
      entityType,
      entityId,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
    );
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.attachmentService.delete(id);
  }
}
