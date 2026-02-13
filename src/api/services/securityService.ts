import api from '../client';
import type {
  UpdateSecurityRequest,
  UpdateSecurityResponse,
} from '@/types/api';

export const securityService = {
  /**
   * Update security settings (PATCH /me/security)
   * Used for changing email or password
   */
  updateSecurity: async (data: UpdateSecurityRequest): Promise<UpdateSecurityResponse> => {
    return api.patch<UpdateSecurityResponse>('/me/security', data);
  },
};

export default securityService;
