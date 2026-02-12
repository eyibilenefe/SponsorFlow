interface TemplateContext {
  contactName: string;
  contactEmail: string;
  companyName: string;
}

export function renderTemplate(template: string, context: TemplateContext): string {
  return template
    .replaceAll("{{contactName}}", context.contactName)
    .replaceAll("{{contactEmail}}", context.contactEmail)
    .replaceAll("{{companyName}}", context.companyName);
}
