const GEMINI_SCHEMA_KEYS = new Set([
  "type",
  "format",
  "description",
  "items",
  "properties",
  "required",
  "enum",
  "example",
  "nullable",
]);

export function sanitizeGeminiResponseSchema(schema) {
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
    return schema;
  }

  const sanitized = {};
  Object.entries(schema).forEach(([key, value]) => {
    if (!GEMINI_SCHEMA_KEYS.has(key) || value === undefined) return;

    if (key === "properties") {
      sanitized.properties = Object.fromEntries(
        Object.entries(value || {}).map(([name, propertySchema]) => [
          name,
          sanitizeGeminiResponseSchema(propertySchema),
        ]),
      );
      return;
    }

    if (key === "items") {
      sanitized.items = sanitizeGeminiResponseSchema(value);
      return;
    }

    if (key === "enum") {
      // Gemini rejects the entire request when any enum member is empty.
      // Dropping the enum preserves generation while local validation keeps
      // enforcing the field's actual contract.
      if (
        Array.isArray(value) &&
        value.length > 0 &&
        value.every((entry) => typeof entry === "string" && entry.length > 0)
      ) {
        sanitized.enum = [...value];
      }
      return;
    }

    sanitized[key] = Array.isArray(value) ? [...value] : value;
  });

  return sanitized;
}
