import type { UserProfile } from '@smart-campus/shared';

import { apiClient, postMultipart } from './client';

export const usersApi = {
  getProfile: async (): Promise<UserProfile> => {
    return apiClient.get('/users/me');
  },

  uploadAvatar: async (uri: string, fileName = 'avatar.jpg', mimeType = 'image/jpeg') => {
    return postMultipart<UserProfile>('/users/me/avatar', {
      fieldName: 'avatar',
      uri,
      fileName,
      mimeType,
    });
  },
};
