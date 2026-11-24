import type { enLanding } from './en-landing.js';

export const idLanding: Record<keyof typeof enLanding, string> = {
  'landing.nav.home_aria': 'Beranda Avenra',
  'landing.nav.aria': 'Navigasi pengantar',
  'landing.nav.how': 'Cara kerja',
  'landing.nav.methodology': 'Aturan & metodologi',
  'landing.nav.bring': 'Gunakan kurikulum saya',
  'landing.nav.menu': 'Menu',
  'landing.nav.open_menu': 'Buka menu',
  'landing.nav.close_menu': 'Tutup menu',

  'landing.hero.eyebrow': 'RUANG AKADEMIK ANDA',
  'landing.hero.title_1': 'Babak kuliah berikutnya.',
  'landing.hero.title_2': 'Anda yang merencanakan.',
  'landing.hero.body':
    'Kuliah tidak selalu berjalan lurus. Petakan mata kuliah Anda, cari jalur alternatif, dan bangun ritme belajar yang cocok untuk Anda.',
  'landing.hero.opening': 'Membuka workspace…',
  'landing.hero.open_yours': 'Buka workspace Anda',
  'landing.hero.open_demo': 'Buka workspace contoh',
  'landing.hero.use_curriculum': 'Gunakan kurikulum saya →',
  'landing.hero.no_account': 'Tanpa perlu akun',
  'landing.hero.preview_alt':
    'Kanvas akademik Avenra menampilkan kartu mata kuliah yang terhubung prasyarat lintas semester',

  'landing.features.title_1': 'Lebih jelas menentukan langkah berikutnya.',
  'landing.features.title_2': 'Dari rencana semester hingga sesi belajar.',
  'landing.features.subtitle':
    'Empat fitur yang saling terhubung, mengikuti kurikulum kampus Anda sendiri.',
  'landing.features.nav_aria': 'Fitur Avenra',
  'landing.features.inside': 'Di dalam Avenra',

  'landing.features.canvas.label': 'Kanvas akademik',
  'landing.features.canvas.title': 'Lihat bagaimana semuanya saling terhubung.',
  'landing.features.canvas.copy':
    'Tempatkan setiap mata kuliah di rencana Anda. Berpindah antara kanvas prasyarat dan papan semester sambil memantau batas SKS serta jam mingguan.',
  'landing.features.canvas.h1': 'Pindahkan mata kuliah antarsemester',
  'landing.features.canvas.h2':
    'Periksa prasyarat, batas SKS, dan anggaran waktu mingguan',
  'landing.features.canvas.h3': 'Simpan skenario rencana secara terpisah',
  'landing.features.canvas.alt':
    'Kanvas mata kuliah Avenra dengan hubungan prasyarat dan panel pemeriksa semester',
  'landing.features.canvas.action': 'Jelajahi rencana studi',

  'landing.features.recovery.label': 'Simulasi pemulihan',
  'landing.features.recovery.title': 'Kendala kuliah tetap punya jalur lain.',
  'landing.features.recovery.copy':
    'Uji skenario mata kuliah yang gagal atau tertunda. Cari opsi lulus lebih cepat atau beban semester lebih ringan sesuai aturan yang Anda masukkan, lalu simpan sebagai rencana terpisah.',
  'landing.features.recovery.h1': 'Simulasikan mata kuliah gagal atau tertunda',
  'landing.features.recovery.h2':
    'Tinjau alternatif rencana pemulihan otomatis',
  'landing.features.recovery.h3': 'Rencana awal Anda tetap aman tidak berubah',
  'landing.features.recovery.alt':
    'Alternatif rencana pemulihan Avenra untuk skenario kendala akademik fiktif',
  'landing.features.recovery.action': 'Baca asumsi simulasi',

  'landing.features.compare.label': 'Bandingkan rencana',
  'landing.features.compare.title': 'Lihat untung ruginya secara berdampingan.',
  'landing.features.compare.copy':
    'Sandingkan dua rencana tersimpan. Lihat perbedaan penempatan mata kuliah, beban SKS per semester, dan estimasi kelulusan sebelum berdiskusi dengan dosen wali.',
  'landing.features.compare.h1': 'Bandingkan dua rencana tersimpan',
  'landing.features.compare.h2': 'Lihat perbedaan per mata kuliah',
  'landing.features.compare.h3': 'Tinjau beban SKS dan estimasi semester lulus',
  'landing.features.compare.alt':
    'Perbandingan rencana dasar dan rencana pemulihan di Avenra beserta metrik SKS dan kelulusan',
  'landing.features.compare.action': 'Buka perbandingan rencana',

  'landing.features.study.label': 'Belajar & fokus',
  'landing.features.study.title': 'Ubah rencana menjadi ritme harian.',
  'landing.features.study.copy':
    'Ubah pengumuman kelas atau tujuan organisasi/magang menjadi tugas terkonfirmasi lengkap dengan rencana mulai. Atur sesi fokus, istirahat, dan catatan refleksi.',
  'landing.features.study.h1':
    'Tempel pengumuman kelas jadi tugas terkonfirmasi & rencana mulai',
  'landing.features.study.h2': 'Gunakan timer sesi fokus dan istirahat',
  'landing.features.study.h3':
    'Ekspor pengingat mulai & tenggat ke kalender (.ics)',
  'landing.features.study.alt':
    'Ruang belajar Avenra dengan daftar target belajar, timer fokus, dan riwayat sesi',
  'landing.features.study.action': 'Buka ruang belajar',

  'landing.steps.heading': 'Dari kurikulum Anda ke langkah yang lebih jelas.',
  'landing.steps.cta': 'Gunakan kurikulum Anda sendiri',
  'landing.steps.intro':
    'Mulai dari mata kuliah yang benar-benar Anda tempuh, eksplorasi pilihan semester ke depan, dan terjemahkan rencana studi ke rutinitas belajar harian.',
  'landing.steps.s1_title': 'Masukkan kurikulum Anda.',
  'landing.steps.s1_copy':
    'Tempel tabel mata kuliah dari Excel, Google Sheets, atau PDF. Tinjau SKS, prasyarat, jam luang mingguan, dan tujuan pribadi Anda.',
  'landing.steps.s2_title': 'Petakan tiap semester.',
  'landing.steps.s2_copy':
    'Tandai mata kuliah yang sudah lulus, lalu susun semester berikutnya di kanvas atau papan semester. Simpan sebagai rencana dasar.',
  'landing.steps.s3_title': 'Uji jalur alternatif.',
  'landing.steps.s3_copy':
    'Simulasikan mata kuliah yang tertunda, periksa aturan yang dimodelkan, dan bandingkan alternatif sebelum konsultasi dengan dosen wali.',
  'landing.steps.s4_title': 'Mulai belajar terarah.',
  'landing.steps.s4_copy':
    'Ubah pengumuman kelas dan tujuan menjadi tugas dengan langkah kecil 10 menit pertama. Jalankan sesi fokus dan catat hasil belajarnya.',
  'landing.steps.assumptions':
    'Aturan yang Anda masukkan membentuk hasil simulasi. Pastikan keputusan resmi bersama dosen wali Anda.',
  'landing.steps.assumptions_link': 'Baca asumsi & metodologi',

  'landing.faq.title_1': 'Pertanyaan penting.',
  'landing.faq.title_2': 'Jawaban lugas.',
  'landing.faq.subtitle':
    'Apa yang bisa dibantu Avenra, dari mana aturan berasal, dan apa yang tetap perlu dikonfirmasi ke dosen wali.',
  'landing.faq.q1': 'Apakah Avenra bisa dipakai untuk kurikulum kampus saya?',
  'landing.faq.a1':
    'Bisa. Tempel tabel mata kuliah dari Excel, Google Sheets, atau PDF dan perbarui aturannya kapan saja. Avenra memodelkan mata kuliah wajib & pilihan, prasyarat (semua maupun salah satu), korequisit, batas minimal SKS lulus, penawaran ganjil/genap, batas SKS berbasis IPS, serta anggaran waktu mingguan. Dispensasi, penyetaraan mata kuliah, dan konversi/transfer SKS tetap perlu ditinjau bersama dosen wali.',
  'landing.faq.q2': 'Dari mana aturan mata kuliah berasal?',
  'landing.faq.a2':
    'Workspace contoh memakai kurikulum fiktif. Untuk workspace Anda sendiri, Anda yang memasukkan data mata kuliah, aturan, dan rujukan sumber saat penyiapan awal atau lewat halaman Profil. Avenra memeriksa aturan yang dimodelkan tersebut dan tidak terhubung otomatis ke sistem resmi kampus.',
  'landing.faq.q3': 'Apakah rencana yang valid menjamin saya pasti lulus?',
  'landing.faq.a3':
    'Tidak. Status valid berarti rencana tersimpan lolos seluruh aturan yang tercatat di workspace Anda. Kuota kelas, persetujuan KRS, nilai aktual, dan kebijakan kampus di luar model dapat mengubah hasil sebenarnya. Gunakan rencana dan Paspor Keputusan untuk menyiapkan diskusi dengan dosen wali.',
  'landing.faq.q4':
    'Apakah simulasi pemulihan akan mengubah rencana awal saya?',
  'landing.faq.a4':
    'Mata kuliah gagal atau tertunda dimodelkan di dalam skenario yang sedang Anda uji. Alternatif hasil solver hanya menjadi rencana baru jika Anda memilih menyimpannya. Duplikat rencana dasar sebelum bereksperimen, lalu bandingkan berdampingan. Avenra tidak pernah mengubah data akademik resmi kampus.',
  'landing.faq.q5': 'Di mana rencana dan sesi belajar saya disimpan?',
  'landing.faq.a5':
    'Profil, rencana, tugas, dan sesi fokus disimpan di database lokal yang menjalankan aplikasi ini (PostgreSQL atau mode lokal SQLite). Browser Anda mengingat ID workspace yang aktif; menghapus data browser dapat memutus tautan ke workspace tersebut karena saat ini belum ada sistem login akun.',
  'landing.faq.q6': 'Apakah perlu akun untuk mencoba workspace contoh?',
  'landing.faq.a6':
    'Tidak perlu akun. Buka workspace contoh untuk mencoba profil mahasiswa fiktif beserta kanvas semester, simulasi pemulihan, perbandingan rencana, ekstraksi pengumuman kelas, dan timer fokus.',
  'landing.faq.more_prefix':
    'Ingin memahami cara kerja pemeriksa aturan lebih dalam?',
  'landing.faq.more_link': 'Baca aturan & metodologi kami',

  'landing.cta.heading': 'Semester berikutnya dimulai dari rencana yang jelas.',
  'landing.cta.use_curriculum': 'Gunakan kurikulum saya',

  'landing.footer.aria': 'Footer situs',
  'landing.footer.nav_aria': 'Navigasi footer',
  'landing.footer.plans': 'Rencana studi',
  'landing.footer.import': 'Siapkan kurikulum',
  'landing.footer.study': 'Belajar & fokus',
  'landing.footer.methodology': 'Metodologi',
  'landing.footer.top': 'Kembali ke atas',
  'landing.footer.tagline': 'Ruang akademik Anda.',
};
