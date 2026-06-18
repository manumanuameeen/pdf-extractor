import type { PdfRecord, UserRecord } from '../types/models.js';

export interface IRepository<TRecord extends { id: string }> {
  findAll(): Promise<TRecord[]>;
  findById(id: string): Promise<TRecord | null>;
  save(record: TRecord): Promise<TRecord>;
}

export interface IUserRepository extends IRepository<UserRecord> {
  findByEmail(email: string): Promise<UserRecord | null>;
  findByRefreshToken(refreshToken: string): Promise<UserRecord | null>;
}

export interface IPdfRepository extends IRepository<PdfRecord> {
  findOwnedByUser(id: string, userId: string): Promise<PdfRecord | null>;
  findByUserId(userId: string): Promise<PdfRecord[]>;
  delete(id: string): Promise<boolean>;
}
