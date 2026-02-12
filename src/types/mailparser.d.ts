declare module "mailparser" {
  interface ParsedAddress {
    text?: string | null;
  }

  export interface ParsedMail {
    messageId?: string | null;
    inReplyTo?: unknown;
    references?: unknown;
    from?: ParsedAddress | null;
    subject?: string | null;
    text?: string | null;
    html?: string | boolean | null;
    date?: Date | null;
  }

  export function simpleParser(source: string | Buffer): Promise<ParsedMail>;
}
