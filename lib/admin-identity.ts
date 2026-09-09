export function isAllowedAdminEmail(email: string | null | undefined, allowedEmail: string | null | undefined) {
  return Boolean(email && allowedEmail && email.trim().toLowerCase() === allowedEmail.trim().toLowerCase());
}
