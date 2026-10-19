// Public OAuth client ID for Google Sign-In. Override it with VITE_GOOGLE_CLIENT_ID,
// and set the same value as GOOGLE_CLIENT_ID for the API so it can verify tokens.
export const GOOGLE_CLIENT_ID = String(
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    '418023364772-mdn0alhu6g5dlqbtarhqfp93jvi5robt.apps.googleusercontent.com',
).trim();
