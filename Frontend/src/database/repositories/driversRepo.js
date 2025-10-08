// Drivers repository: thin wrappers around Supabase API functions
import { getDrivers as apiGetDrivers,
         listTripSchedules as apiListTripSchedules,
         listDriverTraining as apiListDriverTraining,
         upsertDriverTraining as apiUpsertDriverTraining,
         listDriverKPIs as apiListDriverKPIs,
         listDriverShifts as apiListDriverShifts,
         upsertDriverShift as apiUpsertDriverShift } from '../../supabase/api';

export const getDrivers = () => apiGetDrivers();
export const listTripSchedules = () => apiListTripSchedules();
export const listDriverTraining = () => apiListDriverTraining();
export const upsertDriverTraining = (row) => apiUpsertDriverTraining(row);
export const listDriverKPIs = () => apiListDriverKPIs();
export const listDriverShifts = () => apiListDriverShifts();
export const upsertDriverShift = (row) => apiUpsertDriverShift(row);
