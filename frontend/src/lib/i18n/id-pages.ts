import type { enPages } from './en-pages.js';

// Typed against the English keys: a missing or extra key fails `pnpm check`.
export const idPages: Record<keyof typeof enPages, string> = {
  'error.IPS_RULE_INVALID':
    'Aturan IPS {index} harus berbentuk "3.00 = 24" (IPS 0 sampai 4, SKS 1 sampai 24).',
  'error.IPS_TOO_MANY': 'Gunakan paling banyak 10 aturan IPS.',
  'error.CSV_TOO_LARGE': 'Jaga CSV di bawah 60 KB dan 100 mata kuliah.',

  // Pasted table import
  'import.field.code': 'Kode mata kuliah',
  'import.field.name': 'Nama mata kuliah',
  'import.field.credits': 'SKS',
  'import.field.recommended_term': 'Semester',
  'import.field.prerequisites': 'Prasyarat',
  'import.field.corequisites': 'Korequisit',
  'import.field.min_credits': 'Minimum SKS terkumpul',
  'import.field.offered_terms': 'Ditawarkan pada',
  'import.field.category': 'Kategori',
  'import.UNCLOSED_QUOTE':
    'Tabel memiliki tanda kutip yang tidak ditutup. Periksa nama mata kuliah Anda.',
  'import.MISSING_COLUMN':
    'Kolom "{field}" tidak ditemukan. Pilih salah satu kolom di bawah atau tambahkan ke tabel.',
  'import.NO_ROWS':
    'Tempel tabel dengan baris judul dan minimal satu mata kuliah.',
  'import.ROW_COUNT': 'Impor antara 1 sampai 100 mata kuliah.',
  'import.MISSING_CODE': 'Baris {row}: kode mata kuliah wajib diisi.',
  'import.MISSING_NAME': 'Baris {row}: nama mata kuliah wajib diisi.',
  'import.BAD_CREDITS':
    'Baris {row}: SKS harus bilangan bulat dari 1 sampai 24 (ditemukan "{value}").',
  'import.BAD_TERM':
    'Baris {row}: semester harus bilangan bulat dari 1 sampai 14 (ditemukan "{value}").',
  'import.BAD_MIN_CREDITS':
    'Baris {row}: min_credits harus bilangan bulat dari 0 sampai 300.',
  'import.BAD_OFFERED':
    'Baris {row}: offered_terms harus berupa ganjil, genap, atau semua (ditemukan "{value}").',
  'import.BAD_CATEGORY':
    'Baris {row}: kategori harus berupa wajib atau pilihan (ditemukan "{value}").',
  'import.DUPLICATE_CODE':
    'Baris {row}: kode mata kuliah {code} sudah muncul di baris {first}.',
  'import.UNKNOWN_REFERENCE':
    'Baris {row}: {code} mencantumkan {ref}, yang bukan mata kuliah di tabel ini.',
  'import.paste_hint':
    'Anda juga bisa menempel tabel yang disalin dari Excel, Google Sheets, atau PDF. Avenra mengenali pemisahnya dan nama kolom dalam bahasa Inggris maupun Indonesia.',
  'import.separator': 'Pemisah terdeteksi: {name}',
  'import.sep.tab': 'tab',
  'import.sep.comma': 'koma',
  'import.sep.semicolon': 'titik koma',
  'import.sep.spaces': 'spasi',
  'import.columns': 'Cara Avenra membaca kolom Anda',
  'import.column_aria': 'Arti kolom {header}',
  'import.ignore': 'Abaikan kolom ini',
  'import.guess': 'Tidak dikenali',
  'import.issues.one': '{count} masalah perlu diperbaiki sebelum lanjut',
  'import.issues.other': '{count} masalah perlu diperbaiki sebelum lanjut',
  'import.more': '…dan {count} lagi.',

  'ws.label': 'Workspace',
  'ws.aria': 'Ganti workspace',
  'ws.choose': 'Pilih workspace',
  'ws.import': '+ Impor kurikulum lain',
  'ws.invalid': 'Workspace tidak valid.',
  'ws.not_found': 'Workspace tidak ditemukan.',

  'errorpage.title': 'Avenra | Workspace tidak tersedia',
  'errorpage.not_found': 'Halaman itu tidak tersedia.',
  'errorpage.generic': 'Kami tidak dapat membuka workspace ini.',
  'errorpage.hint': 'Periksa koneksi API dan database, lalu coba lagi.',
  'errorpage.back': 'Kembali ke ringkasan',

  'plans.title': 'Avenra | Rencana studi',
  'plans.heading': 'Rencana Anda. Kemungkinan Anda.',
  'plans.lead':
    'Simpan rencana dasar, coba hal yang berbeda, dan bandingkan sebelum memutuskan.',
  'plans.start': 'Mulai dari profil akademik Anda.',
  'plans.start_hint':
    'Buka workspace demo dari Ringkasan untuk membuat rencana pertama Anda.',
  'plans.go_overview': 'Ke ringkasan',
  'plans.new_name': 'Nama rencana baru',
  'plans.name_placeholder': 'mis. Magang tahun depan',
  'plans.create': 'Buat rencana',
  'plans.active': 'Rencana aktif',
  'plans.archived': 'Diarsipkan',
  'plans.count.one': '{count} rencana',
  'plans.count.other': '{count} rencana',
  'plans.needs_review': 'Perlu ditinjau',
  'plans.tile_meta': 'Sisa {remaining} SKS | batas {cap} SKS',
  'plans.findings_review': '{count} temuan aturan untuk ditinjau',
  'plans.view_restore': 'Lihat & pulihkan',
  'plans.duplicate': 'Duplikat {name}',
  'plans.copy_name': '{name} salinan',
  'plans.empty_archived': 'Tidak ada rencana yang diarsipkan.',
  'plans.empty_active': 'Rencana berikutnya dimulai di sini.',
  'plans.empty_archived_hint':
    'Rencana yang Anda arsipkan tetap tersedia di sini.',
  'plans.empty_active_hint':
    'Beri nama rencana Anda di atas untuk mulai menjelajah.',

  'profile.title': 'Avenra | Profil akademik',
  'profile.heading': 'Titik awal Anda.',
  'profile.lead':
    'Atur semester saat ini dan mata kuliah yang sudah selesai. Rencana dibangun di atas dasar bersama ini.',
  'profile.panel': 'Profil akademik',
  'profile.alias_hint': 'Gunakan alias dan data fiktif pada demo lokal ini.',
  'profile.alias': 'Alias mahasiswa',
  'profile.current': 'Semester saat ini',
  'profile.last_ips': 'IPS semester terakhir',
  'profile.ips_placeholder': 'mis. 3,25',
  'profile.ips_limits': 'Batas SKS berdasarkan IPS: {list}.',
  'profile.ips_limit_item': 'IPS {gpa}+ | {credits} SKS',
  'profile.completed': 'Mata kuliah selesai',
  'profile.selected': '{count} dipilih',
  'profile.completed_hint':
    'Tandai hanya mata kuliah yang sudah lulus. Skenario tidak lulus tetap berada di dalam masing-masing rencana.',
  'profile.course_line': '{code} | {credits} SKS | Semester {term}{extra}',
  'profile.elective_extra': ' | Pilihan',
  'profile.saving': 'Menyimpan…',
  'profile.save': 'Simpan profil akademik',
  'profile.saved':
    'Profil disimpan. Semua pemeriksaan rencana kini memakai kemajuan terbaru Anda.',
  'profile.none': 'Belum ada profil akademik.',
  'profile.open_demo': 'Buka workspace demo',
  'profile.mission_section': 'Misi, waktu mingguan & tujuan',
  'profile.mission_lead':
    'Tulis tujuan utama Anda dan berapa jam per minggu yang tersedia di luar kuliah. Avenra memakainya untuk menghitung batas SKS semester yang realistis.',

  'goals.available_hours': 'Jam tersedia per minggu (opsional)',
  'goals.available_placeholder': 'mis. 45',
  'goals.minutes_per_credit': 'Menit per SKS per minggu',
  'goals.minutes_hint':
    'Asumsi 1 SKS = 170 menit/minggu (50 tatap muka + 60 terstruktur + 60 mandiri). Ubah jika beban mata kuliah Anda berbeda.',
  'goals.implied_cap':
    '{hours} jam/minggu | hingga {cap} SKS/semester sebelum dikurangi jam tujuan.',
  'goals.list_heading': 'Tujuan & komitmen',
  'goals.list_hint':
    'Tambahkan maksimal 3 kegiatan (seperti magang, kerja, atau organisasi). Tujuan aktif mengurangi batas SKS semester tersebut bila anggaran waktu diisi.',
  'goals.count': '{count} / {max}',
  'goals.item_label': 'Tujuan {n}',
  'goals.remove': 'Hapus',
  'goals.remove_aria': 'Hapus tujuan {n}',
  'goals.field_title': 'Nama tujuan',
  'goals.title_placeholder': 'mis. Magang atau BEM',
  'goals.field_kind': 'Jenis',
  'goals.field_start': 'Semester mulai',
  'goals.field_end': 'Semester selesai',
  'goals.field_hours': 'Jam / minggu',
  'goals.field_aria': '{field}, tujuan {n}',
  'goals.kind_internship': 'Magang',
  'goals.kind_work': 'Kerja',
  'goals.kind_organisation': 'Organisasi',
  'goals.kind_graduation': 'Kelulusan',
  'goals.kind_other': 'Lainnya',
  'goals.empty': 'Belum ada tujuan yang ditambahkan.',
  'goals.add': 'Tambah tujuan',
  'goals.error.BUDGET_HOURS': 'Jam tersedia per minggu harus antara 0 dan 168.',
  'goals.error.BUDGET_MINUTES':
    'Menit per SKS harus bilangan bulat antara 60 dan 300.',
  'goals.error.GOAL_TITLE':
    'Tujuan {n}: isi nama tujuan (maksimal 80 karakter).',
  'goals.error.GOAL_TERM':
    'Tujuan {n}: semester mulai dan selesai harus antara 1 dan {max}.',
  'goals.error.GOAL_ORDER':
    'Tujuan {n}: semester selesai tidak boleh lebih awal dari semester mulai.',
  'goals.error.GOAL_HOURS':
    'Tujuan {n}: jam per minggu harus antara 0 dan 168.',

  'study.title': 'Avenra | Belajar & fokus',
  'study.heading': 'Beri rencana Anda sedikit fokus.',
  'study.lead':
    'Target belajar yang kecil dan spesifik. Waktu yang disisihkan untuk mengerjakannya.',
  'study.minutes_tag': '{minutes} menit fokus tercatat',
  'study.open_workspace': 'Buka workspace untuk mulai belajar.',
  'study.next_target': 'Apa target belajar Anda berikutnya?',
  'study.course': 'Mata kuliah',
  'study.target': 'Target spesifik',
  'study.target_placeholder': 'mis. Kerjakan 5 latihan linked list',
  'study.target_date': 'Tanggal target (opsional)',
  'study.add': 'Tambah target belajar',
  'study.targets': 'Target belajar Anda',
  'study.filter.all': 'Semua',
  'study.filter.open': 'Terbuka',
  'study.filter.done': 'Selesai',
  'study.ics': 'Tambahkan target terbuka ke kalender saya (.ics)',
  'study.ics_hint':
    'Terbuka di Google Calendar, Apple Calendar, atau Outlook dengan pengingat pukul 19.00 sehari sebelum setiap tenggat.',
  'study.ics_course': 'Target belajar untuk {course}. Ditambahkan dari Avenra.',
  'study.ics_plain': 'Ditambahkan dari Avenra.',
  'study.due': ' | Tenggat {date}',
  'study.no_targets':
    'Tidak ada target pada tampilan ini. Tambahkan target yang jelas dan bisa dicapai di atas.',
  'study.recent': 'Sesi fokus terbaru',
  'study.default_note': 'Sesi belajar terfokus',
  'study.no_sessions': 'Sesi yang Anda simpan akan muncul di sini.',
  'study.focus_space': 'Ruang fokus',
  'study.mode.focus': 'Fokus',
  'study.mode.break': 'Istirahat',
  'study.timer_aria': 'Waktu tersisa',
  'study.caption.focus': 'Satu hal dalam satu waktu.',
  'study.caption.break': 'Menjauh sejenak dan isi ulang tenaga.',
  'study.restored': 'Dipulihkan dalam keadaan jeda. Lanjutkan saat Anda siap.',
  'study.pause': 'Jeda',
  'study.resume': 'Lanjutkan',
  'study.start': 'Mulai sesi',
  'study.reset': 'Atur ulang',
  'study.focus_minutes': 'Menit fokus',
  'study.break_minutes': 'Menit istirahat',
  'study.learned': 'Apa yang Anda pelajari?',
  'study.learned_placeholder':
    'Refleksi singkat atau pertanyaan Anda berikutnya…',
  'study.saving': 'Menyimpan…',
  'study.finish': 'Selesai & simpan sesi',
  'study.footnote':
    'Timer memakai cap waktu, jadi tab di latar belakang tidak kehilangan waktu yang berlalu. Muat ulang memulihkannya dalam keadaan jeda. Sesi disimpan ke PostgreSQL saat Anda selesai.',
  'study.notice.no_storage':
    'Pemulihan di browser tidak tersedia. Biarkan halaman ini terbuka sampai Anda menyimpan sesi.',
  'study.notice.no_restore':
    'Timer sebelumnya tidak dapat dipulihkan. Mulai sesi baru.',
  'study.notice.focus_done':
    'Blok fokus selesai. Simpan refleksi Anda, lalu istirahat.',
  'study.notice.break_done':
    'Istirahat selesai. Siap untuk blok fokus berikutnya?',
  'study.discard': 'Buang sesi fokus yang belum disimpan ini?',
  'study.notice.saved':
    'Sesi fokus disimpan. Waktu yang dihabiskan tidak berarti penguasaan materi.',
  'study.notice.added': 'Target belajar ditambahkan.',

  'curriculum.alias': 'Alias mahasiswa',
  'curriculum.alias_placeholder': 'Gunakan alias untuk prototipe lokal ini',
  'curriculum.university': 'Universitas',
  'curriculum.university_placeholder': 'Universitas Anda',
  'curriculum.program': 'Program studi',
  'curriculum.program_placeholder': 'mis. Informatika',
  'curriculum.version': 'Tahun / versi kurikulum',
  'curriculum.current': 'Semester saat ini',
  'curriculum.last_ips': 'IPS semester terakhir (opsional)',
  'curriculum.ips_placeholder': 'mis. 3,25',
  'curriculum.max_credits': 'SKS maksimum per semester',
  'curriculum.grad_credits': 'SKS yang dibutuhkan untuk lulus (opsional)',
  'curriculum.grad_placeholder': 'mis. 144',
  'curriculum.grad_too_high':
    'Mata kuliah di tabel Anda berjumlah {total} SKS, kurang dari {target} SKS kelulusan. Tambahkan mata kuliah yang kurang, atau ubah atau kosongkan angka ini.',
  'curriculum.on_time': 'Lulus tepat waktu (semester)',
  'curriculum.max_period': 'Masa studi maksimum (semester)',
  'curriculum.ips_rules': 'Batas SKS berdasarkan IPS',
  'curriculum.ips_rules_hint':
    'Satu aturan per baris: IPS minimum = SKS maksimum. Salin tabelnya dari buku pedoman akademik Anda. Kosongkan jika kampus Anda tidak punya aturan IPS.',
  'curriculum.source': 'Sumber aturan atau rujukan kurikulum',
  'curriculum.source_placeholder':
    'URL pedoman resmi, judul dokumen, atau rujukan aturan',
  'curriculum.template': 'Unduh templat CSV',
  'curriculum.csv_hint_a':
    'Ekspor daftar mata kuliah dari pedoman kurikulum Anda ke templat. Gunakan kode mata kuliah untuk prasyarat, dipisahkan titik koma; tulis ',
  'curriculum.csv_hint_b':
    ' bila salah satu mata kuliah sudah cukup. Penawaran: odd, even, atau both. Kategori: required atau elective. Korequisit boleh diambil di semester yang sama. min_credits adalah SKS yang dibutuhkan sebelum mengambil mata kuliah, misalnya magang atau skripsi.',
  'curriculum.choose_file': 'Pilih berkas CSV',
  'curriculum.paste': 'Atau tempel isi CSV',
  'curriculum.warning':
    'Aturan berasal dari pengguna sampai diverifikasi secara independen. Avenra memeriksa prasyarat (termasuk "salah satu dari A atau B"), korequisit, ambang SKS terkumpul, mata kuliah pilihan terhadap total kelulusan, penawaran ganjil/genap, dan batas SKS berdasarkan IPS untuk semester berikutnya. Pengecualian, mata kuliah setara, dan transfer SKS tetap perlu ditinjau dosen wali.',
  'curriculum.footnote':
    'Workspace baru tidak mengubah kurikulum dan rencana sebelumnya. Prototipe lokal ini tidak memakai login; gunakan alias dan data yang tidak sensitif.',

  'method.title': 'Avenra | Aturan & metodologi',
  'method.heading': 'Ketahui dasar penyusunan rencana Anda.',
  'method.lead':
    'Aturan yang jelas, asumsi yang terlihat, dan ruang bagi pertimbangan dosen wali.',
  'method.own.heading': 'Bawa kurikulum Anda sendiri',
  'method.own.p1':
    'Mahasiswa dari universitas yang berbeda dapat membuat workspace terpisah dengan mengimpor CSV mata kuliah masing-masing. Setiap workspace menyimpan program studi, versi kurikulum, batas SKS, graf prasyarat, rujukan sumber, rencana, dan target belajarnya.',
  'method.own.p2':
    'Aturan yang diimpor diberi label dari pengguna, belum diverifikasi secara independen. CSV yang valid secara struktur tidak membuktikan bahwa isinya mewakili kebijakan institusi dengan benar. Mata kuliah dianggap wajib kecuali CSV menandainya sebagai pilihan; mata kuliah pilihan dihitung ke total SKS kelulusan.',
  'method.own.link': 'Impor kurikulum',
  'method.synthetic.heading': 'Kurikulum sintetis',
  'method.synthetic.p1':
    'Kurikulum S1 Informatika bawaan bersifat fiktif. Strukturnya mengikuti pola umum di Indonesia: 144 SKS, 8 semester yang disarankan, batas studi 14 semester, mata kuliah yang hanya ditawarkan pada semester ganjil atau genap, dan tabel IPS untuk batas SKS semester berikutnya. Tidak ada kebijakan universitas tertentu yang dipakai atau diverifikasi.',
  'method.synthetic.source_a': 'Sumber: ',
  'method.synthetic.source_b':
    '. Setiap validasi dan ekspor mencatat versi kurikulum.',
  'method.checks.heading': 'Apa yang diperiksa',
  'method.checks.1':
    'Setiap mata kuliah wajib yang tersisa terjadwal, dan total yang direncanakan mencapai SKS kelulusan.',
  'method.checks.2':
    'Prasyarat diselesaikan di semester yang lebih awal. Aturan "salah satu dari A atau B" membutuhkan salah satunya. Korequisit boleh berada di semester yang sama.',
  'method.checks.3':
    'Mata kuliah seperti magang atau skripsi menunggu sampai SKS yang terkumpul cukup.',
  'method.checks.4':
    'Setiap semester tetap berada dalam batas Anda, batas maksimum kurikulum, dan, untuk semester berikutnya, batas berdasarkan IPS.',
  'method.checks.5':
    'Mata kuliah mengikuti kalender penawaran ganjil/genap dan berada dalam masa studi maksimum. Mata kuliah yang tidak lulus semester ini diulang mulai semester berikutnya.',
  'method.checks.note':
    'Kode yang tidak dikenal dan input yang rusak ditolak. Draf yang tidak valid tetap bisa disimpan untuk dijelajahi, tetapi diberi label untuk ditinjau.',
  'method.recovery.heading': 'Cara kerja pemulihan',
  'method.recovery.p1':
    'OR-Tools CP-SAT mencari opsi penyelesaian lebih awal dan opsi beban puncak yang lebih ringan. Pemeriksa aturan terpisah memvalidasi setiap hasil, dan setiap opsi menjelaskan perbedaannya. Jika hanya satu opsi berbeda yang ditemukan, Avenra menampilkan satu. Waktu habis dilaporkan terpisah dari ketidaklayakan.',
  'method.recovery.p2':
    'Ketika tidak ada rencana yang muat, Avenra menyebutkan rantai prasyarat yang menghalangi atau kekurangan SKS, lalu menguji rencana terpanjang terkecil atau batas SKS pribadi yang lebih tinggi yang akan berhasil.',
  'method.recovery.p3':
    'Kemunduran skenario dan nilai IPS skenario hanya berlaku di dalam rencana itu. Keduanya tidak menimpa profil akademik bersama.',
  'method.learning.heading': 'Dukungan belajar',
  'method.learning.p1':
    'Tugas mata kuliah dan sesi fokus membantu Anda mengubah niat menjadi tindakan. Waktu yang dihabiskan bukan ukuran pemahaman, dan menyelesaikan tugas tidak pernah menandai mata kuliah sebagai lulus.',
  'method.privacy.heading': 'Privasi dan batasan',
  'method.privacy.p1':
    'Workspace dibatasi oleh pengenal yang disimpan di browser. Prototipe ini tidak memakai login atau identitas terverifikasi: pemisahan workspace bukan autentikasi. Gunakan alias dan contoh yang tidak sensitif. Penerapan publik untuk banyak pengguna membutuhkan autentikasi, otorisasi, dan tinjauan privasi lebih lanjut. Menghapus penyimpanan browser dapat menghilangkan pemilih workspace; catatan di database tidak ikut terhapus.',
  'method.privacy.p2':
    'Pengecualian, transfer SKS, mata kuliah setara, dan konversi magang tidak dimodelkan. Aturan IPS hanya berlaku untuk semester berikutnya karena nilai berikutnya belum diketahui. Diskusikan Paspor Keputusan dengan dosen wali yang berwenang.',
  'method.tech.heading': 'Teknologi dan atribusi',
  'method.tech.p1':
    'SvelteKit, Svelte Flow, FastAPI, PostgreSQL, SQLAlchemy, dan Google OR-Tools. OpenAI Codex membantu secara substansial dalam implementasi, pengujian, dan dokumentasi. Anggota tim tetap bertanggung jawab meninjau dan memahami hasil kerjanya.',
};
