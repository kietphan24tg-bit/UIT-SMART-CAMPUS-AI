import type { UserProfile } from '@smart-campus/shared';

import { apiClient } from './client';

export const usersApi = {
  getProfile: async (): Promise<UserProfile> => {
    return apiClient.get('/users/me');
  },

  uploadAvatar: async (uri: string, fileName = 'avatar.jpg', mimeType = 'image/jpeg') => {
    const formData = new FormData();
    formData.append('avatar', {
      uri,
      name: fileName,
      type: mimeType,
    } as unknown as Blob);

    return apiClient.post('/users/me/avatar', formData) as Promise<UserProfile>;
  },
};
