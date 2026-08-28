export function buildStrictOpenAISchema(schema) {
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
    return schema;
  }

  if (schema.type === "array") {
    return {
      ...schema,
      items: buildStrictOpenAISchema(schema.items),
    };
  }

  if (schema.type !== "object") return { ...schema };

  const properties = schema.properties || {};
  const requiredNames = Array.isArray(schema.required)
    ? schema.required.filter((name) => Object.hasOwn(properties, name))
    : Object.keys(properties);
  const strictProperties = Object.fromEntries(
    requiredNames.map((name) => [
      name,
      buildStrictOpenAISchema(properties[name]),
    ]),
  );

  return {
    ...schema,
    properties: strictProperties,
    required: requiredNames,
    additionalProperties: false,
  };
}

export function buildOpenAIResponseFormat({
  responseSchema = null,
  responseSchemaName = "structured_response",
} = {}) {
  if (!responseSchema) return { type: "text" };

  const safeName = String(responseSchemaName || "structured_response")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 64);

  return {
    type: "json_schema",
    name: safeName || "structured_response",
    description: "One renderable language-learning question.",
    schema: buildStrictOpenAISchema(responseSchema),
    strict: true,
  };
}
