export function abbreviateName(name: string) {
  const parts = name.trim().split(/\s+/);

  if (parts.length === 0) return "";

  if (parts.length === 1) {
    return parts[0];
  }

  return `${parts[0]} ${parts[1][0]}`;
}
