// Users repository: thin wrappers around Supabase API functions
import { getCompanyUsers as apiGetCompanyUsers,
         createUser as apiCreateUser,
         updateUser as apiUpdateUser,
         deleteUser as apiDeleteUser,
         getBranches as apiGetBranches } from '../../supabase/api';

export const getCompanyUsers = (companyId) => apiGetCompanyUsers(companyId);
export const createUser = (payload) => apiCreateUser(payload);
export const updateUser = (userId, updates) => apiUpdateUser(userId, updates);
export const deleteUser = (userId) => apiDeleteUser(userId);
export const getBranches = () => apiGetBranches();
