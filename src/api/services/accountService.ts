import api from '../client';
import type {
  Account,
  CreateAccountRequest,
  UpdateAccountRequest,
  UpdateAccountResponse,
  DeleteAccountResponse,
} from '@/types/api';

export const accountService = {
  /**
   * Get the current user's account
   */
  getAccount: async (): Promise<Account> => {
    return api.get<Account>('/account');
  },

  /**
   * Create a new account (post-registration setup)
   */
  createAccount: async (data: CreateAccountRequest): Promise<Account> => {
    return api.post<Account>('/account', data);
  },

  /**
   * Update the current user's account
   */
  updateAccount: async (data: UpdateAccountRequest): Promise<UpdateAccountResponse> => {
    return api.patch<UpdateAccountResponse>('/account', data);
  },

  /**
   * Delete the current user's account
   */
  deleteAccount: async (): Promise<DeleteAccountResponse> => {
    return api.delete<DeleteAccountResponse>('/account');
  },
};

export default accountService;
