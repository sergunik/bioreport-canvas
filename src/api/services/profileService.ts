import api from '../client';
import type {
  Profile,
  UpdateProfileRequest,
  UpdateProfileResponse,
} from '@/types/api';

export const profileService = {
  /**
   * Get the current user's profile (GET /me)
   */
  getProfile: async (): Promise<Profile> => {
    return api.get<Profile>('/me');
  },

  /**
   * Update the current user's profile (PATCH /me)
   */
  updateProfile: async (data: UpdateProfileRequest): Promise<UpdateProfileResponse> => {
    return api.patch<UpdateProfileResponse>('/me', data);
  },

  /**
   * Delete the current user (DELETE /me with password in body)
   */
  deleteUser: async (password: string): Promise<void> => {
    return api.delete<void>('/me', {
      data: { password },
    });
  },
};

export default profileService;
