// Section names were authored in uppercase for the former numbered labels.
export function landingSectionLabel(label, locale) {
  if (label !== label.toLocaleUpperCase(locale)) return label;
  return label.slice(0, 1) + label.slice(1).toLocaleLowerCase(locale);
}
