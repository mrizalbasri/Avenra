import type { Locale } from '#lib/i18n/index.js';
import type { Course, Goal } from '#lib/types.js';

export type AnnouncementWarning = 'NO_TARGET' | 'NO_DUE_DATE';

export type ParsedAnnouncement = {
  course_code: string | null;
  goal_id: string | null;
  title: string;
  due_date: string | null;
  due_time: string | null;
  start_date: string;
  first_step: string;
  details: string[];
  warnings: AnnouncementWarning[];
};

const MONTHS: Record<string, number> = {
  jan: 1,
  january: 1,
  januari: 1,
  feb: 2,
  february: 2,
  februari: 2,
  mar: 3,
  march: 3,
  maret: 3,
  apr: 4,
  april: 4,
  may: 5,
  mei: 5,
  jun: 6,
  june: 6,
  juni: 6,
  jul: 7,
  july: 7,
  juli: 7,
  aug: 8,
  august: 8,
  agu: 8,
  agustus: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  okt: 10,
  oktober: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
  des: 12,
  desember: 12,
};

const WEEKDAYS: Record<string, number> = {
  minggu: 0,
  ahad: 0,
  sunday: 0,
  sun: 0,
  senin: 1,
  monday: 1,
  mon: 1,
  selasa: 2,
  tuesday: 2,
  tue: 2,
  rabu: 3,
  wednesday: 3,
  wed: 3,
  kamis: 4,
  thursday: 4,
  thu: 4,
  jumat: 5,
  "jum'at": 5,
  friday: 5,
  fri: 5,
  sabtu: 6,
  saturday: 6,
  sat: 6,
};

const toIso = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const addDays = (base: Date, days: number) => {
  const next = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  next.setDate(next.getDate() + days);
  return next;
};

const validDate = (year: number, month: number, day: number) => {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const candidate = new Date(year, month - 1, day);
  if (
    candidate.getFullYear() !== year ||
    candidate.getMonth() !== month - 1 ||
    candidate.getDate() !== day
  )
    return null;
  return candidate;
};

function resolveYear(month: number, day: number, today: Date): Date | null {
  const sameYear = validDate(today.getFullYear(), month, day);
  if (!sameYear) return null;
  // If that month/day already passed more than 30 days ago, assume next year.
  const cutoff = addDays(today, -30);
  if (sameYear < cutoff) {
    return validDate(today.getFullYear() + 1, month, day) ?? sameYear;
  }
  return sameYear;
}

function extractDueDate(text: string, today: Date): string | null {
  // 1. ISO YYYY-MM-DD
  const iso = text.match(/\b(20\d{2})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\b/);
  if (iso) {
    const parsed = validDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));
    if (parsed) return toIso(parsed);
  }

  // 2. DD/MM/YYYY or DD-MM-YYYY
  const dmy = text.match(/\b([0-3]?\d)[/-]([0-1]?\d)[/-](20\d{2})\b/);
  if (dmy) {
    const parsed = validDate(Number(dmy[3]), Number(dmy[2]), Number(dmy[1]));
    if (parsed) return toIso(parsed);
  }

  // 3. "3 Des 2026" / "3 Desember" / "15 Oct"
  const monthNames = Object.keys(MONTHS).join('|');
  const dayMonth = text.match(
    new RegExp(`\\b([0-3]?\\d)\\s+(${monthNames})(?:\\s+(20\\d{2}))?\\b`, 'i'),
  );
  if (dayMonth) {
    const day = Number(dayMonth[1]);
    const month = MONTHS[dayMonth[2].toLowerCase()];
    const parsed = dayMonth[3]
      ? validDate(Number(dayMonth[3]), month, day)
      : resolveYear(month, day, today);
    if (parsed) return toIso(parsed);
  }

  // 4. "Dec 3, 2026" / "December 3"
  const monthDay = text.match(
    new RegExp(
      `\\b(${monthNames})\\s+([0-3]?\\d)(?:,?\\s+(20\\d{2}))?\\b`,
      'i',
    ),
  );
  if (monthDay) {
    const month = MONTHS[monthDay[1].toLowerCase()];
    const day = Number(monthDay[2]);
    const parsed = monthDay[3]
      ? validDate(Number(monthDay[3]), month, day)
      : resolveYear(month, day, today);
    if (parsed) return toIso(parsed);
  }

  // 5. Relative words: hari ini / today / besok / tomorrow / lusa
  const lower = text.toLowerCase();
  if (/\b(hari ini|today)\b/.test(lower)) return toIso(today);
  if (/\b(besok|tomorrow)\b/.test(lower)) return toIso(addDays(today, 1));
  if (/\blusa\b/.test(lower)) return toIso(addDays(today, 2));

  // 6. Upcoming weekday names (Senin..Minggu, Monday..Sunday).
  // Avoid matching Indonesian "minggu ini / depan / lalu / ke-N" ("week") as Sunday.
  const dayPattern = new RegExp(
    `\\b(${Object.keys(WEEKDAYS).join('|')})\\b(?!\\s+(?:ini|depan|lalu|berikutnya|ke\\b|ke-\\d|\\d))`,
    'i',
  );
  const weekdayMatch = lower.match(dayPattern);
  if (weekdayMatch) {
    const target = WEEKDAYS[weekdayMatch[1]];
    const diff = (target - today.getDay() + 7) % 7 || 7;
    return toIso(addDays(today, diff));
  }

  return null;
}

function extractTime(text: string): string | null {
  const explicit = text.match(
    /\b(?:pukul|jam|at|by|before|sebelum)?\s*([01]?\d|2[0-3])[:.]([0-5]\d)\s*(wib|wita|wit|am|pm)?\b/i,
  );
  if (explicit) {
    const hh = explicit[1].padStart(2, '0');
    const mm = explicit[2];
    const suffix = explicit[3] ? ` ${explicit[3].toUpperCase()}` : '';
    return `${hh}:${mm}${suffix}`;
  }
  const ampm = text.match(/\b(1[0-2]|[1-9])\s*(am|pm)\b/i);
  if (ampm) return `${ampm[1]}:00 ${ampm[2].toUpperCase()}`;
  return null;
}

function matchTarget(
  text: string,
  courses: Course[],
  goals: Goal[],
): { course_code: string | null; goal_id: string | null } {
  const upper = text.toUpperCase();
  // Exact course code match first (strongest signal).
  for (const course of courses) {
    const escaped = course.code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${escaped}\\b`, 'i').test(upper)) {
      return { course_code: course.code, goal_id: null };
    }
  }
  const lower = text.toLowerCase();
  // Match full course name (longest first to prefer specific names).
  const byNameLength = [...courses].sort(
    (a, b) => b.name.length - a.name.length,
  );
  for (const course of byNameLength) {
    if (course.name.length >= 4 && lower.includes(course.name.toLowerCase())) {
      return { course_code: course.code, goal_id: null };
    }
  }
  // Match goal title (e.g. BEM, Magang, Internship).
  const goalsByLength = [...goals].sort(
    (a, b) => b.title.length - a.title.length,
  );
  for (const goal of goalsByLength) {
    const escaped = goal.title.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (
      goal.title.trim().length >= 2 &&
      new RegExp(`\\b${escaped}\\b`, 'i').test(text)
    ) {
      return { course_code: null, goal_id: goal.id };
    }
  }
  return { course_code: null, goal_id: null };
}

function extractTitle(text: string): string {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const firstLine = (lines[0] ?? text.trim())
    .replace(
      /^(?:\[[^\]]+\]\s*|(?:pengumuman|info|informasi|announcement|reminder|pengingat|perhatian)\s*[:\-–]\s*)+/i,
      '',
    )
    .trim();
  const sentence = firstLine.split(/(?<=[.!?])\s+/)[0] ?? firstLine;
  const cleaned = sentence.replace(/[.]+$/, '').trim();
  if (cleaned.length <= 120) return cleaned || text.trim().slice(0, 120);
  return cleaned.slice(0, 117).trimEnd() + '…';
}

function extractDetails(
  text: string,
  dueTime: string | null,
  locale: Locale,
): string[] {
  const details: string[] = [];
  const add = (item: string) => {
    const trimmed = item.trim().replace(/\s+/g, ' ');
    if (!trimmed || trimmed.length > 160) return;
    if (
      !details.some(
        (existing) => existing.toLowerCase() === trimmed.toLowerCase(),
      )
    ) {
      details.push(trimmed);
    }
  };

  // Explicit bullet or numbered lines from the announcement.
  const lines = text.split(/\r?\n/).map((line) => line.trim());
  for (const line of lines) {
    const bullet = line.match(/^(?:[-•*]|\d+[.)])\s+(.+)$/);
    if (bullet) add(bullet[1]);
  }

  // Highlight cutoff time so students don't miss the submission hour.
  if (dueTime) {
    add(
      locale === 'id'
        ? `Batas jam pengumpulan: ${dueTime}`
        : `Submission cutoff: ${dueTime}`,
    );
  }

  // Highlight file formats and submission channels mentioned in prose.
  const formats = [
    ...new Set(
      (
        text.match(
          /\b(PDF|DOCX?|PPTX?|ZIP|RAR|CSV|SQL|IPYNB|GitHub|Google Drive|Google Classroom|LMS|e-learning|E-Learning)\b/gi,
        ) ?? []
      ).map((token) => (token.length <= 5 ? token.toUpperCase() : token)),
    ),
  ];
  if (formats.length && details.length < 6) {
    const listed = formats.join(', ');
    if (
      !details.some((d) =>
        formats.every((f) => d.toLowerCase().includes(f.toLowerCase())),
      )
    ) {
      add(
        locale === 'id'
          ? `Format / kanal: ${listed}`
          : `Format / channel: ${listed}`,
      );
    }
  }

  // Highlight group vs individual requirement if stated.
  if (/\b(kelompok|tim|group|pair|berpasangan)\b/i.test(text)) {
    add(
      locale === 'id'
        ? 'Tugas kelompok | pastikan pembagian peran sejak awal'
        : 'Group task | align roles early',
    );
  } else if (/\b(individu|mandiri|individual)\b/i.test(text)) {
    add(
      locale === 'id' ? 'Dikerjakan secara individu' : 'Individual submission',
    );
  }

  return details.slice(0, 6);
}

function suggestStartDate(dueIso: string | null, today: Date): string {
  const todayIso = toIso(today);
  if (!dueIso) return todayIso;
  const [y, m, d] = dueIso.split('-').map(Number);
  const due = new Date(y, m - 1, d);
  const lead = addDays(due, -2);
  if (lead <= today) return due < today ? dueIso : todayIso;
  return toIso(lead);
}

function suggestFirstStep(text: string, locale: Locale): string {
  const lower = text.toLowerCase();
  if (
    /\b(kode|code|program|implementasi|python|java|sql|github|coding|algoritma|script|repo)\b/.test(
      lower,
    )
  ) {
    return locale === 'id'
      ? 'Buka editor/repo, buat berkas awal, dan tulis kerangka fungsi pertama (10 menit).'
      : 'Open your editor/repo, create the starter file, and sketch the first function (10 min).';
  }
  if (
    /\b(laporan|makalah|essay|esai|proposal|paper|report|dokumen|presentasi|slide|ppt)\b/.test(
      lower,
    )
  ) {
    return locale === 'id'
      ? 'Buat dokumen baru dan tulis 3 poin kerangka utama (10 menit).'
      : 'Create a blank document and write 3 main outline points (10 min).';
  }
  if (
    /\b(kuis|quiz|ujian|exam|uts|uas|latihan|soal|exercise|review)\b/.test(
      lower,
    )
  ) {
    return locale === 'id'
      ? 'Buka catatan bab terkait dan kerjakan 2 soal pertama dulu (10 menit).'
      : 'Open the chapter notes and solve the first 2 practice problems (10 min).';
  }
  return locale === 'id'
    ? 'Baca instruksi tugas, cek syarat pengumpulan, lalu mulai bagian paling kecil selama 10 menit.'
    : 'Read the prompt, check submission requirements, and start the smallest piece for 10 min.';
}

export function parseAnnouncement(
  rawText: string,
  courses: Course[],
  goals: Goal[],
  today = new Date(),
  locale: Locale = 'en',
): ParsedAnnouncement {
  const cleaned = rawText.trim();
  const target = matchTarget(cleaned, courses, goals);
  const due_date = extractDueDate(cleaned, today);
  const due_time = extractTime(cleaned);
  const title = extractTitle(cleaned);
  const details = extractDetails(cleaned, due_time, locale);
  const start_date = suggestStartDate(due_date, today);
  const first_step = suggestFirstStep(cleaned, locale);
  const warnings: AnnouncementWarning[] = [];
  if (!target.course_code && !target.goal_id) warnings.push('NO_TARGET');
  if (!due_date) warnings.push('NO_DUE_DATE');

  return {
    ...target,
    title,
    due_date,
    due_time,
    start_date,
    first_step,
    details,
    warnings,
  };
}
