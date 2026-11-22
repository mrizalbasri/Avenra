import { ApiError } from '#lib/errors.js';
import type { Curriculum, Alternative, SolveResult } from '#lib/types.js';
import { lookup, type Locale, type Params } from './index.js';

// A backend message: `code` and `params` drive the translation; `message` is the
// English text the API also sends, used when no translation exists.
export type Coded = {
  code?: string;
  rule?: string;
  params?: Record<string, unknown>;
  message: string;
};
export type MessageKind =
  'finding' | 'diag' | 'suggest' | 'solve' | 'advisor' | 'assume' | 'error';

const ips = (value: unknown) =>
  typeof value === 'number' ? value.toFixed(2) : String(value);

export function createMessages(locale: () => Locale) {
  const say = (key: string, params: Params = {}) =>
    lookup(locale(), key, params);
  const orList = (items: unknown[]) =>
    items.map(String).join(say('list.or') ?? ' or ');

  // Turns raw API params into the strings a sentence needs.
  function prepare(params: Record<string, unknown>): Params {
    const out: Params = {};
    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === undefined) continue;
      if (key === 'gpa') out[key] = ips(value);
      else if (key === 'options' && Array.isArray(value))
        out[key] = orList(value);
      else if (key === 'chain' && Array.isArray(value))
        out[key] = value.join(' | ');
      else if (key === 'parity')
        out[key] = say(`parity.${value}`) ?? String(value);
      else if (key === 'reason')
        out[key] =
          say(`cap.${value}`, { gpa: ips(params.gpa) }) ?? String(value);
      else if (key === 'rules' && Array.isArray(value))
        out.names = value
          .map((rule) => (say(`rule.${rule}`) ?? String(rule)).toLowerCase())
          .sort()
          .join(', ');
      else if (key === 'issues' && Array.isArray(value))
        out[key] = value
          .map((issue: { course: string; missing: unknown[] }) =>
            say('error.issue', {
              course: issue.course,
              missing: issue.missing
                .map((m) => (Array.isArray(m) ? orList(m) : String(m)))
                .join(', '),
            }),
          )
          .join('; ');
      else if (typeof value === 'number' || typeof value === 'string')
        out[key] = value;
    }
    return out;
  }

  function describe(kind: MessageKind, item: Coded): string {
    const code = item.code ?? item.rule;
    if (!code) return item.message;
    return say(`${kind}.${code}`, prepare(item.params ?? {})) ?? item.message;
  }

  return {
    describe,
    ruleLabel: (rule: string) =>
      say(`rule.${rule}`) ?? rule.replaceAll('_', ' '),
    errorText(error: unknown): string {
      if (error instanceof ApiError && error.code)
        return describe('error', {
          code: error.code,
          params: error.params,
          message: error.message,
        });
      return error instanceof Error ? error.message : String(error);
    },
    solveText(result: SolveResult): string {
      if (result.code === 'FOUND') {
        const note = result.params?.note;
        const base = say('solve.FOUND', {
          count: Number(result.params?.count),
        });
        const extra = note ? say(`solve.note.${note}`) : '';
        if (base) return base + (extra ?? '');
      }
      return describe('solve', { ...result, message: result.message });
    },
    altName: (alt: Alternative) => say(`alt.${alt.name_code}`) ?? alt.name,
    altSummary(alt: Alternative): string {
      const items = alt.summary_items;
      if (!items?.length) return alt.summary;
      const parts = items.map((item) => {
        const p = item.params;
        if (item.code === 'ALT_SUMMARY')
          return say('alt.summary', {
            finish: Number(p.finish),
            peak: Number(p.peak),
          });
        const later = Number(p.later);
        const lighter = Number(p.lighter);
        const timing =
          later > 0
            ? say('alt.later', { count: later })
            : later === 0
              ? say('alt.same_time')
              : say('alt.earlier', { count: -later });
        const load =
          lighter > 0
            ? say('alt.lighter', { count: lighter })
            : lighter === 0
              ? say('alt.same_load')
              : say('alt.heavier', { count: -lighter });
        return say('alt.compare', {
          against: say(`alt.${p.against}`) ?? String(p.against),
          timing: timing ?? '',
          load: load ?? '',
        });
      });
      return parts.every((part) => part !== null)
        ? parts.join('')
        : alt.summary;
    },
    // The English demo and import disclaimers have translations; any other text is data.
    disclaimer(curriculum: Pick<Curriculum, 'status' | 'disclaimer'>): string {
      if (locale() === 'en') return curriculum.disclaimer;
      return say(`disclaimer.${curriculum.status}`) ?? curriculum.disclaimer;
    },
  };
}
export type Messages = ReturnType<typeof createMessages>;
