import type { enStart } from './en-start.js';

// Typed against the English keys: a missing or extra key fails `pnpm check`.
export const idStart: Record<keyof typeof enStart, string> = {
  'start.title': 'Avenra | Mulai',
  'start.heading': 'Siapkan workspace Anda.',
  'start.lead':
    'Empat langkah singkat: tentang Anda, kurikulum Anda, mata kuliah lulus, serta waktu mingguan dan tujuan (opsional).',
  'start.steps_aria': 'Langkah persiapan',
  'start.step.1': 'Tentang Anda',
  'start.step.2': 'Kurikulum Anda',
  'start.step.3': 'Mata kuliah lulus',
  'start.step.4': 'Waktu & tujuan',
  'start.step_of': 'Langkah {n} dari 4',
  'start.back': 'Kembali',
  'start.next': 'Lanjut',
  'start.draft_restored': 'Persiapan yang belum selesai sudah dipulihkan.',
  'start.start_over': 'Mulai dari awal',
  'start.start_over_confirm': 'Hapus semua yang sudah Anda isi dan mulai lagi?',

  'start.language_hint':
    'Pilih bahasa untuk Avenra. Anda bisa menggantinya nanti.',
  'start.mission': 'Misi Anda (opsional)',
  'start.mission_placeholder': 'mis. Lulus tepat waktu sambil memimpin BEM.',
  'start.mission_count': '{count} / 500',

  'start.paste_heading': 'Masukkan daftar mata kuliah Anda',
  'start.example': 'Mulai dari kurikulum contoh',
  'start.example_loading': 'Memuat contoh…',
  'start.example_label':
    'Kurikulum contoh (sintetis). Ganti dengan mata kuliah Anda sendiri bila sudah bisa.',
  'start.use_table': 'Gunakan tabel ini',
  'start.use_table_hint': 'Ini mengganti daftar mata kuliah di bawah.',
  'start.template_loaded':
    'Templat kurikulum dimuat. Periksa daftar mata kuliah dan aturan di bawah.',
  'start.rows_heading': 'Mata kuliah',
  'start.rows_hint':
    'Periksa setiap mata kuliah. Tulis prasyarat berupa kode mata kuliah dipisahkan ";", dan A|B bila salah satu sudah cukup. Prasyarat dan aturan IPS bisa dilengkapi nanti.',
  'start.rows_empty':
    'Tempel tabel di atas, mulai dari contoh, atau tambahkan mata kuliah satu per satu.',
  'start.add_row': 'Tambah mata kuliah',
  'start.remove_row': 'Hapus baris {n}',
  'start.row_label': 'Baris {n}',
  'start.row_field': '{field}, baris {n}',
  'start.total.one': '{count} mata kuliah | {credits} SKS',
  'start.total.other': '{count} mata kuliah | {credits} SKS',
  'start.rows_issues.one': '{count} masalah perlu diperbaiki pada mata kuliah',
  'start.rows_issues.other':
    '{count} masalah perlu diperbaiki pada mata kuliah',
  'start.rules_heading': 'Aturan program studi',
  'start.required_over':
    'Mata kuliah wajib berjumlah {required} SKS, lebih dari {target} SKS kelulusan. Tandai sebagian sebagai pilihan atau naikkan angkanya.',
  'start.term_beyond':
    'Ada mata kuliah yang disarankan setelah semester {max}, yaitu masa studi maksimum.',
  'start.target_beyond':
    'Lulus tepat waktu tidak boleh lebih lambat dari masa studi maksimum.',
  'start.current_beyond':
    'Semester Anda saat ini ({current}) melewati masa studi maksimum.',
  'start.missing_context':
    'Isi universitas, program studi, versi kurikulum, dan sumber aturan.',

  'start.passed_heading': 'Mata kuliah mana yang sudah Anda lulusi?',
  'start.passed_lead':
    'Centang mata kuliah yang sudah lulus. Avenra merencanakan sisanya.',
  'start.mark_until': 'Tandai semester 1 sampai {n} sebagai lulus',
  'start.clear_passed': 'Hapus semua',
  'start.passed_count.one': '{count} mata kuliah lulus | {credits} SKS',
  'start.passed_count.other': '{count} mata kuliah lulus | {credits} SKS',
  'start.passed_issues':
    'Mata kuliah lulus berikut membutuhkan prasyarat yang belum dicentang:',
  'start.create': 'Buat workspace saya',
  'start.creating': 'Membuat workspace Anda…',
  'start.skip_create': 'Lewati & buat workspace',
  'start.budget_heading': 'Waktu mingguan & tujuan (opsional)',
  'start.budget_lead':
    'Atur berapa jam per minggu yang tersedia untuk belajar dan tambahkan kegiatan seperti magang, kerja, atau organisasi. Anda bisa melewatinya dan mengisi nanti di Profil.',
};
