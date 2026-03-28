import * as fs from 'node:fs';
import * as path from 'node:path';

export interface IStorageAdapter {
  upload(key: string, data: Buffer, contentType: string): Promise<string>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expiresIn: number): Promise<string>;
}

export const STORAGE_ADAPTER = Symbol('STORAGE_ADAPTER');

export class LocalStorageAdapter implements IStorageAdapter {
  private readonly basePath: string;
  private readonly baseUrl: string;

  constructor(basePath = './uploads', baseUrl = '/uploads') {
    this.basePath = basePath;
    this.baseUrl = baseUrl;
  }

  private assertSafePath(key: string): string {
    const resolved = path.resolve(this.basePath, key);
    if (!resolved.startsWith(path.resolve(this.basePath))) {
      throw new Error('Invalid storage key: path traversal detected');
    }
    return resolved;
  }

  async upload(key: string, data: Buffer, _contentType: string): Promise<string> {
    const filePath = this.assertSafePath(key);
    const dir = path.dirname(filePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, data);
    return `${this.baseUrl}/${key}`;
  }

  async download(key: string): Promise<Buffer> {
    const filePath = this.assertSafePath(key);

    if (!fs.existsSync(filePath)) {
      throw new Error(`文件不存在: ${key}`);
    }

    return fs.readFileSync(filePath);
  }

  async delete(key: string): Promise<void> {
    const filePath = this.assertSafePath(key);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  async getSignedUrl(key: string, expiresIn: number): Promise<string> {
    const expiry = Date.now() + expiresIn * 1000;
    return `${this.baseUrl}/${key}?expires=${expiry}&sig=local-dev-signature`;
  }
}
