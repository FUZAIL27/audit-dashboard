import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from './auth.service';
import { apiClient } from './axiosClient';

vi.mock('./axiosClient', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('authService.login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('posts username/password to /auth/login', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { data: { accessToken: 'tok', user: { id: '1', username: 'admin', role: 'admin' } } },
    });

    const result = await authService.login({ username: 'admin', password: 'Admin@123' });

    expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
      username: 'admin',
      password: 'Admin@123',
    });
    expect(result.user.username).toBe('admin');
  });
});

describe('authService.me', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches the current admin profile from /auth/me', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { data: { id: '1', username: 'admin', role: 'admin' } },
    });

    const result = await authService.me();

    expect(apiClient.get).toHaveBeenCalledWith('/auth/me');
    expect(result.username).toBe('admin');
  });
});

describe('authService.logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('posts to /auth/logout', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: {} });
    await authService.logout();
    expect(apiClient.post).toHaveBeenCalledWith('/auth/logout');
  });
});
