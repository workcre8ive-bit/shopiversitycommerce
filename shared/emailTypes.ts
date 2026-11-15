export type EmailRecipientCategory = "buyer" | "seller" | "logistics";

export type EmailClassification = "transactional" | "marketing";

export interface EmailDetailRow {
  label: string;
  valueTemplate: string;
  hideIfEmptyVar?: string;
}

export interface EmailTemplateDefinition {
  id: string;
  code: string; // e.g. B-01, S-11, L-19
  name: string;
  recipientCategory: EmailRecipientCategory;
  section: string;
  classification: EmailClassification;
  subjectTemplate: string;
  previewTextTemplate: string;
  badgeLabel: string;
  badgeColor: string;
  heroTitleTemplate: string;
  greetingTemplate: string;
  bodyParagraphs: string[];
  detailRows: EmailDetailRow[];
  highlightPinVar?: string;
  highlightPinLabel?: string;
  ctaLabel: string;
  ctaUrlTemplate: string;
  triggerEvent: string;
  requiredVariables: string[];
  sendingConditions: string;
  recommendedSchedule: string;
}

export type EmailVariableMap = Record<string, string | number | undefined | null>;
