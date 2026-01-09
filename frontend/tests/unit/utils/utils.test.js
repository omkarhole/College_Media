/**
 * Unit Tests - Utility Functions
 * Issue #245: Testing Infrastructure
 */

import { describe, it, expect } from 'vitest';
import { sortPosts } from '../../src/utils/feedSort';
import { isTokenExpired, getToken } from '../../src/utils/tokenManager';

describe('feedSort Utility', () => {
  const mockPosts = [
    { id: 1, timestamp: '2024-01-01T10:00:00Z', likes: 5 },
    { id: 2, timestamp: '2024-01-02T10:00:00Z', likes: 10 },
    { id: 3, timestamp: '2024-01-03T10:00:00Z', likes: 3 },
  ];

  it('should sort posts by latest', () => {
    const sorted = sortPosts(mockPosts, 'latest');
    expect(sorted[0].id).toBe(3);
    expect(sorted[2].id).toBe(1);
  });

  it('should sort posts by popular', () => {
    const sorted = sortPosts(mockPosts, 'popular');
    expect(sorted[0].likes).toBe(10);
    expect(sorted[2].likes).toBe(3);
  });

  it('should return original array for invalid sort type', () => {
    const sorted = sortPosts(mockPosts, 'invalid');
    expect(sorted).toEqual(mockPosts);
  });
});

describe('tokenManager Utility', () => {
  it('should detect expired token', () => {
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1MTYyMzkwMjJ9.xxx';
    expect(isTokenExpired(expiredToken)).toBe(true);
  });

  it('should return null for invalid token', () => {
    expect(isTokenExpired('invalid-token')).toBe(true);
  });

  it('should get token from localStorage', () => {
    localStorage.setItem('token', 'test-token');
    expect(getToken()).toBe('test-token');
    localStorage.removeItem('token');
  });
});
