import * as z from 'zod';
import { type TStoredStateSchema, schema } from './schema';
import type { TResult } from '../../types/storage';
import { SAVE_VERSION } from './constants';

const versionSchema = z.object({ version: z.number().int() }).passthrough();

export const validateStoredState = (state: unknown): TResult<TStoredStateSchema, string> => {
  const versionPayload = versionSchema.safeParse(state);

  if (!versionPayload.success) {
    console.error(versionPayload.error);
    return { success: false, data: null, error: 'Unable to load save file' };
  }

  if (versionPayload.data.version !== SAVE_VERSION)
    return {
      success: false,
      data: null,
      error: `Save version mismatch. Found: v${versionPayload.data.version} Expected: v${SAVE_VERSION}`,
    };

  const payload = schema.safeParse(state);

  if (payload.success) {
    return { success: true, data: payload.data, error: null };
  } else {
    console.error(payload.error);
    return { success: false, data: null, error: 'Unable to load save file' };
  }
};
