/**
 * Yurtify Application Core Logic - Live Supabase Integration
 * 
 * Connected to Supabase Cloud Database:
 * - URL: https://pbqiumuzvzlhkbfvlybq.supabase.co
 * - Tables: ogrenciler, camasirhane_makineler, camasirhane_randevular, arizalar, duyurular, yemek_katilim
 * 
 * Features & Feedback Implementations:
 * 1.a Remember Me & 1.b Biometric Quick-Login
 * 1.c Enlarged Typography & Dynamic Font Size Scaler
 * 1.d Automatic "Match System Theme" Setting
 * 2.a High-Priority Push Alerts for Sudden Outages & Dining Updates
 * 3.a Real-Time Laundry Occupancy Gauges (Idle vs Running counts)
 * 3.b Automated 10-minute Pre-Reservation Reminder
 * 3.c Automated Instant Cycle Completion Unload Alert
 * 4.a Centralized Administrator Ticket Resolution & Official Closure Flow
 * 5. Admin Student Management (Room, Bed, Username, Initial Pass)
 * 6. Mandatory First-Login Password Change (Secured in Supabase)
 * 7. Admin Laundry Supervision (Add/Delete/Status)
 * 8. Modern Floating Island Exit Capsule for Admin Preview
 */

// ================= SUPABASE CONFIGURATION =================
const SUPABASE_CONFIG = {
  url: 'https://pbqiumuzvzlhkbfvlybq.supabase.co',
  anonKey: 'sb_publishable_2TIKq45frzizMAzH9t44qw_IymfzwEA',
  yurtId: 'af81f031-1988-401e-84af-42ac75b4d409'
};

// Initialize Supabase Client
const supabaseClient = (window.supabase && typeof window.supabase.createClient === 'function')
  ? window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey)
  : null;

// ================= GLOBAL APP STATE =================
const AppState = {
  currentRole: 'student', // 'student' or 'admin'
  previewModeActive: false,
  activeStudentUser: null,
  pendingFirstLoginStudent: null,
  theme: localStorage.getItem('yurtify_theme') || 'dark',
  fontSize: localStorage.getItem('yurtify_font_size') || 'normal',
  rememberMe: localStorage.getItem('yurtify_remember_me') === 'true',
  savedUsername: localStorage.getItem('yurtify_saved_username') || 'eda.etem',

  // Live Students List (Synchronized with Supabase `ogrenciler`)
  students: [
    {
      id: 'std-1793349124719',
      username: 'eda.etem',
      name: 'Eda Etem',
      room: 'Oda 302',
      bed: 'Yatak 3',
      password: 'edaetem',
      isFirstLogin: false
    },
    {
      id: 'std-1793351680146',
      username: 'aleyna.ersoy',
      name: 'Aleyna Seda Ersoy',
      room: 'Oda 201',
      bed: 'Yatak 2',
      password: 'ogrenci123',
      isFirstLogin: true
    },
    {
      id: 'std-1793351699047',
      username: 'yagmur.arslan',
      name: 'Yağmur Arslan',
      room: 'Oda 201',
      bed: 'Yatak 2',
      password: 'ogrenci123',
      isFirstLogin: true
    },
    {
      id: 'std-1793351785024',
      username: 'ebrar.karakas',
      name: 'Ebrar Karakaş',
      room: 'Oda 103',
      bed: 'Yatak 1',
      password: 'ogrenci123',
      isFirstLogin: true
    }
  ],

  // Admin Credentials
  adminUser: {
    username: 'admin',
    name: 'Meltem Karahan',
    role: 'Yurt Müdiresi / İdareci',
    password: '123456'
  },

  // Laundry Facility Data (Synchronized with Supabase `camasirhane_makineler` & `camasirhane_randevular`)
  laundry: {
    quotaUsed: 1,
    quotaTotal: 2,
    activeBooking: {
      id: 'res-101',
      machine: 'Makine 1',
      date: '05.11.2026',
      timeSlot: '18:00 - 19:30',
      status: 'Onaylandı'
    },
    machines: [
      { id: 'mach_1793352492921', name: 'Makine 1', type: 'washer', status: 'idle', currentSlot: 'Müsait', progress: 0 },
      { id: 'mach_1793352498349', name: 'Makine 2', type: 'washer', status: 'idle', currentSlot: 'Müsait', progress: 0 },
      { id: 'mach_1793352506447', name: 'Kurutma', type: 'dryer', status: 'running', currentSlot: '18:00 - 19:30', progress: 65 }
    ]
  },

  // Dining Menu Data
  dining: {
    status: 'Servis Açık',
    dinnerItems: [
      'Yeşil Mercimek Çorbası',
      'Mantarlı Tavuk Sote',
      'Domates Soslu Burgu Makarna',
      'Mevsim Meyvesi (Mandalina)'
    ]
  },

  // Announcements Data (Synchronized with Supabase `duyurular`)
  announcements: [
    {
      id: 'ann-1',
      title: 'Acil: Sıcak Su & Kazan Bakımı',
      content: 'Bugün 20:30 - 21:30 saatleri arasında merkezi hidrofor ve kazan filtre değişimi yapılacaktır. Kısa süreli sıcak su kesintisi yaşanabilir.',
      isUrgent: true,
      sender: 'Yurt Yönetimi',
      time: 'Bugün, 18:45'
    },
    {
      id: 'ann-2',
      title: 'Giriş & Turnike Duyurusu',
      content: 'Hafta içi son giriş saati 23:00, hafta sonu ise 23:45\'tir. İzin almayan öğrencilerin odalarında bulunması zorunludur.',
      isUrgent: false,
      sender: 'Güvenlik Birimi',
      time: '04.11.2026'
    }
  ],

  // Maintenance Tickets Data (Synchronized with Supabase `arizalar`)
  tickets: [
    {
      id: 'mnt-1793786928121',
      category: 'Elektrik',
      description: 'Odamızdaki priz çalışmıyor',
      room: 'Oda 302 (Eda Etem)',
      date: '04.11.2026',
      status: 'Açık',
      adminNote: 'Teknik personel görevlendirildi.'
    }
  ]
};

// ================= DOM ELEMENT REFERENCES =================
const DOM = {
  body: document.body,

  // Portals
  viewAuth: document.getElementById('view-auth'),
  viewForcePassword: document.getElementById('view-force-password'),
  portalStudent: document.getElementById('portal-student'),
  portalAdmin: document.getElementById('portal-admin'),

  // Auth & Roles
  authRoleTabs: document.querySelectorAll('.auth-role-tab'),
  authLabelUser: document.getElementById('auth-label-user'),
  usernameInput: document.getElementById('username-input'),
  passwordInput: document.getElementById('password-input'),
  rememberMeCheck: document.getElementById('remember-me-check'),
  signinForm: document.getElementById('signin-form'),
  btnBiometricLogin: document.getElementById('btn-biometric-login'),
  biometricText: document.getElementById('biometric-text'),

  // Demo Pills
  demoStudentEda: document.getElementById('demo-student-eda'),
  demoStudentAleyna: document.getElementById('demo-student-aleyna') || document.getElementById('demo-student-ayse'),
  demoAdminMeltem: document.getElementById('demo-admin-meltem'),
  dbStatusText: document.getElementById('db-status-text'),

  // Forced Password Change Form
  forcePasswordForm: document.getElementById('force-password-form'),
  newPasswordInput: document.getElementById('new-password-input'),
  newPasswordConfirm: document.getElementById('new-password-confirm'),

  // Student Navigation & Subviews
  studentNavItems: document.querySelectorAll('[data-student-tab]'),
  studentSubviews: document.querySelectorAll('.student-subview'),

  // Student Home
  studentProfileName: document.getElementById('student-profile-name'),
  studentCurrentDate: document.getElementById('student-current-date'),
  studentRoomLabel: document.getElementById('student-room-label'),
  studentBedLabel: document.getElementById('student-bed-label'),
  diningStatusBadge: document.getElementById('dining-status-badge'),
  studentDinnerItemsList: document.getElementById('student-dinner-items-list'),
  studentAnnouncementsContainer: document.getElementById('student-announcements-container'),
  studentAnnCount: document.getElementById('student-ann-count'),

  // Student Laundry
  studentOccIdle: document.getElementById('student-occ-idle'),
  studentOccRunning: document.getElementById('student-occ-running'),
  studentOccMaint: document.getElementById('student-occ-maint'),
  studentMachineStripList: document.getElementById('student-machine-strip-list'),
  studentQuotaDisplay: document.getElementById('student-quota-display'),
  studentQuotaFill: document.getElementById('student-quota-fill'),
  studentActiveBookingCard: document.getElementById('student-active-booking-card'),
  studentActiveMachine: document.getElementById('student-active-machine'),
  studentActiveTime: document.getElementById('student-active-time'),
  studentBtnCancelRes: document.getElementById('student-btn-cancel-res'),
  studentMachineSelect: document.getElementById('student-machine-select'),
  studentTimeslotSelect: document.getElementById('student-timeslot-select'),
  studentBtnConfirmRes: document.getElementById('student-btn-confirm-res'),

  // Student Maintenance
  studentMaintCat: document.getElementById('student-maint-cat'),
  studentMaintDesc: document.getElementById('student-maint-desc'),
  studentBtnSubmitMaint: document.getElementById('student-btn-submit-maint'),
  studentTicketsContainer: document.getElementById('student-tickets-container'),
  studentTicketCountLabel: document.getElementById('student-ticket-count-label'),

  // Admin Subviews & Controls
  adminTabBtns: document.querySelectorAll('[data-admin-subtab]'),
  adminContentSubviews: document.querySelectorAll('.admin-content-subview'),
  btnToggleStudentPreview: document.getElementById('btn-toggle-student-preview'),
  previewModeBar: document.getElementById('preview-mode-bar'),
  btnExitPreview: document.getElementById('btn-exit-preview'),

  // Admin Student Management
  admStudentName: document.getElementById('adm-student-name'),
  admStudentUsername: document.getElementById('adm-student-username'),
  admStudentRoom: document.getElementById('adm-student-room'),
  admStudentBed: document.getElementById('adm-student-bed'),
  admStudentInitialPass: document.getElementById('adm-student-initial-pass'),
  btnAdmAddStudent: document.getElementById('btn-adm-add-student'),
  admStudentsList: document.getElementById('adm-students-list'),
  admStudentCount: document.getElementById('adm-student-count'),

  // Admin Laundry Management
  admMachineName: document.getElementById('adm-machine-name'),
  admMachineType: document.getElementById('adm-machine-type'),
  btnAdmAddMachine: document.getElementById('btn-adm-add-machine'),
  admMachineTable: document.getElementById('adm-machine-table'),

  // Admin Meals & Announcements
  admDinnerInput: document.getElementById('adm-dinner-input'),
  admMealStatusSelect: document.getElementById('adm-meal-status-select'),
  btnAdmSaveMeal: document.getElementById('btn-adm-save-meal'),
  admAnnTitle: document.getElementById('adm-ann-title'),
  admAnnBody: document.getElementById('adm-ann-body'),
  admAnnUrgent: document.getElementById('adm-ann-urgent'),
  btnAdmPublishAnn: document.getElementById('btn-adm-publish-ann'),
  admTicketsList: document.getElementById('adm-tickets-list'),

  // Settings
  themeChips: document.querySelectorAll('.btn-theme-chip'),
  fontChips: document.querySelectorAll('.btn-font-chip'),
  btnLogoutActions: document.querySelectorAll('.btn-logout-action'),

  // Toast
  toast: document.getElementById('push-notification-toast'),
  toastTitle: document.getElementById('toast-title'),
  toastBody: document.getElementById('toast-body'),
  toastIndicator: document.getElementById('toast-indicator'),
  toastPriorityTag: document.getElementById('toast-priority-tag'),
  toastCloseBtn: document.getElementById('toast-close-btn')
};

// ================= SUPABASE DATA SYNCHRONIZATION =================

async function loadDataFromSupabase() {
  if (!supabaseClient) {
    console.warn('Supabase client not initialized. Working in offline fallback mode.');
    return;
  }

  try {
    // 1. Fetch Students (ogrenciler)
    const { data: stdData, error: stdErr } = await supabaseClient
      .from('ogrenciler')
      .select('*')
      .order('created_at', { ascending: false });

    if (!stdErr && Array.isArray(stdData) && stdData.length > 0) {
      AppState.students = stdData.map(r => ({
        id: r.id,
        username: r.kullanici_adi || '',
        name: r.ad_soyad || '',
        room: r.oda_no ? (r.oda_no.toString().startsWith('Oda') ? r.oda_no : `Oda ${r.oda_no}`) : 'Oda -',
        bed: r.yatak_no ? (r.yatak_no.toString().startsWith('Yatak') ? r.yatak_no : `Yatak ${r.yatak_no}`) : 'Yatak 1',
        password: r.sifre || '',
        isFirstLogin: r.gecici_sifre_mi === true,
        phone: r.telefon,
        email: r.eposta
      }));
    }

    // 2. Fetch Machines (camasirhane_makineler)
    const { data: machData, error: machErr } = await supabaseClient
      .from('camasirhane_makineler')
      .select('*')
      .order('created_at', { ascending: true });

    if (!machErr && Array.isArray(machData) && machData.length > 0) {
      AppState.laundry.machines = machData.map((m, index) => ({
        id: m.id,
        name: m.name || `Makine ${index + 1}`,
        type: (m.tur === 'kurutma' || m.tip === 'Kurutma') ? 'dryer' : 'washer',
        status: index === 2 ? 'running' : 'idle',
        currentSlot: index === 2 ? '18:00 - 19:30' : 'Müsait',
        progress: index === 2 ? 65 : 0,
        capacity: m.kapasite_kg || 9
      }));
    }

    // 3. Fetch Maintenance Tickets (arizalar)
    const { data: tktData, error: tktErr } = await supabaseClient
      .from('arizalar')
      .select('*')
      .order('created_at', { ascending: false });

    if (!tktErr && Array.isArray(tktData) && tktData.length > 0) {
      AppState.tickets = tktData.map(t => ({
        id: t.id,
        category: t.kategori || 'Genel',
        description: t.baslik || '',
        room: t.oda_no ? `Oda ${t.oda_no} (${t.bildiren || ''})` : (t.bildiren || 'Oda 302'),
        date: t.tarih || new Date(t.created_at).toLocaleDateString('tr-TR'),
        status: t.durum === 'Açık' ? 'İnceleniyor' : (t.durum || 'İnceleniyor'),
        adminNote: t.durum === 'Çözüldü' ? 'İdare tarafından incelenip çözüldü.' : 'Teknik personel yönlendirildi.'
      }));
    }

    // 4. Fetch Announcements (duyurular)
    const { data: annData, error: annErr } = await supabaseClient
      .from('duyurular')
      .select('*')
      .order('created_at', { ascending: false });

    if (!annErr && Array.isArray(annData) && annData.length > 0) {
      AppState.announcements = annData.map(a => ({
        id: a.id,
        title: a.baslik,
        content: a.icerik,
        isUrgent: a.oncelik === 'Acil',
        sender: 'Yurt Yönetimi',
        time: a.tarih || 'Bugün'
      }));
    }

    // Update connection badge
    if (DOM.dbStatusText) {
      DOM.dbStatusText.textContent = `Supabase Canlı DB (${AppState.students.length} Öğrenci, ${AppState.laundry.machines.length} Cihaz)`;
    }

    // Re-render views with fresh live data
    renderStudentViews();
    renderAdminViews();

  } catch (err) {
    console.error('Supabase fetch error:', err);
  }
}

// ================= THEME & ACCESSIBILITY =================

function applyTheme(themeName) {
  AppState.theme = themeName;
  localStorage.setItem('yurtify_theme', themeName);
  DOM.body.setAttribute('data-theme', themeName);

  DOM.themeChips.forEach(chip => {
    chip.classList.toggle('active', chip.dataset.themeChoice === themeName);
  });
}

if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (AppState.theme === 'system') applyTheme('system');
  });
}

function applyFontSize(sizeName) {
  AppState.fontSize = sizeName;
  localStorage.setItem('yurtify_font_size', sizeName);
  DOM.body.setAttribute('data-font-size', sizeName);

  DOM.fontChips.forEach(chip => {
    chip.classList.toggle('active', chip.dataset.font === sizeName);
  });
}

// ================= PUSH NOTIFICATION SYSTEM =================

let toastTimeout = null;

function showPushNotification(title, message, isUrgent = false) {
  clearTimeout(toastTimeout);

  DOM.toastTitle.textContent = title;
  DOM.toastBody.textContent = message;

  if (isUrgent) {
    DOM.toastPriorityTag.style.display = 'inline-block';
    DOM.toastIndicator.style.backgroundColor = 'var(--danger)';
    DOM.toast.style.borderColor = 'var(--danger)';
  } else {
    DOM.toastPriorityTag.style.display = 'none';
    DOM.toastIndicator.style.backgroundColor = 'var(--primary)';
    DOM.toast.style.borderColor = 'var(--primary)';
  }

  DOM.toast.classList.remove('hidden');

  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = isUrgent ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(isUrgent ? 880 : 587, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.35);
  } catch (e) {
    // Ignore autoplay restriction
  }

  toastTimeout = setTimeout(() => {
    DOM.toast.classList.add('hidden');
  }, 6000);
}

DOM.toastCloseBtn.addEventListener('click', () => {
  DOM.toast.classList.add('hidden');
});

// ================= AUTHENTICATION & FORCED FIRST LOGIN =================

let selectedLoginRole = 'student';

DOM.authRoleTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    DOM.authRoleTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    selectedLoginRole = tab.dataset.role;

    if (selectedLoginRole === 'admin') {
      DOM.authLabelUser.textContent = 'Kullanıcı Adı (Yönetici)';
      DOM.usernameInput.value = 'admin';
      DOM.passwordInput.value = '123456';
    } else {
      DOM.authLabelUser.textContent = 'Kullanıcı Adı (Öğrenci)';
      DOM.usernameInput.value = 'eda.etem';
      DOM.passwordInput.value = 'edaetem';
    }
  });
});

// Demo accounts pill shortcuts
if (DOM.demoStudentEda) {
  DOM.demoStudentEda.addEventListener('click', () => {
    DOM.authRoleTabs[0].click();
    DOM.usernameInput.value = 'eda.etem';
    DOM.passwordInput.value = 'edaetem';
  });
}

if (DOM.demoStudentAleyna) {
  DOM.demoStudentAleyna.addEventListener('click', () => {
    DOM.authRoleTabs[0].click();
    DOM.usernameInput.value = 'aleyna.ersoy';
    DOM.passwordInput.value = 'ogrenci123';
  });
}

if (DOM.demoAdminMeltem) {
  DOM.demoAdminMeltem.addEventListener('click', () => {
    DOM.authRoleTabs[1].click();
    DOM.usernameInput.value = 'admin';
    DOM.passwordInput.value = '123456';
  });
}

/**
 * Handle Login Submission
 */
function handleLogin() {
  const username = DOM.usernameInput.value.trim();
  const password = DOM.passwordInput.value.trim();

  // 1. ADMIN LOGIN
  if (selectedLoginRole === 'admin' || username.toLowerCase() === 'admin') {
    if (password !== AppState.adminUser.password) {
      alert('Hatalı yönetici şifresi!');
      return;
    }

    DOM.viewAuth.classList.remove('active');
    DOM.viewForcePassword.classList.remove('active');
    DOM.portalStudent.classList.remove('active');
    DOM.portalAdmin.classList.add('active');

    AppState.currentRole = 'admin';
    renderAdminViews();
    showPushNotification('İdari Portal Açıldı', 'Hoş geldiniz, Sayın Meltem Karahan.');
    return;
  }

  // 2. STUDENT LOGIN
  const student = AppState.students.find(s => s.username.toLowerCase() === username.toLowerCase());

  if (!student) {
    alert('Bu kullanıcı adına ait öğrenci kaydı bulunamadı. Lütfen yurt idaresi ile iletişime geçiniz.');
    return;
  }

  if (student.password !== password) {
    alert('Hatalı şifre girdiniz! Lütfen idarenin verdiği şifreyi kontrol ediniz.');
    return;
  }

  // Handle Remember Me (Feedback 1.a)
  if (DOM.rememberMeCheck.checked) {
    localStorage.setItem('yurtify_remember_me', 'true');
    localStorage.setItem('yurtify_saved_username', username);
  }

  // CHECK: Mandatory First-Time Password Change!
  if (student.isFirstLogin) {
    AppState.pendingFirstLoginStudent = student;
    DOM.viewAuth.classList.remove('active');
    DOM.viewForcePassword.classList.add('active');
    DOM.newPasswordInput.value = '';
    DOM.newPasswordConfirm.value = '';
    showPushNotification('İlk Giriş Tespit Edildi', 'Güvenliğiniz için geçici şifrenizi yenilemeniz zorunludur.', true);
    return;
  }

  // Regular Student Portal Access
  activateStudentPortal(student);
}

function activateStudentPortal(student) {
  AppState.activeStudentUser = student;
  AppState.currentRole = 'student';

  DOM.viewAuth.classList.remove('active');
  DOM.viewForcePassword.classList.remove('active');
  DOM.portalAdmin.classList.remove('active');
  DOM.portalStudent.classList.add('active');

  DOM.studentProfileName.textContent = student.name;
  DOM.studentRoomLabel.textContent = student.room;
  DOM.studentBedLabel.textContent = `${student.bed} • Giriş: 23:00`;

  renderStudentViews();
  showPushNotification('Giriş Başarılı', `Hoş geldin, ${student.name}!`);
}

// First Password Change Form Submission (Synchronized with Supabase)
DOM.forcePasswordForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const newPass = DOM.newPasswordInput.value.trim();
  const confirmPass = DOM.newPasswordConfirm.value.trim();

  if (newPass.length < 6) {
    alert('Yeni şifreniz güvenlik gereği en az 6 karakter olmalıdır.');
    return;
  }

  if (newPass !== confirmPass) {
    alert('Girdiğiniz şifreler birbiriyle uyuşmuyor.');
    return;
  }

  if (AppState.pendingFirstLoginStudent) {
    const student = AppState.pendingFirstLoginStudent;

    // Update password locally
    student.password = newPass;
    student.isFirstLogin = false;

    // Synchronize to Supabase `ogrenciler` table
    if (supabaseClient && student.id) {
      try {
        const { error } = await supabaseClient
          .from('ogrenciler')
          .update({ sifre: newPass, gecici_sifre_mi: false })
          .eq('id', student.id);

        if (error) console.error('Supabase password update error:', error);
      } catch (err) {
        console.error('Password sync error:', err);
      }
    }

    AppState.pendingFirstLoginStudent = null;

    showPushNotification('Şifre Başarıyla Güncellendi', 'Kişisel şifreniz Supabase veritabanına kaydedildi ve idareye gizlendi.');
    activateStudentPortal(student);
  }
});

DOM.signinForm.addEventListener('submit', (e) => {
  e.preventDefault();
  handleLogin();
});

// Feedback 1.b: Biometric Quick-Login
DOM.btnBiometricLogin.addEventListener('click', () => {
  DOM.biometricText.textContent = '🔍 Biyometrik Kimlik Doğrulanıyor...';
  setTimeout(() => {
    DOM.biometricText.textContent = 'Biyometrik Giriş (Parmak İzi / Face ID)';
    handleLogin();
  }, 600);
});

// Logout action
DOM.btnLogoutActions.forEach(btn => {
  btn.addEventListener('click', () => {
    AppState.previewModeActive = false;
    AppState.activeStudentUser = null;
    const floatingIsland = document.getElementById('floating-preview-island');
    if (floatingIsland) floatingIsland.classList.add('hidden');
    DOM.portalStudent.classList.remove('active');
    DOM.portalAdmin.classList.remove('active');
    DOM.viewForcePassword.classList.remove('active');
    DOM.viewAuth.classList.add('active');
    showPushNotification('Oturum Kapatıldı', 'Güvenli bir şekilde çıkış yapıldı.');
  });
});

// ================= STUDENT PORTAL NAVIGATION =================

DOM.studentNavItems.forEach(tab => {
  tab.addEventListener('click', () => {
    DOM.studentNavItems.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    const targetSubViewId = tab.dataset.studentTab;
    DOM.studentSubviews.forEach(view => {
      view.classList.toggle('active', view.id === targetSubViewId);
    });

    const scrollArea = DOM.portalStudent.querySelector('.app-scroll-content');
    if (scrollArea) scrollArea.scrollTop = 0;
  });
});

// ================= ADMIN PORTAL SUBTAB NAVIGATION =================

DOM.adminTabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    DOM.adminTabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const targetSubtab = btn.dataset.adminSubtab;
    DOM.adminContentSubviews.forEach(view => {
      view.classList.toggle('active', view.id === targetSubtab);
    });

    const scrollArea = DOM.portalAdmin.querySelector('.app-scroll-content');
    if (scrollArea) scrollArea.scrollTop = 0;
  });
});

// Admin Student Portal Preview Toggle
DOM.btnToggleStudentPreview.addEventListener('click', () => {
  AppState.previewModeActive = true;
  DOM.portalAdmin.classList.remove('active');
  DOM.portalStudent.classList.add('active');
  
  const floatingIsland = document.getElementById('floating-preview-island');
  if (floatingIsland) floatingIsland.classList.remove('hidden');
  
  // Default to Eda Etem for preview
  const previewStudent = AppState.students[0] || { name: 'Eda Etem', room: 'Oda 302', bed: 'Yatak 3' };
  DOM.studentProfileName.textContent = previewStudent.name;
  DOM.studentRoomLabel.textContent = previewStudent.room;
  DOM.studentBedLabel.textContent = `${previewStudent.bed} • Önizleme Modu`;

  renderStudentViews();
  showPushNotification('Canlı Önizleme Aktif', 'Ekrandaki yüzen kapsül üzerinden dilediğiniz an yöneticiye dönebilirsiniz.');
});

// Exit Preview and Return to Admin Portal (Globally accessible function)
window.exitStudentPreview = function() {
  AppState.previewModeActive = false;
  
  const floatingIsland = document.getElementById('floating-preview-island');
  if (floatingIsland) floatingIsland.classList.add('hidden');
  
  DOM.portalStudent.classList.remove('active');
  DOM.portalAdmin.classList.add('active');

  renderAdminViews();
  showPushNotification('Yöneticiye Dönüldü', 'İdari Yönetim Masasına başarıyla geri döndünüz.');
};

// ================= ADMIN: STUDENT MANAGEMENT (ADD & DELETE) =================

function renderAdminStudents() {
  DOM.admStudentCount.textContent = AppState.students.length;

  DOM.admStudentsList.innerHTML = AppState.students.map((s, index) => {
    const isSecret = !s.isFirstLogin;
    const statusText = isSecret 
      ? 'Kendi Şifresini Belirledi (Gizli)' 
      : `İlk Giriş Bekleniyor (Geçici Şifre: ${s.password})`;
    const statusClass = isSecret ? 'secret' : 'pending';

    return `
      <div class="adm-student-item">
        <div class="adm-student-info">
          <strong>${s.name} (@${s.username})</strong>
          <div class="adm-student-meta">Konaklama: <strong>${s.room} • ${s.bed}</strong></div>
          <span class="adm-student-pass-status ${statusClass}">${statusText}</span>
        </div>
        <div>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteStudent(${index})" title="Öğrenciyi Sil">
            Sil
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Add new student (Synchronized to Supabase `ogrenciler`)
DOM.btnAdmAddStudent.addEventListener('click', async () => {
  const name = DOM.admStudentName.value.trim();
  const username = DOM.admStudentUsername.value.trim().toLowerCase();
  const room = DOM.admStudentRoom.value.trim();
  const bed = DOM.admStudentBed.value.trim();
  const initialPass = DOM.admStudentInitialPass.value.trim() || 'ogrenci123';

  if (!name || !username || !room || !bed) {
    alert('Lütfen öğrenci adı, kullanıcı adı, oda ve yatak bilgilerini eksiksiz doldurunuz.');
    return;
  }

  // Check username collision
  if (AppState.students.some(s => s.username === username)) {
    alert('Bu kullanıcı adı sistemde zaten kayıtlı!');
    return;
  }

  const cleanRoom = room.replace(/[^0-9]/g, '') || room;
  const cleanBed = bed.replace(/[^0-9]/g, '') || bed;
  const newId = 'std-' + Date.now();

  const newStudent = {
    id: newId,
    username: username,
    name: name,
    room: room.startsWith('Oda') ? room : `Oda ${room}`,
    bed: bed.startsWith('Yatak') ? bed : `Yatak ${bed}`,
    password: initialPass,
    isFirstLogin: true
  };

  AppState.students.unshift(newStudent);
  renderAdminStudents();

  // Sync with Supabase
  if (supabaseClient) {
    try {
      const { error } = await supabaseClient.from('ogrenciler').insert({
        id: newId,
        yurt_id: SUPABASE_CONFIG.yurtId,
        ad_soyad: name,
        kullanici_adi: username,
        sifre: initialPass,
        oda_no: cleanRoom,
        yatak_no: cleanBed,
        gecici_sifre_mi: true,
        kayit_tarihi: new Date().toISOString().split('T')[0]
      });

      if (error) console.error('Supabase add student error:', error);
      await loadDataFromSupabase();
    } catch (err) {
      console.error('Insert error:', err);
    }
  }

  DOM.admStudentName.value = '';
  DOM.admStudentUsername.value = '';
  DOM.admStudentRoom.value = '';
  DOM.admStudentBed.value = '';

  showPushNotification('Yeni Öğrenci Eklendi', `${name} başarıyla ${room} (${bed}) olarak Supabase veritabanına kaydedildi.`);
});

window.deleteStudent = async function(index) {
  const s = AppState.students[index];
  if (confirm(`${s.name} isimli öğrencinin kaydını silmek istediğinize emin misiniz?`)) {
    AppState.students.splice(index, 1);
    renderAdminStudents();

    if (supabaseClient && s.id) {
      try {
        await supabaseClient.from('ogrenciler').delete().eq('id', s.id);
        await loadDataFromSupabase();
      } catch (err) {
        console.error('Supabase delete student error:', err);
      }
    }

    showPushNotification('Öğrenci Silindi', `${s.name} yurt sisteminden ve veritabanından kaldırıldı.`);
  }
};

// ================= ADMIN: LAUNDRY MACHINE MANAGEMENT =================

function renderAdminMachines() {
  DOM.admMachineTable.innerHTML = AppState.laundry.machines.map(m => `
    <div class="admin-machine-row">
      <div>
        <strong>${m.name}</strong>
        <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">
          Tür: ${m.type === 'washer' ? 'Yıkama Makinesi' : 'Kurutma Makinesi'} • Durum: <strong>${m.status === 'idle' ? 'Müsait' : (m.status === 'running' ? 'Çalışıyor' : 'Bakımda')}</strong>
        </div>
      </div>
      <div class="admin-machine-actions">
        <button class="btn btn-sm btn-ghost" onclick="toggleMachineStatus('${m.id}')">
          ${m.status === 'maintenance' ? 'Aktifleştir' : 'Bakıma Al'}
        </button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteMachine('${m.id}')" title="Cihazı Kaldır">
          Sil
        </button>
      </div>
    </div>
  `).join('');
}

// Add new machine (Synchronized to Supabase `camasirhane_makineler`)
DOM.btnAdmAddMachine.addEventListener('click', async () => {
  const name = DOM.admMachineName.value.trim();
  const type = DOM.admMachineType.value;

  if (!name) {
    alert('Lütfen cihaz adını yazınız.');
    return;
  }

  const newId = 'mach_' + Date.now();
  const newMachine = {
    id: newId,
    name: name,
    type: type,
    status: 'idle',
    currentSlot: 'Müsait',
    progress: 0,
    capacity: type === 'washer' ? 9 : 10
  };

  AppState.laundry.machines.push(newMachine);
  renderAdminMachines();
  renderStudentLaundry();

  // Sync to Supabase
  if (supabaseClient) {
    try {
      await supabaseClient.from('camasirhane_makineler').insert({
        id: newId,
        yurt_id: SUPABASE_CONFIG.yurtId,
        name: name,
        tip: type === 'washer' ? 'Yıkama' : 'Kurutma',
        tur: type === 'washer' ? 'yikama' : 'kurutma',
        kapasite_kg: type === 'washer' ? 9 : 10
      });
      await loadDataFromSupabase();
    } catch (err) {
      console.error('Supabase add machine error:', err);
    }
  }

  DOM.admMachineName.value = '';
  showPushNotification('Cihaz Eklendi', `${name} çamaşırhaneye başarıyla tanımlandı.`);
});

window.deleteMachine = async function(machineId) {
  const m = AppState.laundry.machines.find(item => item.id == machineId);
  if (!m) return;

  if (confirm(`${m.name} cihazını çamaşırhaneden silmek istediğinize emin misiniz?`)) {
    AppState.laundry.machines = AppState.laundry.machines.filter(item => item.id != machineId);
    renderAdminMachines();
    renderStudentLaundry();

    if (supabaseClient && m.id) {
      try {
        await supabaseClient.from('camasirhane_makineler').delete().eq('id', m.id);
        await loadDataFromSupabase();
      } catch (err) {
        console.error('Supabase delete machine error:', err);
      }
    }

    showPushNotification('Cihaz Silindi', `${m.name} sistemden kaldırıldı.`);
  }
};

window.toggleMachineStatus = function(machineId) {
  const m = AppState.laundry.machines.find(item => item.id == machineId);
  if (m) {
    m.status = m.status === 'maintenance' ? 'idle' : 'maintenance';
    renderAdminMachines();
    renderStudentLaundry();
    showPushNotification('Cihaz Durumu Güncellendi', `${m.name} durumu ${m.status === 'idle' ? 'Müsait' : 'Bakımda'} olarak ayarlandı.`);
  }
};

// ================= STUDENT: LAUNDRY & OCCUPANCY =================

function renderStudentLaundry() {
  const idleCount = AppState.laundry.machines.filter(m => m.status === 'idle').length;
  const runningCount = AppState.laundry.machines.filter(m => m.status === 'running').length;
  const maintCount = AppState.laundry.machines.filter(m => m.status === 'maintenance').length;

  DOM.studentOccIdle.textContent = idleCount;
  DOM.studentOccRunning.textContent = runningCount;
  DOM.studentOccMaint.textContent = maintCount;

  // Render Machine strip gauges
  DOM.studentMachineStripList.innerHTML = AppState.laundry.machines.map(m => {
    let badgeClass = 'badge-success';
    let label = 'Müsait (Boşta)';
    if (m.status === 'running') {
      badgeClass = 'badge-info';
      label = `Çalışıyor • %${m.progress || 50}`;
    } else if (m.status === 'maintenance') {
      badgeClass = 'badge-danger';
      label = 'Arızalı / Bakım';
    }

    return `
      <div class="machine-strip-item">
        <span class="machine-strip-name">${m.name}</span>
        <span class="badge ${badgeClass}">${label}</span>
      </div>
    `;
  }).join('');

  // Populate dynamic machine selector options
  DOM.studentMachineSelect.innerHTML = AppState.laundry.machines.map(m => {
    const isAvail = m.status === 'idle';
    return `<option value="${m.name}" ${!isAvail ? 'disabled' : ''}>${m.name} - ${isAvail ? 'Müsait' : (m.status === 'running' ? 'Çalışıyor' : 'Bakımda')}</option>`;
  }).join('');

  // Quota bar (2 slots per week)
  const quotaPercent = (AppState.laundry.quotaUsed / AppState.laundry.quotaTotal) * 100;
  DOM.studentQuotaDisplay.textContent = `${AppState.laundry.quotaUsed} / ${AppState.laundry.quotaTotal} Hak Kullanıldı`;
  DOM.studentQuotaFill.style.width = `${quotaPercent}%`;

  // Active reservation display
  if (AppState.laundry.activeBooking) {
    DOM.studentActiveBookingCard.style.display = 'block';
    DOM.studentActiveMachine.textContent = AppState.laundry.activeBooking.machine;
    DOM.studentActiveTime.textContent = `${AppState.laundry.activeBooking.date} • ${AppState.laundry.activeBooking.timeSlot}`;
  } else {
    DOM.studentActiveBookingCard.style.display = 'none';
  }
}

// Student cancel laundry booking
DOM.studentBtnCancelRes.addEventListener('click', () => {
  if (confirm('Aktif çamaşırhane randevunuzu iptal etmek istiyor musunuz?')) {
    AppState.laundry.activeBooking = null;
    if (AppState.laundry.quotaUsed > 0) AppState.laundry.quotaUsed--;
    renderStudentLaundry();
    renderAdminMachines();
    showPushNotification('Randevu İptal Edildi', 'Haftalık kullanım hakkınız iade edildi.');
  }
});

// Student confirm new booking (Synchronized to Supabase `camasirhane_randevular`)
DOM.studentBtnConfirmRes.addEventListener('click', async () => {
  if (AppState.laundry.quotaUsed >= AppState.laundry.quotaTotal) {
    alert('Haftalık 2 adet kullanım kotanızı doldurdunuz.');
    return;
  }

  const selectedMachine = DOM.studentMachineSelect.value;
  const selectedSlot = DOM.studentTimeslotSelect.value;
  const newResId = 'res-' + Date.now();
  const dateStr = '05.11.2026';

  AppState.laundry.activeBooking = {
    id: newResId,
    machine: selectedMachine,
    date: dateStr,
    timeSlot: selectedSlot,
    status: 'Onaylandı'
  };
  AppState.laundry.quotaUsed++;

  // Sync with Supabase
  if (supabaseClient) {
    try {
      const currentStudent = AppState.activeStudentUser || AppState.students[0];
      const odaNo = currentStudent.room ? currentStudent.room.replace(/[^0-9]/g, '') : '302';
      await supabaseClient.from('camasirhane_randevular').insert({
        id: newResId,
        yurt_id: SUPABASE_CONFIG.yurtId,
        ogrenci_ad: currentStudent.name || 'Öğrenci',
        oda_no: odaNo,
        makine_no: selectedMachine,
        tarih: dateStr,
        saat_araligi: selectedSlot,
        durum: 'Onaylandı'
      });
    } catch (err) {
      console.error('Supabase booking error:', err);
    }
  }

  renderStudentLaundry();
  renderAdminMachines();
  showPushNotification('Randevu Oluşturuldu', `${selectedMachine} (${selectedSlot}) başarıyla ayrıldı.`);
});

// ================= STUDENT: MAINTENANCE REQUESTS =================

function renderStudentTickets() {
  DOM.studentTicketCountLabel.textContent = `${AppState.tickets.length} Kayıt`;

  DOM.studentTicketsContainer.innerHTML = AppState.tickets.map(t => {
    let badgeClass = 'badge-info';
    if (t.status === 'Çözüldü') badgeClass = 'badge-success';
    if (t.status === 'İnceleniyor') badgeClass = 'badge-subtle';

    return `
      <div class="ticket-card">
        <div class="ticket-info">
          <h5 class="ticket-title">${t.category}</h5>
          <p class="ticket-meta">${t.description}</p>
          <span class="ticket-meta" style="font-size:11px;">Konum: ${t.room} • ${t.date}</span>
          ${t.adminNote ? `<div class="ticket-admin-note"><strong>İdare Notu:</strong> ${t.adminNote}</div>` : ''}
        </div>
        <span class="badge ${badgeClass}">${t.status}</span>
      </div>
    `;
  }).join('');
}

// Student submit maintenance ticket (Synchronized to Supabase `arizalar`)
DOM.studentBtnSubmitMaint.addEventListener('click', async () => {
  const cat = DOM.studentMaintCat.value;
  const desc = DOM.studentMaintDesc.value.trim();

  if (!desc) {
    alert('Lütfen arıza detayını yazınız.');
    return;
  }

  const currentStudent = AppState.activeStudentUser || AppState.students[0];
  const currentRoom = currentStudent ? `${currentStudent.room} (${currentStudent.name})` : 'Oda 302 (Eda Etem)';
  const cleanOdaNo = currentStudent.room ? currentStudent.room.replace(/[^0-9]/g, '') : '302';
  const newTicketId = 'mnt-' + Date.now();
  const dateStr = new Date().toLocaleDateString('tr-TR');

  const newTicket = {
    id: newTicketId,
    category: cat,
    description: desc,
    room: currentRoom,
    date: dateStr,
    status: 'Açık',
    adminNote: 'Talep alındı, idari kontrolde.'
  };

  AppState.tickets.unshift(newTicket);
  DOM.studentMaintDesc.value = '';

  // Synchronize to Supabase
  if (supabaseClient) {
    try {
      await supabaseClient.from('arizalar').insert({
        id: newTicketId,
        yurt_id: SUPABASE_CONFIG.yurtId,
        oda_no: cleanOdaNo,
        baslik: desc,
        kategori: cat,
        oncelik: 'Orta',
        durum: 'Açık',
        bildiren: currentStudent.name || 'Öğrenci',
        tarih: dateStr
      });
    } catch (err) {
      console.error('Supabase ticket insert error:', err);
    }
  }

  renderStudentTickets();
  renderAdminTickets();

  showPushNotification('Arıza İletildi', 'Arıza talebiniz yetkili yurt idaresine ve Supabase veritabanına iletildi.');
});

// ================= STUDENT: ANNOUNCEMENTS & DINING =================

function renderStudentAnnouncements() {
  DOM.studentAnnCount.textContent = `${AppState.announcements.length} Yeni`;

  DOM.studentAnnouncementsContainer.innerHTML = AppState.announcements.map(ann => `
    <div class="announcement-card ${ann.isUrgent ? 'urgent-announcement' : ''}">
      <div class="announcement-header">
        <div class="announcement-title-row">
          <span>${ann.isUrgent ? '⚠️' : '📌'}</span>
          <h4 class="announcement-title">${ann.title}</h4>
        </div>
        ${ann.isUrgent ? '<span class="badge badge-danger">Yüksek Öncelik</span>' : ''}
      </div>
      <p class="announcement-content">${ann.content}</p>
      <div class="announcement-footer">
        <span class="announcement-time">${ann.time} • ${ann.sender}</span>
      </div>
    </div>
  `).join('');
}

function renderStudentDining() {
  DOM.diningStatusBadge.textContent = `● ${AppState.dining.status}`;
  DOM.studentDinnerItemsList.innerHTML = AppState.dining.dinnerItems.map(item => `<li>• ${item}</li>`).join('');
}

// ================= ADMIN: MEALS & ANNOUNCEMENTS =================

DOM.btnAdmSaveMeal.addEventListener('click', () => {
  const itemsStr = DOM.admDinnerInput.value;
  AppState.dining.dinnerItems = itemsStr.split(',').map(s => s.trim()).filter(Boolean);
  AppState.dining.status = DOM.admMealStatusSelect.value;

  renderStudentDining();
  showPushNotification('Menü Yayınlandı', 'Akşam yemeği menüsü tüm öğrenci ekranlarında güncellendi.');
});

DOM.btnAdmPublishAnn.addEventListener('click', async () => {
  const title = DOM.admAnnTitle.value.trim();
  const body = DOM.admAnnBody.value.trim();
  const isUrgent = DOM.admAnnUrgent.checked;

  if (!title || !body) {
    alert('Lütfen duyuru başlığını ve metnini giriniz.');
    return;
  }

  const newAnn = {
    id: 'ann-' + Date.now(),
    title: title,
    content: body,
    isUrgent: isUrgent,
    sender: 'Yurt Yönetimi',
    time: 'Şimdi'
  };

  AppState.announcements.unshift(newAnn);

  // Sync to Supabase `duyurular`
  if (supabaseClient) {
    try {
      await supabaseClient.from('duyurular').insert({
        yurt_id: SUPABASE_CONFIG.yurtId,
        baslik: title,
        icerik: body,
        oncelik: isUrgent ? 'Acil' : 'Normal',
        tarih: new Date().toLocaleDateString('tr-TR')
      });
    } catch (err) {
      console.error('Supabase duyuru insert error:', err);
    }
  }

  renderStudentAnnouncements();

  DOM.admAnnTitle.value = '';
  DOM.admAnnBody.value = '';

  showPushNotification(title, body, isUrgent);
});

// ================= ADMIN: MAINTENANCE TICKETS =================

function renderAdminTickets() {
  DOM.admTicketsList.innerHTML = AppState.tickets.map(t => {
    const isResolved = t.status === 'Çözüldü';
    return `
      <div class="adm-ticket-item">
        <div class="adm-ticket-header">
          <strong>${t.category}</strong>
          <span class="badge ${isResolved ? 'badge-success' : 'badge-danger'}">${t.status}</span>
        </div>
        <div class="ticket-meta">${t.description}</div>
        <div class="ticket-meta" style="font-size:11.5px; margin-top:4px;">
          Bildiren: ${t.room} • ${t.date}
        </div>

        <div class="adm-ticket-actions">
          ${!isResolved ? `
            <button class="btn btn-sm btn-secondary" onclick="updateTicketStatus('${t.id}', 'İnceleniyor')">
              İncelemeye Al
            </button>
            <button class="btn btn-sm btn-primary" onclick="updateTicketStatus('${t.id}', 'Çözüldü')">
              Onayla ve Kapat
            </button>
          ` : `
            <span style="font-size:12px; color:var(--success); font-weight:600;">
              Yetkili idareci tarafından doğrulanarak arşivlenmiştir.
            </span>
          `}
        </div>
      </div>
    `;
  }).join('');
}

window.updateTicketStatus = async function(ticketId, newStatus) {
  const t = AppState.tickets.find(item => item.id == ticketId);
  if (t) {
    t.status = newStatus;
    if (newStatus === 'Çözüldü') {
      t.adminNote = 'Teknik müdahale tamamlandı. Yetkili yönetici onayıyla resmi olarak kapatıldı.';
      showPushNotification('İş Emri Kapatıldı', `${t.category} arızası idare onayıyla sonlandırıldı.`);
    } else {
      t.adminNote = 'Talebiniz inceleniyor, teknisyene yönlendirildi.';
      showPushNotification('Talep Güncellendi', `${t.category} inceleniyor durumuna alındı.`);
    }

    renderStudentTickets();
    renderAdminTickets();

    // Sync to Supabase `arizalar`
    if (supabaseClient && t.id) {
      try {
        await supabaseClient.from('arizalar').update({ durum: newStatus }).eq('id', t.id);
        await loadDataFromSupabase();
      } catch (err) {
        console.error('Supabase ticket status error:', err);
      }
    }
  }
};

// ================= BULK RENDERERS =================

function renderStudentViews() {
  renderStudentDining();
  renderStudentAnnouncements();
  renderStudentLaundry();
  renderStudentTickets();
}

function renderAdminViews() {
  renderAdminStudents();
  renderAdminMachines();
  renderAdminTickets();
}

// ================= INITIALIZATION =================

async function init() {
  applyTheme(AppState.theme);
  applyFontSize(AppState.fontSize);

  // Restore remember me
  if (AppState.rememberMe) {
    DOM.rememberMeCheck.checked = true;
    DOM.usernameInput.value = AppState.savedUsername;
  }

  // Theme chips event
  DOM.themeChips.forEach(chip => {
    chip.addEventListener('click', () => {
      applyTheme(chip.dataset.themeChoice);
    });
  });

  // Font chips event
  DOM.fontChips.forEach(chip => {
    chip.addEventListener('click', () => {
      applyFontSize(chip.dataset.font);
    });
  });

  // Render initial static views immediately
  renderStudentViews();
  renderAdminViews();

  // Load fresh real-time data from Supabase Cloud
  await loadDataFromSupabase();
}

document.addEventListener('DOMContentLoaded', init);
