import type { MessageKey } from './en.js';
import { idPlan } from './id-plan.js';

// Typed against English keys: a missing or extra key fails `pnpm check`.
export const id: Record<MessageKey, string> = {
  ...idPlan,
  'lang.label': 'Bahasa',

  'nav.main': 'Navigasi utama',
  'nav.overview': 'Ringkasan',
  'nav.overview.short': 'Ringkasan',
  'nav.plans': 'Rencana studi',
  'nav.plans.short': 'Rencana',
  'nav.compare': 'Bandingkan rencana',
  'nav.compare.short': 'Bandingkan',
  'nav.study': 'Belajar & fokus',
  'nav.study.short': 'Belajar',
  'nav.profile': 'Profil akademik',
  'nav.profile.short': 'Profil',

  'sidebar.about': 'Tentang Avenra',
  'sidebar.methodology': 'Aturan & metodologi',
  'sidebar.workspace': 'Workspace Anda',
  'sidebar.identity.synthetic': 'Prototipe lokal | Data sintetis',
  'sidebar.identity.own': 'Prototipe lokal | Kurikulum Anda',

  'topbar.connected': 'Workspace terhubung',
  'topbar.unavailable': 'Workspace tidak tersedia',
  'topbar.demo': 'DEMO',
  'layout.retry': 'Coba sambungkan lagi',

  'overview.title': 'Avenra | Ruang akademik Anda',
  'overview.eyebrow': 'Prospek kelulusan',
  'overview.headline.loading': 'Memeriksa prospek kelulusan Anda…',
  'overview.headline.unknown': 'Buat semester berikutnya berarti.',
  'overview.headline.on_track': 'Sesuai jalur untuk semester {term}.',
  'overview.headline.late': 'Menuju semester {term}.',
  'overview.headline.unresolved':
    'Belum ada rencana yang muat dalam masa studi.',
  'overview.sub.loading':
    'Membandingkan rencana tersimpan Anda dengan aturan kurikulum.',
  'overview.sub.unknown':
    'Prospek belum bisa dipastikan tepat waktu. Rencana Anda tersimpan; buka salah satunya untuk memeriksa.',
  'overview.sub.unresolved':
    'Buka rencana Anda untuk melihat aturan yang menghalangi dan perubahan terkecil yang membantu.',
  'overview.sub.basis.plan': 'Rencana tersimpan Anda',
  'overview.sub.basis.fix.one':
    'Rencana tersimpan Anda punya {count} pemeriksaan aturan yang perlu diperbaiki, jadi ini estimasi selesai paling awal',
  'overview.sub.basis.fix.other':
    'Rencana tersimpan Anda punya {count} pemeriksaan aturan yang perlu diperbaiki, jadi ini estimasi selesai paling awal',
  'overview.sub.target':
    'target semester {term} yang ditetapkan di kurikulum Anda',
  'overview.sub.earlier':
    ' Rencana yang disusun ulang bisa selesai di semester {term}.',
  'overview.sub.late': '{base} selesai {delay} setelah {target}.',
  'overview.sub.ontime': '{base} memenuhi {target}.',
  'overview.sub.estimate': ' Perkiraan berbasis model, bukan keputusan resmi.',
  'overview.semesters.one': '{count} semester',
  'overview.semesters.other': '{count} semester',
  'overview.meta.finish': 'Selesai',
  'overview.meta.target': 'Target',
  'overview.meta.status': 'Status',
  'overview.meta.semester': 'Semester {term}',
  'overview.meta.late': 'Terlambat {delay}',
  'overview.meta.ontime': 'Tepat waktu',
  'overview.action.recovery': 'Cari rencana pemulihan',
  'overview.action.open_plan': 'Buka rencana Anda',
  'overview.action.study_space': 'Ruang belajar',

  'overview.attention.heading': 'Perlu perhatian Anda',
  'overview.attention.overdue': 'Terlambat: {title}',
  'overview.attention.due_soon': 'Segera jatuh tempo: {title}',
  'overview.attention.task_detail': 'Mata kuliah {course} | tenggat {date}',
  'overview.attention.open_study': 'Buka ruang belajar',
  'overview.attention.protect': 'Jaga {name}',
  'overview.attention.fail_none':
    'Jika tidak lulus semester ini, tidak ada rencana yang selesai dalam masa studi menurut model.',
  'overview.attention.fail_moves':
    'Jika tidak lulus semester ini, estimasi selesai paling awal bergeser ke semester {term}.',
  'overview.attention.set_target': 'Tetapkan target',
  'overview.attention.findings.one':
    'Rencana Anda punya {count} pemeriksaan aturan untuk ditinjau',
  'overview.attention.findings.other':
    'Rencana Anda punya {count} pemeriksaan aturan untuk ditinjau',
  'overview.attention.review_plan': 'Tinjau rencana',
  'overview.attention.empty.ready':
    'Tidak ada yang ditandai saat ini. Periksa lagi setelah ada nilai atau tenggat baru.',
  'overview.attention.empty.loading':
    'Memeriksa tenggat dan mata kuliah kritis…',
  'overview.attention.empty.unavailable':
    'Prospek belum tersedia saat ini. Rencana Anda tetap tersimpan.',

  'overview.progress.heading': 'SKS menuju kelulusan',
  'overview.progress.edit': 'Ubah profil',
  'overview.progress.credits': '/ {total} SKS',
  'overview.progress.aria': 'SKS yang sudah selesai menuju kelulusan',
  'overview.progress.courses.one': '{count} mata kuliah selesai',
  'overview.progress.courses.other': '{count} mata kuliah selesai',
  'overview.progress.now': 'Sekarang di semester {term}',

  'overview.plans.heading': 'Rencana Anda',
  'overview.plans.all': 'Semua rencana',
  'overview.plans.checks.one': '{count} pemeriksaan untuk ditinjau',
  'overview.plans.checks.other': '{count} pemeriksaan untuk ditinjau',
  'overview.plans.valid': 'Valid menurut asumsi',
  'overview.plans.summary':
    '{credits} SKS direncanakan | Hingga semester {horizon}',
  'overview.plans.open': 'Buka rencana',
  'overview.footnote':
    'Avenra mendukung perencanaan dan konsultasi dengan dosen wali. Avenra tidak memberi persetujuan akademik.',
};
