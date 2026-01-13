/**
 * MSW Handlers - Mock API responses
 * Issue #245: Testing Infrastructure
 */

import { http, HttpResponse } from 'msw';
import { mockAuthResponse, mockPost, generateMockPosts } from './data';

const API_URL = 'http://localhost:5000/api';

export const handlers = [
  // Auth endpoints
  http.post(`${API_URL}/auth/register`, () => {
    return HttpResponse.json(mockAuthResponse());
  }),

  http.post(`${API_URL}/auth/login`, () => {
    return HttpResponse.json(mockAuthResponse());
  }),

  http.get(`${API_URL}/auth/me`, () => {
    return HttpResponse.json(mockAuthResponse().user);
  }),

  // Posts endpoints
  http.get(`${API_URL}/posts`, () => {
    return HttpResponse.json(generateMockPosts(10));
  }),

  http.get(`${API_URL}/posts/:id`, ({ params }) => {
    return HttpResponse.json(mockPost({ id: params.id }));
  }),

  http.post(`${API_URL}/posts`, () => {
    return HttpResponse.json(mockPost(), { status: 201 });
  }),

  http.put(`${API_URL}/posts/:id`, ({ params }) => {
    return HttpResponse.json(mockPost({ id: params.id }));
  }),

  http.delete(`${API_URL}/posts/:id`, () => {
    return HttpResponse.json({ message: 'Post deleted' });
  }),

  // Likes
  http.post(`${API_URL}/posts/:id/like`, ({ params }) => {
    return HttpResponse.json({ postId: params.id, liked: true });
  }),

  // Comments
  http.get(`${API_URL}/posts/:id/comments`, () => {
    return HttpResponse.json([]);
  }),

  http.post(`${API_URL}/posts/:id/comments`, () => {
    return HttpResponse.json({ message: 'Comment added' }, { status: 201 });
  }),
];
