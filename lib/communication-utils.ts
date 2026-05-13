export function getMentionHandle(user: { name: string; email: string }) {
  const emailHandle = user.email.split("@")[0];
  return normalizeHandle(emailHandle || user.name);
}

export function normalizeHandle(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, ".");
}
