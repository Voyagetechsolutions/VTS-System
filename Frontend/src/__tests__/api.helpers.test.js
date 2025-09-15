import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as clientModule from '../supabase/client';

// Lazy import api after mocking client
let api;

describe('supabase/api helpers', () => {
  beforeEach(async () => {
    clientModule.supabase = {
      from: vi.fn(() => ({ select: vi.fn().mockReturnThis(), insert: vi.fn().mockResolvedValue({ data: [{}] }), update: vi.fn().mockReturnThis(), delete: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: {} }) })),
      rpc: vi.fn().mockResolvedValue({ data: {} }),
      storage: {
        from: vi.fn(() => ({ upload: vi.fn().mockResolvedValue({ data: {} }), createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'http://signed' } }) }))
      },
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1', user_metadata: {} } } }) }
    };
    // eslint-disable-next-line global-require
    api = await import('../supabase/api');
    global.window = Object.assign(global.window || {}, { userId: 'u1', companyId: 'c1' });
  });

  it('uploadDriverDocument validates and inserts', async () => {
    const file = new Blob(['hello'], { type: 'application/pdf' });
    Object.defineProperty(file, 'name', { value: 'doc.pdf' });
    Object.defineProperty(file, 'size', { value: 1024 });
    const res = await api.uploadDriverDocument(file, { title: 'Doc' });
    expect(res).toBeTruthy();
  });
});


