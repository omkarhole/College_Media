/**
 * Mock Data Generators - Test data for comprehensive testing
 * Issue #245: Testing Infrastructure
 */

export const mockUser = (overrides = {}) => ({
  id: '1',
  username: 'testuser',
  email: 'test@example.com',
  avatar: 'https://placehold.co/100x100',
  bio: 'Test user bio',
  followers: 100,
  following: 50,
  ...overrides,
});

export const mockPost = (overrides = {}) => ({
  id: '1',
  user: mockUser(),
  media: 'https://placehold.co/500x600',
  caption: 'Test post caption',
  likes: 10,
  comments: 5,
  timestamp: new Date().toISOString(),
  isLiked: false,
  ...overrides,
});

export const mockComment = (overrides = {}) => ({
  id: '1',
  postId: '1',
  user: mockUser(),
  text: 'Test comment',
  timestamp: new Date().toISOString(),
  likes: 2,
  ...overrides,
});

export const mockAuthResponse = (overrides = {}) => ({
  token: 'mock-jwt-token',
  user: mockUser(),
  ...overrides,
});

export const generateMockPosts = (count = 5) => {
  return Array.from({ length: count }, (_, i) => mockPost({ id: String(i + 1) }));
};

export const generateMockUsers = (count = 5) => {
  return Array.from({ length: count }, (_, i) => mockUser({ id: String(i + 1), username: `user${i + 1}` }));
};
