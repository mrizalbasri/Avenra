import type { enPlan } from './en-plan.js';

// Typed against the English keys: a missing or extra key fails `pnpm check`.
export const idPlan: Record<keyof typeof enPlan, string> = {
  'common.semester': 'Semester {term}',
  'list.or': ' atau ',
  'parity.odd': 'ganjil',
  'parity.even': 'genap',
  'status.feasible': 'layak',
  'status.infeasible': 'tidak layak',
  'status.timeout': 'waktu habis',
  'status.unverified': 'belum terverifikasi',
  'status.complete': 'selesai',

  'rule.UNSCHEDULED': 'BELUM DIJADWALKAN',
  'rule.STUDY_PERIOD': 'MASA STUDI',
  'rule.TERM_RANGE': 'RENTANG SEMESTER',
  'rule.RETAKE': 'MENGULANG',
  'rule.OFFERING': 'PENAWARAN',
  'rule.PREREQUISITE': 'PRASYARAT',
  'rule.ANY_PREREQUISITE': 'SALAH SATU PRASYARAT',
  'rule.COREQUISITE': 'KOREQUISIT',
  'rule.CREDITS_EARNED': 'SKS TERKUMPUL',
  'rule.CREDIT_CAP': 'BATAS SKS',
  'rule.GRADUATION_CREDITS': 'SKS KELULUSAN',
  'rule.PREREQUISITE_CHAIN': 'RANTAI PRASYARAT',
  'rule.CAPACITY': 'KAPASITAS',
  'rule.GPA_CREDIT_LIMIT': 'BATAS SKS DARI IPS',
  'rule.TIME_BUDGET': 'ANGGARAN WAKTU',
  'rule.COMBINED': 'GABUNGAN',

  'finding.UNSCHEDULED': '{course} {name} belum dijadwalkan.',
  'finding.STUDY_PERIOD':
    '{course} ditempatkan di semester {term}, melewati masa studi maksimum {max_terms} semester.',
  'finding.TERM_RANGE':
    '{course} harus berada di antara semester {start} dan {end}.',
  'finding.RETAKE':
    '{course} tidak lulus di semester {current} pada skenario ini, sehingga baru bisa diulang mulai semester {next}.',
  'finding.OFFERING':
    '{course} hanya ditawarkan pada semester {parity}, bukan semester {term}.',
  'finding.PREREQUISITE':
    'Selesaikan {prerequisite} sebelum mengambil {course}.',
  'finding.ANY_PREREQUISITE':
    'Selesaikan salah satu dari {options} sebelum mengambil {course}.',
  'finding.COREQUISITE':
    'Ambil {corequisite} di semester yang sama dengan {course} atau lebih awal.',
  'finding.CREDITS_EARNED':
    '{course} membutuhkan {required} SKS terkumpul sebelum semester {term}; rencana ini baru mencapai {earned}.',
  'finding.CREDIT_CAP':
    'Semester {term} berisi {credits} SKS; batasnya {cap} berdasarkan {reason}.',
  'finding.GRADUATION_CREDITS':
    'Rencana ini mencapai {reached} dari {target} SKS kelulusan. Tambahkan {missing} SKS lagi, misalnya dari mata kuliah pilihan.',
  'cap.IPS_RULE': 'aturan IPS {gpa}',
  'cap.TIME_BUDGET':
    'anggaran waktu mingguan Anda (tersisa {hours} jam untuk kuliah)',
  'cap.CURRICULUM_MAX': 'batas maksimum kurikulum',
  'cap.PLAN_LIMIT': 'batas rencana Anda',

  'diag.CREDIT_CAP':
    '{course} bernilai {credits} SKS, lebih besar dari batas semester mana pun ({cap}).',
  'diag.PREREQUISITE_CHAIN':
    '{course} tidak bisa dimulai sebelum semester {start} karena rantai {chain} dan kalender ganjil/genap. Rencana berakhir di semester {end}.',
  'diag.CAPACITY':
    'Anda masih membutuhkan {needed} SKS, tetapi semester {from} sampai {to} hanya menampung paling banyak {capacity}.',
  'diag.GPA_CREDIT_LIMIT':
    'Batas IPS {gpa} sebesar {cap} SKS di semester {term} ikut menjadi bagian dari konflik.',
  'diag.TIME_BUDGET':
    'Anggaran waktu mingguan Anda membatasi semester {term} menjadi {cap} SKS (tersisa {hours} jam untuk kuliah).',
  'diag.COMBINED':
    'Aturan dalam model bentrok hanya bila digabungkan, misalnya korequisit, ambang SKS terkumpul, dan batas SKS sekaligus.',
  'suggest.HORIZON': 'Perpanjang rencana sampai semester {term}.',
  'suggest.CREDIT_CAP': 'Naikkan batas SKS Anda sendiri menjadi {cap} SKS.',
  'suggest.GOAL_HOURS':
    'Kurangi jam {goal} di semester {term} menjadi {hours} jam/minggu.',
  'suggest.GOAL_HOURS_RANGE':
    'Kurangi jam {goal} di semester {start_term}-{end_term} menjadi {hours} jam/minggu.',

  'solve.COMPLETE': 'Semua persyaratan dalam model sudah selesai.',
  'solve.PLAN_ENDS_EARLY':
    'Rencana berakhir sebelum semester saat ini atau melewati masa studi maksimum.',
  'solve.FOUND.one':
    'Ditemukan {count} rencana yang berbeda dan sudah diperiksa secara independen.',
  'solve.FOUND.other':
    'Ditemukan {count} rencana yang berbeda dan sudah diperiksa secara independen.',
  'solve.note.timeout':
    ' Opsi kedua mencapai batas waktu, jadi susunan lain mungkin masih ada.',
  'solve.note.single': ' Tidak ada susunan valid kedua yang berbeda dari ini.',
  'solve.TIMEOUT':
    'Batas waktu tercapai tanpa rencana. Ini tidak membuktikan bahwa rencana mustahil.',
  'solve.UNVERIFIED':
    'Rencana yang dihasilkan gagal pada pemeriksaan aturan independen, jadi tidak ditampilkan. Mohon laporkan kasus ini.',
  'solve.INFEASIBLE':
    'Tidak ada rencana yang memenuhi semua aturan dalam model. Alasan dan perubahan terkecil yang membantu tercantum di bawah.',
  'alt.EARLIER_COMPLETION': 'Selesai lebih awal',
  'alt.LIGHTER_PEAK': 'Beban puncak lebih ringan',
  'alt.summary':
    'Selesai di semester {finish} dengan paling banyak {peak} SKS dalam satu semester.',
  'alt.compare': ' Dibandingkan dengan {against}: selesai {timing}, {load}.',
  'alt.later.one': '{count} semester lebih lambat',
  'alt.later.other': '{count} semester lebih lambat',
  'alt.earlier.one': '{count} semester lebih cepat',
  'alt.earlier.other': '{count} semester lebih cepat',
  'alt.same_time': 'pada waktu yang sama',
  'alt.lighter': 'lebih ringan {count} SKS di puncak',
  'alt.heavier': 'lebih berat {count} SKS di puncak',
  'alt.same_load': 'beban puncak yang sama',

  'advisor.RETAKE':
    'Bolehkah saya mengulang {course} {name} di semester {term}, dan apakah masih ditawarkan pada kalender itu?',
  'advisor.IPS_LIMIT':
    'Dengan IPS {gpa}, apakah batas saya untuk semester {term} benar-benar {cap} SKS?',
  'advisor.OPEN_ISSUES':
    'Rencana ini masih punya masalah {names}. Adakah pengecualian atau susunan yang lebih baik?',
  'advisor.ELECTIVES':
    'Apakah mata kuliah pilihan dalam rencana ini dihitung untuk syarat kelulusan dan konsentrasi saya?',
  'advisor.LATE_FINISH':
    'Selesai di semester {term} lebih lambat dari 8 semester. Apakah ini memengaruhi UKT, beasiswa, atau batas masa studi saya?',
  'advisor.ACCURACY':
    'Apakah prasyarat dan penawaran mata kuliah yang dipakai di sini sudah sesuai untuk angkatan saya?',
  'assume.DISCLAIMER': '{text}',
  'assume.RULE_SOURCE': 'Sumber aturan: {source}',
  'assume.IPS_MISSING':
    'IPS belum diisi, jadi aturan SKS berdasarkan IPS tidak diterapkan.',
  'assume.IPS_RULE':
    'Aturan SKS berdasarkan IPS memakai {gpa} hanya untuk semester {term}. Semester berikutnya diasumsikan boleh sampai {cap} SKS.',
  'assume.OFFERINGS':
    'Penawaran mata kuliah mengikuti kalender ganjil/genap yang tercantum. Pengecualian, transfer SKS, dan konversi magang tidak dimodelkan.',
  'assume.TIME_BUDGET':
    'Anggaran waktu mingguan memakai {available} jam/minggu yang tersedia dengan {minutes_per_credit} menit per SKS per minggu (bawaan 170: 50 tatap muka + 60 terstruktur + 60 mandiri).',
  'disclaimer.synthetic':
    'Hanya asumsi demonstrasi. Bukan kurikulum resmi universitas atau keputusan kelulusan.',
  'disclaimer.user_supplied':
    'Kurikulum yang Anda masukkan sendiri. Pastikan aturannya ke universitas Anda.',

  'error.NETWORK':
    'Tidak dapat terhubung ke API. Perubahan Anda belum tersimpan. Coba lagi saat layanan tersedia.',
  'error.INVALID_INPUT': 'Periksa isian Anda lalu coba lagi.',
  'error.PROFILE_NOT_FOUND': 'Buka dulu workspace demo sintetis.',
  'error.PLAN_NOT_FOUND': 'Rencana tidak ditemukan.',
  'error.UNKNOWN_COURSES':
    'Gunakan kode mata kuliah yang unik dari kurikulum yang dipilih.',
  'error.TERM_OUT_OF_RANGE':
    'Semester pada rencana harus berada di antara 1 dan {max}.',
  'error.PROGRESS_ISSUES':
    'Sebagian mata kuliah yang sudah selesai belum memenuhi prasyaratnya: {issues}. Tandai prasyaratnya sebagai selesai, atau tanyakan dosen wali tentang pengecualian.',
  'error.issue': '{course} membutuhkan {missing}',
  'error.PROFILE_CONFLICT':
    'Profil berubah di tab lain. Muat ulang sebelum menyimpan.',
  'error.PROFILE_CHANGED':
    'Profil akademik berubah. Muat ulang sebelum menyimpan rencana ini.',
  'error.HORIZON_BEFORE_CURRENT':
    'Rencana tidak boleh berakhir sebelum semester saat ini.',
  'error.PLAN_CONFLICT':
    'Rencana ini berubah di tab lain. Muat ulang sebelum menyimpan draf Anda.',
  'error.SOLVE_CONFLICT':
    'Rencana sumber atau profil berubah. Muat ulang sebelum membuat alternatif.',
  'error.TASK_CONFLICT': 'Target berubah. Muat ulang sebelum mencoba lagi.',
  'error.TASK_NOT_FOUND': 'Target tidak ditemukan.',
  'error.TASK_TARGET_REQUIRED': 'Pilih mata kuliah atau tujuan.',
  'error.START_AFTER_DUE': 'Tanggal mulai tidak boleh setelah tanggal tenggat.',
  'error.SESSION_NOT_FOUND': 'Sesi tidak ditemukan',
  'error.WORKSPACE_EXISTS':
    'Pilih workspace baru untuk kurikulum yang berbeda.',
  'error.GOAL_TERM_RANGE':
    'Semester tujuan harus berada dalam masa studi maksimum {max} semester.',
  'error.UNKNOWN_GOAL': 'Pilih tujuan dari workspace ini.',
  'error.COMPLETED_COURSE_REMOVED':
    'Hapus centang mata kuliah lulus berikut di profil Anda sebelum menghapusnya dari kurikulum: {courses}.',
  'error.CURRENT_BEYOND_MAX':
    'Semester saat ini ({current}) melewati masa studi maksimum {max} semester.',

  'req.prerequisites': 'Prasyarat: {list}',
  'req.any_of': 'Salah satu: {list}',
  'req.corequisites': 'Semester yang sama atau lebih awal: {list}',
  'req.min_credits': 'Butuh {count} SKS terkumpul terlebih dahulu',
  'req.none': 'Tanpa prasyarat',
  'offer.every': 'Setiap semester',
  'offer.odd': 'Hanya semester ganjil',
  'offer.even': 'Hanya semester genap',
  'course.elective': 'Pilihan',
  'course.required': 'Wajib',

  'node.elective': 'Pilihan | ',
  'node.credits_short': '{count} SKS',
  'node.retake': 'Diulang pada skenario ini',
  'node.review': 'Tinjau pemeriksaan aturan',
  'node.planned': 'Mata kuliah terencana',
  'node.semester_credits': '{credits} / {cap} SKS',
  'node.semester_hours': '{total} / {available} jam',
  'node.semester_hours_split':
    '{total} / {available} jam ({course} + {goal} jam)',

  'plan.title': 'Avenra | {name}',
  'plan.rev': 'Versi {revision} | {state} | {version}',
  'plan.unsaved': 'Perubahan belum disimpan',
  'plan.saved': 'Tersimpan',
  'plan.passport': 'Paspor',
  'plan.passport_blocked':
    'Simpan draf Anda sebelum membuka Paspor Keputusannya.',
  'plan.saving': 'Menyimpan…',
  'plan.save': 'Simpan & validasi',
  'plan.dismiss': 'Tutup',
  'plan.draft_available': 'Ada draf di browser yang belum disimpan.',
  'plan.restore': 'Pulihkan draf',
  'plan.discard': 'Buang draf',
  'plan.needs_check': 'Perubahan perlu diperiksa',
  'plan.findings.one': '{count} masalah aturan',
  'plan.findings.other': '{count} masalah aturan',
  'plan.valid': 'Memenuhi semua aturan yang dicantumkan',
  'plan.credits_planned': '{done} / {total} SKS direncanakan',
  'plan.completion': 'Perkiraan selesai: semester {term}',
  'plan.explore': 'Jelajahi penempatan semester Anda',
  'plan.view.canvas': 'Kanvas',
  'plan.view.board': 'Papan semester',
  'plan.undo': 'Urungkan',
  'plan.redo': 'Ulangi',
  'plan.load': '{load} / {cap} SKS',
  'plan.course_meta': '{code} | {credits} SKS',
  'plan.move_label': 'Pindahkan {code} ke semester',
  'plan.unscheduled': 'Belum dijadwalkan',
  'plan.drop_hint': 'Letakkan mata kuliah di sini',
  'plan.hint':
    'Pindahkan mata kuliah antar kolom semester untuk menjadwalkan ulang. Pilih mata kuliah untuk melihat detail atau memindahkannya dengan keyboard.',
  'plan.required_off':
    'Mata kuliah wajib yang belum dijadwalkan atau di luar rencana',
  'plan.elective_pool': 'Daftar mata kuliah pilihan',
  'plan.elective_hint':
    'Opsional. Pilih salah satu untuk menjadwalkannya bila Anda butuh SKS tambahan.',
  'plan.elective_chip': '{code} | {name} | {credits} SKS',
  'plan.tools': 'Alat rencana',
  'plan.settings': 'Pengaturan rencana',
  'plan.name': 'Nama rencana',
  'plan.credit_limit': 'Batas SKS',
  'plan.last_semester': 'Semester terakhir',
  'plan.limit_note':
    'Batas semester {term}: {cap} SKS{ips}. Masa studi maksimum: {max} semester.',
  'plan.limit_ips': ' (IPS {gpa})',
  'plan.course_details': 'Detail mata kuliah',
  'plan.course_line': '{code} | {credits} SKS | {category} | {offering}',
  'plan.assigned': 'Semester penempatan',
  'plan.study_goal': 'Buat target belajar',
  'plan.select_hint':
    'Pilih kartu di kanvas atau papan untuk melihat prasyaratnya dan memindahkannya.',
  'plan.setback': 'Simulasikan kemunduran',
  'plan.setback_hint':
    'Tandai mata kuliah yang mungkin tidak lulus semester ini, atau mata kuliah lulus yang harus diulang. Profil Anda tidak berubah.',
  'plan.this_semester': 'Semester ini',
  'plan.none_this_semester': 'Tidak ada mata kuliah terencana semester ini.',
  'plan.retake_passed': 'Mata kuliah lulus yang akan diulang',
  'plan.expected_ips': 'Perkiraan IPS setelah kemunduran ini',
  'plan.ips_placeholder': 'mis. 2,40',
  'plan.ips_hint':
    'IPS yang lebih rendah bisa mengurangi batas SKS semester berikutnya. Kosongkan untuk memakai IPS di profil Anda.',
  'plan.recovery': 'Cari jalur pemulihan',
  'plan.recovery_hint':
    'Bandingkan penyelesaian lebih awal dengan beban puncak yang lebih ringan berdasarkan aturan kurikulum Anda.',
  'plan.finding_alternatives': 'Mencari alternatif…',
  'plan.generate': 'Buat alternatif',
  'plan.save_first': 'Draf akan disimpan otomatis sebelum mencari alternatif.',
  'plan.shortcuts_hint': 'Pintasan: Ctrl/Cmd+S simpan | Ctrl/Cmd+Z urungkan.',
  'plan.archive': 'Arsipkan rencana ini',
  'plan.archive_hint':
    'Rencana yang diarsipkan tetap bisa dipulihkan dari Rencana studi.',
  'plan.results': 'Alternatif pemulihan',
  'plan.why_none': 'Mengapa tidak ada rencana yang muat',
  'plan.smallest': 'Perubahan terkecil yang berhasil',
  'plan.no_suggestion':
    'Mengubah panjang rencana atau batas SKS Anda sendiri tidak cukup. Diskusikan aturan yang bentrok dengan dosen wali Anda.',
  'plan.optimal': 'Optimal untuk tujuan model ini.',
  'plan.feasible': 'Hasil layak ditemukan dalam batas waktu.',
  'plan.checked': ' Sudah diperiksa secara independen.',
  'plan.changes.one': '{count} perubahan dari rencana Anda',
  'plan.changes.other': '{count} perubahan dari rencana Anda',
  'plan.change_line': '{code} {name}: {from} | {to}',
  'plan.change_semester': 'semester {term}',
  'plan.change_none_from': 'belum direncanakan',
  'plan.change_none_to': 'dikeluarkan',
  'plan.same_arrangement': 'Susunannya sama dengan rencana tersimpan Anda.',
  'plan.keep': 'Simpan sebagai rencana terpisah',
  'plan.checks': 'Pemeriksaan aturan & penjelasan',
  'plan.awaiting': 'Menunggu disimpan',
  'plan.revision': 'Versi tersimpan {revision}',
  'plan.dirty_note':
    'Simpan untuk memeriksa draf ini. Masalah di bawah milik versi tersimpan terakhir.',
  'plan.all_pass':
    'Semua aturan yang dicantumkan terpenuhi untuk rencana tersimpan.',
  'plan.downstream': 'Dampak turunan',
  'plan.source_note': '{assumptions} Sumber: {version}.',
  'plan.leave': 'Anda punya draf yang belum disimpan. Tinggalkan halaman ini?',
  'plan.suggestion_applied':
    'Saran diterapkan. Simpan & validasi, lalu buat alternatif lagi.',
  'plan.saved_ok': 'Rencana disimpan dan diperiksa terhadap aturan kurikulum.',
  'plan.save_before_generate':
    'Simpan perubahan skenario Anda sebelum membuat alternatif.',
  'plan.draft_old':
    'Draf ini milik versi tersimpan yang lebih lama. Salin catatan Anda sebelum membuangnya.',
  'plan.draft_invalid': 'Draf di browser ini tidak valid.',

  'passport.title': 'Avenra | Paspor Keputusan | {name}',
  'passport.heading': 'Bawa percakapan ini lebih jauh.',
  'passport.lead':
    'Cuplikan rencana tersimpan untuk diskusi yang terinformasi dengan dosen wali Anda.',
  'passport.print': 'Cetak / Simpan sebagai PDF',
  'passport.copy_summary': 'Salin ringkasan dosen PA',
  'passport.copied':
    'Ringkasan tersalin. Siap ditempel ke WhatsApp atau email.',
  'passport.copy_failed':
    'Gagal menyalin otomatis. Gunakan Cetak / Simpan sebagai PDF.',
  'passport.mission_section': 'Misi, komitmen & waktu mingguan',
  'passport.budget_line':
    'Anggaran waktu mingguan: {hours} jam/minggu tersedia ({minutes} menit per SKS).',
  'passport.col.hours': 'Jam mingguan',
  'passport.hours_cell': '{total} / {available} jam',
  'passport.hours_over': '{total} / {available} jam (lebih)',
  'passport.brand_synthetic': 'KURIKULUM CONTOH | KONSULTASI DOSEN WALI',
  'passport.brand_own': 'KURIKULUM ANDA | KONSULTASI DOSEN WALI',
  'passport.name': 'Paspor Keputusan Akademik',
  'passport.alias': 'Alias mahasiswa',
  'passport.snapshot': 'Cuplikan',
  'passport.snapshot_value': 'Versi rencana {plan} | Versi profil {profile}',
  'passport.curriculum': 'Kurikulum',
  'passport.generated': 'Dibuat',
  'passport.summary': 'Ringkasan keputusan',
  'passport.findings_need.one': '{count} masalah aturan perlu ditinjau.',
  'passport.findings_need.other': '{count} masalah aturan perlu ditinjau.',
  'passport.all_satisfied':
    'Rencana tersimpan memenuhi aturan yang dicantumkan berdasarkan asumsi berikut.',
  'passport.credits':
    'SKS: {completed} selesai + {planned} direncanakan dari {total} | Beban puncak: {peak} | Perkiraan selesai: {completion}',
  'passport.unresolved': 'belum terselesaikan',
  'passport.setbacks': 'Kemunduran skenario: {list}.{ips}',
  'passport.none': 'Tidak ada',
  'passport.ips_used': ' IPS yang dipakai untuk semester {term}: {gpa}.',
  'passport.plan': 'Rencana semester yang diusulkan',
  'passport.col.semester': 'Semester',
  'passport.col.courses': 'Mata kuliah',
  'passport.col.credits': 'SKS',
  'passport.col.limit': 'Batas',
  'passport.no_courses': 'Tidak ada mata kuliah terjadwal',
  'passport.affected': 'Mata kuliah yang terdampak kemunduran',
  'passport.rules': 'Masalah aturan',
  'passport.no_violations':
    'Tidak ada masalah aturan pada cuplikan tersimpan ini.',
  'passport.questions': 'Pertanyaan untuk dosen wali',
  'passport.sources': 'Sumber, asumsi, dan batasan',
  'passport.source_line':
    'Sumber: {source} | {version}. Mata kuliah selesai: {completed}. Ini alat bantu perencanaan, bukan izin pendaftaran atau penetapan kelulusan.',

  'compare.title': 'Avenra | Bandingkan rencana',
  'compare.heading': 'Lihat untung ruginya dengan jelas.',
  'compare.lead':
    'Bandingkan cuplikan tersimpan dengan profil akademik dan asumsi kurikulum yang sama.',
  'compare.empty': 'Beri diri Anda pilihan lain.',
  'compare.empty_hint':
    'Buat atau duplikat rencana kedua, lalu kembali untuk membandingkan perbedaannya.',
  'compare.open_plans': 'Buka rencana studi',
  'compare.plan_a': 'Rencana A',
  'compare.plan_b': 'Rencana B',
  'compare.findings.one': '{count} masalah aturan',
  'compare.findings.other': '{count} masalah aturan',
  'compare.completion': 'Perkiraan selesai',
  'compare.unresolved': 'Belum terselesaikan',
  'compare.peak': 'Beban semester puncak',
  'compare.credits_n': '{count} SKS',
  'compare.planned': 'SKS direncanakan',
  'compare.your_limit': 'Batas SKS Anda',
  'compare.ips': 'IPS skenario',
  'compare.not_set': 'Belum diatur',
  'compare.setbacks': 'Kemunduran skenario',
  'compare.revision': 'Versi tersimpan',
  'compare.edit': 'Ubah rencana ini',
  'compare.differences': 'Perbedaan per mata kuliah',
  'compare.workload_heading': 'Perbandingan beban per semester',
  'compare.semester': 'Semester',
  'compare.delta': 'Selisih',
  'compare.same_load': 'Sama',
  'compare.diff_only': 'Hanya yang berbeda',
  'compare.diff_count.one': '{count} mata kuliah berbeda',
  'compare.diff_count.other': '{count} mata kuliah berbeda',
  'compare.no_differences':
    'Kedua rencana menempatkan semua mata kuliah di semester yang sama.',
  'compare.load_cell': '{credits} / {cap} SKS',
  'compare.hours_note': ' | {total}/{available} jam',
  'compare.course': 'Mata kuliah',
  'compare.completed': 'Selesai',
  'compare.not_chosen': 'Tidak dipilih',
  'compare.unscheduled': 'Belum dijadwalkan',
  'compare.footnote':
    'Baris yang disorot berbeda. Perkiraan selesai bergantung pada aturan kurikulum yang dicantumkan, bukan jaminan kelulusan.',
  'compare.choose_two': 'Pilih dua rencana yang berbeda.',
};
