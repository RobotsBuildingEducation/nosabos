export function isNsecSecretKeyLike(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .startsWith("nsec1");
}
