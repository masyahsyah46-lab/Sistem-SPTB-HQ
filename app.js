// app.js - V6.5.1 (WEB APP VERSION)
// (UPDATED: Separated Search Box for History Tab, Dynamic URL Routing, Anonymous Access, Mobile UI Polish, Unique ID, Fixed CORS & WhatsApp Popup, Pemutihan Email Confirmation, Ketua Seksyen Tab Fixes)

document.addEventListener('DOMContentLoaded', () => {
  console.log("STB Web App V6.5.1 Loaded - Separated History Search, Dynamic Routing, Anonymous Access, Mobile Menu, Pemutihan Email & Ketua Seksyen Fixes");

  // URL APPSCRIPT
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwPbH9NyPh5IvklgClgr-aa_hbbMOnI_KZVdpAK5wE0B3ay0ml3QCyua1HjWL_G7vw/exec';
  
  // =========================================================================
  // PEMBALUT LOCALSTORAGE (Menggantikan chrome.storage.local)
  // =========================================================================
  const storageWrapper = {
    get: function(keys) {
      return new Promise((resolve) => {
        let result = {};
        keys.forEach(key => {
          let val = window.localStorage.getItem(key);
          if (val !== null) {
            try {
              result[key] = JSON.parse(val);
            } catch (e) {
              result[key] = val;
            }
          }
        });
        resolve(result);
      });
    },
    set: function(obj) {
      return new Promise((resolve) => {
        for (let key in obj) {
          window.localStorage.setItem(key, JSON.stringify(obj[key]));
        }
        resolve();
      });
    },
    remove: function(keys) {
      return new Promise((resolve) => {
        keys.forEach(key => window.localStorage.removeItem(key));
        resolve();
      });
    }
  };

  // --- AI Model Selection Elements (V6.4.5) ---
  const aiModelSelect = document.getElementById('aiModelSelect');
  const aiProfileModelSelect = document.getElementById('aiProfileModelSelect');

  // --- GLOBAL CHART VARIABLES ---
  let dashboardStatusChart = null;
  let dashboardTypeChart = null;
  let dashboardReasonChart = null;
  let dashboardTrendChart = null;
  let dashboardKonsultansiChart = null;
  
  // =========================================================================
  // V6.4.8: AUDIO & VOLUME CONTROL SYSTEM (WEB APP HTML5 AUDIO)
  // =========================================================================
  
  let isMusicPlaying = false;
  let bgmVolume = 0.5; // Default BGM volume: 50%
  let sfxVolume = 0.7; // Default SFX volume: 70%
  
  // DOM Elements for Audio Controls
  const btnToggleMusic = document.getElementById('btnToggleMusic');
  const bgmVolumeSlider = document.getElementById('bgmVolumeSlider');
  const sfxVolumeSlider = document.getElementById('sfxVolumeSlider');
  const bgmVolumeValue = document.getElementById('bgmVolumeValue');
  const sfxVolumeValue = document.getElementById('sfxVolumeValue');

  // =========================================================================
  // MOBILE MENU DOM ELEMENTS
  // =========================================================================
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const tabsContainer = document.getElementById('tabs-container');
  const menuOverlay = document.getElementById('menuOverlay');
  const anonymousBadge = document.getElementById('anonymousBadge');

  // Setup BGM Audio Element
  const playlist = ['audio/lagu1.mp3', 'audio/lagu2.mp3', 'audio/lagu3.mp3'];
  let currentTrackIndex = 0;
  const bgmAudioElement = new Audio();
  bgmAudioElement.src = playlist[currentTrackIndex];
  bgmAudioElement.addEventListener('ended', () => {
      currentTrackIndex++;
      if (currentTrackIndex >= playlist.length) {
          currentTrackIndex = 0;
      }
      bgmAudioElement.src = playlist[currentTrackIndex];
      bgmAudioElement.play().catch(e => console.error('Gagal memainkan lagu seterusnya:', e));
  });
  
  async function playSoundEffect(soundFile) {
    try {
      let fileName = soundFile;
      if (fileName === 'ui_click.mp3') fileName = 'audio/ui click.mp3';
      else if (fileName === 'positive_chime.mp3') fileName = 'audio/positive chime.mp3';
      else if (fileName === 'error_buzz.mp3') fileName = 'audio/error buzz.mp3';
      else if (!fileName.includes('/')) fileName = 'audio/' + fileName;

      const sfx = new Audio(fileName);
      sfx.volume = sfxVolume;
      await sfx.play();
      console.log(`V6.5.1 (Web) Sound effect played: ${fileName}`);
    } catch (error) {
      console.error(`V6.5.1 (Web) Failed to play sound effect (${soundFile}):`, error);
    }
  }
  
  async function playBackgroundMusic() {
    try {
      bgmAudioElement.volume = bgmVolume;
      await bgmAudioElement.play();
      isMusicPlaying = true;
      updateMusicButtonState(true);
      console.log("V6.5.1 (Web) Muzik mula dimainkan");
    } catch (error) {
      console.error("V6.5.1 (Web) Gagal memainkan muzik:", error);
      isMusicPlaying = false;
      updateMusicButtonState(false);
    }
  }
  
  async function pauseBackgroundMusic() {
    try {
      bgmAudioElement.pause();
      isMusicPlaying = false;
      updateMusicButtonState(false);
      console.log("V6.5.1 (Web) Muzik dijeda");
    } catch (error) {
      console.error("V6.5.1 (Web) Gagal menjeda muzik:", error);
      isMusicPlaying = true;
      updateMusicButtonState(true);
    }
  }
  
  async function toggleBackgroundMusic() {
    if (isMusicPlaying) {
      await pauseBackgroundMusic();
    } else {
      await playBackgroundMusic();
    }
  }
  
  async function updateBgmVolume(newVolume) {
    try {
      bgmVolume = newVolume;
      bgmAudioElement.volume = bgmVolume;
      
      if (bgmVolumeValue) {
        bgmVolumeValue.textContent = Math.round(bgmVolume * 100) + '%';
      }
      
      console.log(`V6.5.1 (Web) BGM volume updated to ${Math.round(bgmVolume * 100)}%`);
    } catch (error) {
      console.error("V6.5.1 (Web) Failed to update BGM volume:", error);
    }
  }
  
  async function updateSfxVolume(newVolume) {
    try {
      sfxVolume = newVolume;
      
      if (sfxVolumeValue) {
        sfxVolumeValue.textContent = Math.round(sfxVolume * 100) + '%';
      }
      
      console.log(`V6.5.1 (Web) SFX volume updated to ${Math.round(sfxVolume * 100)}%`);
    } catch (error) {
      console.error("V6.5.1 (Web) Failed to update SFX volume:", error);
    }
  }
  
  function updateMusicButtonState(playing) {
    isMusicPlaying = playing;
    
    if (!btnToggleMusic) return;
    
    try {
      if (playing) {
        btnToggleMusic.innerHTML = '🔊 Jeda Muzik';
        btnToggleMusic.title = 'Klik untuk jeda muzik latar belakang';
        btnToggleMusic.classList.add('music-playing');
        btnToggleMusic.classList.remove('music-paused');
      } else {
        btnToggleMusic.innerHTML = '🔇 Main Muzik';
        btnToggleMusic.title = 'Klik untuk main muzik latar belakang';
        btnToggleMusic.classList.add('music-paused');
        btnToggleMusic.classList.remove('music-playing');
      }
      
      storageWrapper.set({ 
        'stb_music_playing': isMusicPlaying,
        'stb_bgm_volume': bgmVolume,
        'stb_sfx_volume': sfxVolume
      });
    } catch (error) {
      console.error("V6.5.1 Error updating music button state:", error);
    }
  }
  
  function setupAudioControls() {
    if (btnToggleMusic) {
      btnToggleMusic.addEventListener('click', async () => {
        await toggleBackgroundMusic();
        await playSoundEffect('ui_click.mp3');
      });
    }
    
    if (bgmVolumeSlider) {
      bgmVolumeSlider.addEventListener('change', async (e) => {
        const newVolume = parseFloat(e.target.value);
        await updateBgmVolume(newVolume);
      });
      bgmVolumeSlider.value = bgmVolume;
      if (bgmVolumeValue) {
        bgmVolumeValue.textContent = Math.round(bgmVolume * 100) + '%';
      }
    }
    
    if (sfxVolumeSlider) {
      sfxVolumeSlider.addEventListener('change', async (e) => {
        const newVolume = parseFloat(e.target.value);
        await updateSfxVolume(newVolume);
      });
      sfxVolumeSlider.value = sfxVolume;
      if (sfxVolumeValue) {
        sfxVolumeValue.textContent = Math.round(sfxVolume * 100) + '%';
      }
    }
    
    console.log("V6.5.1 Audio controls setup completed");
  }
  
  function setupGlobalButtonClickSound() {
    document.addEventListener('click', async (e) => {
      const target = e.target.closest('button, .btn, [role="button"], .tab-btn, .tick-btn, .filter-btn');
      
      if (target) {
        if (target === btnToggleMusic) return;
        await playSoundEffect('ui_click.mp3');
      }
    }, true);
    console.log("V6.5.1 Global button click sound setup completed");
  }
  
  // =========================================================================
  // MOBILE MENU LOGIC
  // =========================================================================
  function closeMobileMenu() {
    if (tabsContainer) {
      tabsContainer.classList.remove('show-menu');
    }
    if (menuOverlay) {
      menuOverlay.classList.remove('show');
      menuOverlay.style.display = 'none';
    }
  }

  function openMobileMenu() {
    if (tabsContainer) {
      tabsContainer.classList.add('show-menu');
    }
    if (menuOverlay) {
      menuOverlay.classList.add('show');
      menuOverlay.style.display = 'block';
    }
  }

  function toggleMobileMenu() {
    if (tabsContainer && tabsContainer.classList.contains('show-menu')) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  }

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', toggleMobileMenu);
  }

  if (menuOverlay) {
    menuOverlay.addEventListener('click', closeMobileMenu);
  }

  // Pastikan menu ditutup apabila saiz skrin berubah ke desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      closeMobileMenu();
    }
  });

  async function playSuccessSound() {
    await playSoundEffect('positive_chime.mp3');
  }
  
  async function playErrorSound() {
    await playSoundEffect('error_buzz.mp3');
  }

  // =========================================================================
  // END V6.4.8 AUDIO SYSTEM & MOBILE MENU
  // =========================================================================
  
  // --- FETCH WITH RETRY MECHANISM ---
  async function fetchWithRetry(url, options = {}, maxRetries = 3, delay = 1000) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`V6.5.1 Fetch attempt ${attempt} for ${url.substring(0, 100)}...`);
        
        const response = await fetch(url, options);
        
        if (response.ok) {
          console.log(`V6.5.1 Fetch successful on attempt ${attempt}`);
          return response;
        }
        
        if (response.status === 503) {
          console.warn(`V6.5.1 Service Unavailable (503) on attempt ${attempt}. Retrying...`);
          const backoffDelay = delay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
          continue;
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
        
      } catch (error) {
        lastError = error;
        console.warn(`V6.5.1 Fetch attempt ${attempt} failed:`, error.message);
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        const backoffDelay = delay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
    
    throw lastError;
  }

  // --- Helper function to get user color in HEX ---
  function getUserColorHex(colorName) {
    if (!colorName) return '#2563eb';
    
    const colorUpper = colorName.toUpperCase();
    if (colorUpper.includes('OREN')) return '#ea580c';
    if (colorUpper.includes('HIJAU')) return '#16a34a';
    if (colorUpper.includes('UNGU')) return '#9333ea';
    if (colorUpper.includes('HITAM')) return '#000000';
    if (colorUpper.includes('PINK')) return '#ec4899';
    if (colorUpper.startsWith('#')) return colorName;
    
    return '#2563eb';
  }

  // --- FUNGSI BANTUAN DESTROY CHART ---
  function safeDestroyChart(chartInstance, canvasId) {
    if (chartInstance) {
      try {
        chartInstance.destroy();
      } catch (e) {
        console.warn("V6.5.1 Error destroying chart instance:", e);
      }
    }
    
    if (canvasId) {
      const existingChart = Chart.getChart(canvasId);
      if (existingChart) {
        try {
          existingChart.destroy();
        } catch (e) {
          console.warn("V6.5.1 Error destroying existing chart by ID:", e);
        }
      }
    }
    
    return null;
  }

  // --- GLOBAL VARIABLES ---
  let loadingProgressInterval = null;
  let typeMonthlyChart = null;
  let typeYearlyChart = null;
  let approverMonthlyChart = null;
  let recommenderMonthlyChart = null;
  
  let isDashboardFirstLoad = true;
  
  let usersList = []; 
  let currentUser = null;
  let cachedData = [];
  let pelulusActiveItem = null;
  let isRestoring = false; 
  let isAppReady = false;
  let activeListType = '';
  let hasPrinted = false;
  let isFetching = false;
  let driveFolderCreated = false;
  let createdFolderUrl = '';
  let userFolderUrl = '';
  let allRecommenders = [];
  let allApprovers = [];
  
  let isSaving = false;
  
  // V6.4.5: Inactivity Timeout Variables
  let inactivityTimer = null;
  const TIMEOUT_DURATION = 3600000; // 1 jam = 3600000 milisaat
  
  // Dashboard data
  let dashboardData = {
    yearly: {},
    monthly: {},
    daily: {},
    currentPeriod: 'monthly',
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
    currentDay: new Date().getDate(),
    stats: {
      total: 0,
      supported: 0,
      notSupported: 0,
      approvalRate: 0,
      monthlyTrend: [],
      reasons: {},
      types: {}
    }
  };
  
  // USER FOLDER SYSTEM VARIABLES
  let mainFolderUrl = 'https://drive.google.com/drive/folders/1-IszGRdSjoJz2oOjUs_KO7HRz7oE2Hzn';
  let mainFolderId = '1-IszGRdSjoJz2oOjUs_KO7HRz7oE2Hzn';

  // STATE VARIABLES
  let lastActiveElementId = '';
  let lastActiveTab = 'stb';
  let formStates = {};

  // PDF PROCESSING VARIABLES
  let extractedPdfData = null;
  let extractedProfileData = null;
  
  // V6.4.8: Filter variables untuk kombinasi tapisan
  let currentDraftFilter = 'ALL';
  let currentSubmittedStatusFilter = 'ALL';
  let currentSubmittedJenisFilter = 'ALL';
  let currentHistoryStatusFilter = 'ALL';
  let currentHistoryJenisFilter = 'ALL';

  // DOM Elements (Sebahagian besar diisytihar kemudian, tetapi beberapa digunakan untuk mobile menu)
  const loginScreen = document.getElementById('login-screen');
  const appContainer = document.getElementById('app-container');
  const loginPin = document.getElementById('login_pin');
  const btnLogin = document.getElementById('btnLogin');
  const loginError = document.getElementById('loginError');
  const userBadge = document.getElementById('userBadge');
  const listStatus = document.getElementById('listStatus');
  const openFullBtn = document.getElementById('openFullBtn');
  const openFullBtnPelulus = document.getElementById('openFullBtnPelulus');
  const dbSyor = document.getElementById('db_syor');
  const dbPautanInput = document.getElementById('db_pautan');
  const btnSyncToDb = document.getElementById('btnSyncToDb');
  const triggerPrintBtn = document.getElementById('triggerPrintBtn');
  const driveSection = document.getElementById('driveSection');
  const driveStatus = document.getElementById('driveStatus');
  const driveFolderInfo = document.getElementById('driveFolderInfo');
  const driveResult = document.getElementById('driveResult');
  const cbCreateDriveFolder = document.getElementById('cbCreateDriveFolder');
  const btnCreateDriveFolder = document.getElementById('btnCreateDriveFolder');
  const btnOpenDriveFolder = document.getElementById('btnOpenDriveFolder');
  const btnOpenMyDriveFolder = document.getElementById('btnOpenMyDriveFolder');
  const filterSection = document.getElementById('filterSection');
  const filterPengesyor = document.getElementById('filterPengesyor');
  const btnClearFilter = document.getElementById('btnClearFilter');
  
  // Filter Bulan & Tahun untuk Senarai
  const listFilterMonth = document.getElementById('listFilterMonth');
  const listFilterYear = document.getElementById('listFilterYear');
  
  // Filter Jenis Permohonan & SPI - Butang dan Badge
  const draftFiltersContainer = document.getElementById('draftFiltersContainer');
  const filterBtnAll = document.getElementById('filterBtnAll');
  const filterBtnBaru = document.getElementById('filterBtnBaru');
  const filterBtnPembaharuan = document.getElementById('filterBtnPembaharuan');
  const filterBtnUbahMaklumat = document.getElementById('filterBtnUbahMaklumat');
  const filterBtnUbahGred = document.getElementById('filterBtnUbahGred');
  const filterBtnSpi = document.getElementById('filterBtnSpi');
  
  // Badge elements untuk kiraan
  const badgeAll = document.getElementById('badgeAll');
  const badgeBaru = document.getElementById('badgeBaru');
  const badgePembaharuan = document.getElementById('badgePembaharuan');
  const badgeUbahMaklumat = document.getElementById('badgeUbahMaklumat');
  const badgeUbahGred = document.getElementById('badgeUbahGred');
  const badgeSpi = document.getElementById('badgeSpi');
  
  // Submitted Tab Filter Elements
  const submittedFiltersContainer = document.getElementById('submittedFiltersContainer');
  const filterSubmittedAll = document.getElementById('filterSubmittedAll');
  const filterSubmittedLulus = document.getElementById('filterSubmittedLulus');
  const filterSubmittedTolak = document.getElementById('filterSubmittedTolak');
  const filterSubmittedPending = document.getElementById('filterSubmittedPending');
  const filterSubmittedJenisBaru = document.getElementById('filterSubmittedJenisBaru');
  const filterSubmittedJenisPembaharuan = document.getElementById('filterSubmittedJenisPembaharuan');
  const filterSubmittedJenisUbahMaklumat = document.getElementById('filterSubmittedJenisUbahMaklumat');
  const filterSubmittedJenisUbahGred = document.getElementById('filterSubmittedJenisUbahGred');
  
  // Badge elements for submitted filters
  const badgeSubmittedAll = document.getElementById('badgeSubmittedAll');
  const badgeSubmittedLulus = document.getElementById('badgeSubmittedLulus');
  const badgeSubmittedTolak = document.getElementById('badgeSubmittedTolak');
  const badgeSubmittedPending = document.getElementById('badgeSubmittedPending');
  const badgeSubmittedJenisBaru = document.getElementById('badgeSubmittedJenisBaru');
  const badgeSubmittedJenisPembaharuan = document.getElementById('badgeSubmittedJenisPembaharuan');
  const badgeSubmittedJenisUbahMaklumat = document.getElementById('badgeSubmittedJenisUbahMaklumat');
  const badgeSubmittedJenisUbahGred = document.getElementById('badgeSubmittedJenisUbahGred');
  
  // History Tab Filter Elements
  const historyFiltersContainer = document.getElementById('historyFiltersContainer');
  const filterHistoryAll = document.getElementById('filterHistoryAll');
  const filterHistoryStatusAll = document.getElementById('filterHistoryStatusAll');
  const filterHistoryStatusLulus = document.getElementById('filterHistoryStatusLulus');
  const filterHistoryStatusTolak = document.getElementById('filterHistoryStatusTolak');
  const filterHistoryStatusPending = document.getElementById('filterHistoryStatusPending');
  const filterHistoryJenisBaru = document.getElementById('filterHistoryJenisBaru');
  const filterHistoryJenisPembaharuan = document.getElementById('filterHistoryJenisPembaharuan');
  const filterHistoryJenisUbahMaklumat = document.getElementById('filterHistoryJenisUbahMaklumat');
  const filterHistoryJenisUbahGred = document.getElementById('filterHistoryJenisUbahGred');
  
  // Badges History
  const badgeHistoryAll = document.getElementById('badgeHistoryAll');
  const badgeHistoryStatusLulus = document.getElementById('badgeHistoryStatusLulus');
  const badgeHistoryStatusTolak = document.getElementById('badgeHistoryStatusTolak');
  const badgeHistoryStatusPending = document.getElementById('badgeHistoryStatusPending');
  const badgeHistoryJenisBaru = document.getElementById('badgeHistoryJenisBaru');
  const badgeHistoryJenisPembaharuan = document.getElementById('badgeHistoryJenisPembaharuan');
  const badgeHistoryJenisUbahMaklumat = document.getElementById('badgeHistoryJenisUbahMaklumat');
  const badgeHistoryJenisUbahGred = document.getElementById('badgeHistoryJenisUbahGred');

  // Loading Overlay Elements
  const loadingOverlay = document.getElementById('loading-overlay');
  const loadingText = document.getElementById('loading-text');
  const loadingSubtext = document.getElementById('loading-subtext');
  
  // PDF Upload Elements for Main Form
  const pdfUploadArea = document.getElementById('pdfUploadArea');
  const pdfFileName = document.getElementById('pdfFileName');
  const pdfProcessing = document.getElementById('pdfProcessing');
  const pdfResult = document.getElementById('pdfResult');
  const pdfExtractedData = document.getElementById('pdfExtractedData');
  const btnApplyPdfData = document.getElementById('btnApplyPdfData');
  const btnClearPdfData = document.getElementById('btnClearPdfData');
  
  // PDF Upload Elements for Profile Tab
  const profilePdfUploadArea = document.getElementById('profilePdfUploadArea');
  const profilePdfFileName = document.getElementById('profilePdfFileName');
  const profilePdfProcessing = document.getElementById('profilePdfProcessing');
  const profilePdfResult = document.getElementById('profilePdfResult');
  const profilePdfExtractedData = document.getElementById('profilePdfExtractedData');
  const btnProsesProfileAI = document.getElementById('btnProsesProfileAI');
  const btnApplyProfileData = document.getElementById('btnApplyProfileData');
  const btnClearProfileData = document.getElementById('btnClearProfileData');
  const btnCetakProfile = document.getElementById('btnCetakProfile');
  const btnResetProfile = document.getElementById('btnResetProfile');
  const btnPreviewQR = document.getElementById('btnPreviewQR');
  const previewQrCode = document.getElementById('previewQrCode');
  
  // Profile Tab Input Elements
  const profileSyarikat = document.getElementById('profile_syarikat');
  const profileCidb = document.getElementById('profile_cidb');
  const profileGred = document.getElementById('profile_gred');
  const profileNamaPemohon = document.getElementById('profile_nama_pemohon');
  const profileJawatanPemohon = document.getElementById('profile_jawatan_pemohon');
  const profileIcPemohon = document.getElementById('profile_ic_pemohon');
  const profileTelefonPemohon = document.getElementById('profile_telefon_pemohon');
  const profileEmailPemohon = document.getElementById('profile_email_pemohon');
  const profileJenisPendaftaran = document.getElementById('profile_jenis_pendaftaran');
  const profileTarikhDaftar = document.getElementById('profile_tarikh_daftar');
  const profileAlamatBerdaftar = document.getElementById('profile_alamat_berdaftar');
  const profileAlamatSurat = document.getElementById('profile_alamat_surat');
  const profileNoTelefonSyarikat = document.getElementById('profile_no_telefon_syarikat');
  const profileNoFax = document.getElementById('profile_no_fax');
  const profileEmailSyarikat = document.getElementById('profile_email_syarikat');
  const profileWeb = document.getElementById('profile_web');
  const profilePautanDrive = document.getElementById('profile_pautan_drive');
  const profileJenisPerubahan = document.getElementById('profile_jenis_perubahan');
  const cbSsmBerdaftar = document.getElementById('cb_ssm_berdaftar');
  const cbSsmSurat = document.getElementById('cb_ssm_surat');
  const labelAlamatBerdaftar = document.getElementById('label_alamat_berdaftar');
  
  // Profile PDF Input
  let profilePdfInput = document.getElementById('profilePdfInput');
  
  // PDF Processing Buttons
  const btnProcessManual = document.getElementById('btnProcessManual');
  const btnProcessAI = document.getElementById('btnProcessAI');
  
  // PDF File Input
  let pdfFileInput = document.getElementById('pdfFileInput');
  
  // Dashboard Elements
  const dashboardPeriod = document.getElementById('dashboardPeriod');
  const dashboardYear = document.getElementById('dashboardYear');
  const dashboardMonth = document.getElementById('dashboardMonth');
  const dashboardDay = document.getElementById('dashboardDay');
  const detailedTableBody = document.getElementById('detailedTableBody');
  const chartMonthlyTrend = document.getElementById('chartMonthlyTrend');
  const chartStatus = document.getElementById('chartStatus');
  const dashboardUserInfo = document.getElementById('dashboardUserInfo');
  const dashboardUserRole = document.getElementById('dashboardUserRole');
  const dashboardUserSpecificInfo = document.getElementById('dashboardUserSpecificInfo');
  const typeStats = document.getElementById('typeStats');
  const reasonStatsContainer = document.getElementById('reasonStatsContainer');
  const reasonStats = document.getElementById('reasonStats');
  const detailCol1 = document.getElementById('detailCol1');
  const detailCol2 = document.getElementById('detailCol2');
  const detailCol3 = document.getElementById('detailCol3');
  const detailCol4 = document.getElementById('detailCol4');
  
  // Chart Containers
  const applicationTypeChartContainer = document.getElementById('chartTypeDistContainer');
  const rejectionReasonChartContainer = document.getElementById('chartReasonDistContainer');
  
  // Admin Dashboard Elements
  const tabAdminBtn = document.getElementById('tabAdminBtn');
  const adminTotalCount = document.getElementById('admin-total-count');
  const adminApprovedCount = document.getElementById('admin-approved-count');
  const adminRejectedCount = document.getElementById('admin-rejected-count');
  const adminPendingCount = document.getElementById('admin-pending-count');
  const adminPengesyorTbody = document.getElementById('admin-pengesyor-tbody');
  const adminPelulusTbody = document.getElementById('admin-pelulus-tbody');
  const adminStatsModal = document.getElementById('adminStatsModal');
  const adminStatsClose = document.getElementById('adminStatsClose');
  const btnPrintAdminStats = document.getElementById('btnPrintAdminStats');
  const btnPrintStatsModal = document.getElementById('btnPrintStatsModal');
  const adminStatsPrintContent = document.getElementById('adminStatsPrintContent');
  const adminStatsDate = document.getElementById('adminStatsDate');
  
  // Admin Filter Elements
  const adminFilterMonth = document.getElementById('adminFilterMonth');
  const adminFilterYear = document.getElementById('adminFilterYear');
  
  // Analisis Penolakan Container
  const adminRejectionReasonStats = document.getElementById('adminRejectionReasonStats');
  
  // Butang CSV
  const btnAdminCsv = document.getElementById('btnAdminCsv');
  
  // Butang Paparan Penuh Admin
  const btnAdminFullView = document.getElementById('btnAdminFullView');
  
  // Chart Elements for Application Type Analysis
  const chartTypeMonthly = document.getElementById('chartTypeMonthly');
  const chartTypeYearly = document.getElementById('chartTypeYearly');
  const chartTypeMonthlyContainer = document.getElementById('chartTypeMonthlyContainer');
  const chartTypeYearlyContainer = document.getElementById('chartTypeYearlyContainer');
  
  // Kad 4 Statistik Elements
  const totalCountElement = document.getElementById('total-count');
  const successCountElement = document.getElementById('success-count');
  const labelSuccessElement = document.getElementById('label-success');
  const rejectCountElement = document.getElementById('reject-count');
  const labelRejectElement = document.getElementById('label-reject');
  const processCountElement = document.getElementById('process-count');
  const labelStatusElement = document.getElementById('label-status');

  // WhatsApp Dropdown
  const dbPelulusWhatsapp = document.getElementById('db_pelulus_whatsapp');
  
  // Lawatan Elements
  const cbSelesaiLawatan = document.getElementById('cb_selesai_lawatan');
  const containerLawatan = document.getElementById('container_lawatan');
  const dbLawatanTarikh = document.getElementById('db_lawatan_tarikh');
  const dbLawatanSubmitSptb = document.getElementById('db_lawatan_submit_sptb');
  const dbLawatanSyor = document.getElementById('db_lawatan_syor');

  // WhatsApp Notification Elements
  const cbNotifyWhatsapp = document.getElementById('cb_notify_whatsapp');
  const pelulusWhatsappContainer = document.getElementById('pelulus_whatsapp_container');
  const labelNotifyWhatsapp = document.getElementById('label_notify_whatsapp');

  // Profile Tab Button
  const tabProfileBtn = document.getElementById('tabProfileBtn');
  
  // Top Full View Button
  const btnTopFullView = document.getElementById('btnTopFullView');
  
  // NEW BUTTON: Pergi ke Cipta Profile from Database Tab
  const btnPergiCiptaProfile = document.getElementById('btnPergiCiptaProfile');
  
  // NEW BUTTON: Download Dashboard CSV
  const btnDownloadDashboardCsv = document.getElementById('btnDashboardCsv');

  // Rujukan DOM untuk Label Checkbox Pengesahan
  const labelDbSahSyor = document.getElementById('label_db_sah_syor');
  const labelPelulusSahLulus = document.getElementById('label_pelulus_sah_lulus');
  const dbSahSyor = document.getElementById('db_sah_syor');
  const pelulusSahLulus = document.getElementById('pelulus_sah_lulus');
  
  // Pelulus Elements untuk Tukar Syor Lawatan
  const pelulusTukarSyor = document.getElementById('pelulus_tukar_syor_lawatan');
  const divPelulusJustifikasi = document.getElementById('div_pelulus_justifikasi');
  const divPelulusDateSpi = document.getElementById('div_pelulus_date_spi');
  const pelulusJustifikasi = document.getElementById('pelulus_justifikasi_lawatan');
  const pelulusDateSpi = document.getElementById('pelulus_date_submit_spi');
  
  // Filter Container Elements
  const pengesyorFilterButtonsContainer = document.getElementById('pengesyorFilterButtonsContainer');
  const pelulusFilterSection = document.getElementById('pelulusFilterSection');
  const pelulusFilterButtonsContainer = document.getElementById('pelulusFilterButtonsContainer');

  // =========================================================================
  // V6.4.9: DYNAMIC URL ROUTING & UNIQUE ID GENERATOR
  // =========================================================================
  
  function generateUniqueId(rowNumber) {
    if (!rowNumber) return '';
    const num = parseInt(rowNumber);
    if (isNaN(num)) return '';
    return num.toString().padStart(5, '0');
  }

  function getCompanySlug(companyName) {
    if (!companyName) return 'unknown';
    return companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function updateBrowserUrl(params) {
    const url = new URL(window.location);
    // Clear existing params
    url.searchParams.forEach((value, key) => {
      if (params.hasOwnProperty(key)) return;
      url.searchParams.delete(key);
    });
    
    // Set new params
    for (const [key, value] of Object.entries(params)) {
      if (value) {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.delete(key);
      }
    }
    
    window.history.pushState({}, '', url);
  }

  function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      user: params.get('user'),
      tab: params.get('tab'),
      id: params.get('id'),
      company: params.get('company')
    };
  }

  // =========================================================================
  // FUNGSI UTAMA
  // =========================================================================

  // LOADING OVERLAY FUNCTIONS
  function simulateLoading(message = 'Memuatkan data...', submessage = '') {
    if (loadingOverlay && loadingText) {
      loadingText.textContent = message;
      if (loadingSubtext && submessage) {
        loadingSubtext.textContent = submessage;
      }
      loadingOverlay.style.display = 'flex';
      
      const progressBar = document.querySelector('.loading-progress-bar');
      const progressText = document.querySelector('.loading-progress-text');
      if (progressBar) progressBar.style.display = 'none';
      if (progressText) progressText.style.display = 'none';
    }
  }

  function simulateLoadingWithSteps(steps, overallMessage = 'Memuatkan data...') {
    const overlay = document.getElementById('loading-overlay');
    const text = document.getElementById('loading-text');
    
    if (!overlay || !text) return;
    
    text.textContent = overallMessage;
    overlay.style.display = 'flex';
    
    const progressBar = document.getElementById('loading-progress-bar');
    const progressPercent = document.getElementById('loading-progress-percent');
    const progressLabel = document.getElementById('loading-progress-label');
    
    if (progressBar) progressBar.style.width = '0%';
    if (progressPercent) progressPercent.textContent = '0%';
    if (progressLabel && steps.length > 0) progressLabel.textContent = steps[0];
    
    if (loadingProgressInterval) clearInterval(loadingProgressInterval);
    
    let currentStep = 0;
    const totalSteps = steps.length;
    
    loadingProgressInterval = setInterval(() => {
      currentStep++;
      let progress = Math.min((currentStep / totalSteps) * 100, 100);
      
      if (progressBar) progressBar.style.width = `${progress}%`;
      if (progressPercent) progressPercent.textContent = `${Math.round(progress)}%`;
      
      if (progressLabel) {
        progressLabel.textContent = (currentStep < totalSteps) ? steps[currentStep] : "Selesai!";
      }
      
      if (currentStep >= totalSteps) {
        clearInterval(loadingProgressInterval);
        setTimeout(() => { if(overlay) overlay.style.display = 'none'; }, 600);
      }
    }, 300);
  }

  function hideLoading() {
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
    }
    if (loadingProgressInterval) {
      clearInterval(loadingProgressInterval);
      loadingProgressInterval = null;
    }
  }

  // =========================================================================
  // FORM PERSISTENCE FUNCTIONS - INSTANT SAVE
  // =========================================================================
  function saveFormData() {
    if (isSaving || !currentUser) return;
    
    isSaving = true;
    console.log('V6.5.1 Instant auto-save: Menyimpan...');
    
    const formData = {
      timestamp: new Date().toISOString(),
      user: currentUser.name,
      role: currentUser.role,
      tab: lastActiveTab
    };
    
    const fields = {};
    document.querySelectorAll('#tab-checker input, #tab-checker select, #tab-checker textarea').forEach(el => {
      if (el.id && !el.id.includes('print_') && !el.id.includes('pelulus_') && !el.id.includes('login')) {
        if (el.type === 'checkbox' || el.type === 'radio') {
          fields[el.id] = el.checked;
        } else {
          fields[el.id] = el.value;
        }
      }
    });
    
    const selectedRadio = document.querySelector('input[name="jenisApp"]:checked');
    if (selectedRadio) {
      fields['jenisApp'] = selectedRadio.value;
    }
    
    const personnel = [];
    document.querySelectorAll('.person-card').forEach(card => {
      const roles = [];
      card.querySelectorAll('.role-cb:checked').forEach(cb => roles.push(cb.value));
      
      personnel.push({
        name: card.querySelector('.p-name')?.value || '',
        isCompany: card.querySelector('.is-company')?.checked || false,
        roles: roles,
        s_ic: card.querySelector('.status-ic')?.value || '',
        s_sb: card.querySelector('.status-sb')?.value || '',
        s_epf: card.querySelector('.status-epf')?.value || ''
      });
    });
    
    fields.personnel = personnel;
    formData.fields = fields;
    
    try {
      storageWrapper.set({ 'stb_form_persistence': formData })
        .then(() => {
          console.log('V6.5.1 Instant auto-save: Berjaya');
          isSaving = false;
        })
        .catch(error => {
          console.error('V6.5.1 Error saving form data:', error);
          isSaving = false;
        });
    } catch (error) {
      console.error('V6.5.1 Error in saveFormData:', error);
      isSaving = false;
    }
  }

  function saveDatabaseFormData() {
    if (isSaving || !currentUser) return;
    
    isSaving = true;
    
    const formData = {
      timestamp: new Date().toISOString(),
      user: currentUser.name,
      role: currentUser.role,
      tab: 'db'
    };
    
    const fields = {};
    document.querySelectorAll('#tab-database input, #tab-database select, #tab-database textarea').forEach(el => {
      if (el.id && !el.id.includes('print_') && !el.id.includes('pelulus_') && !el.id.includes('login')) {
        if (el.type === 'checkbox' || el.type === 'radio') {
          fields[el.id] = el.checked;
        } else {
          fields[el.id] = el.value;
        }
      }
    });
    
    const createDriveFolder = document.getElementById('cbCreateDriveFolder');
    if (createDriveFolder) {
      fields['cbCreateDriveFolder'] = createDriveFolder.checked;
    }
    
    formData.fields = fields;
    
    storageWrapper.set({ 'stb_database_persistence': formData })
      .then(() => {
        console.log('V6.5.1 Database form data saved');
        isSaving = false;
      })
      .catch(error => {
        console.error('V6.5.1 Error saving database form data:', error);
        isSaving = false;
      });
  }

  function loadFormData() {
    try {
      storageWrapper.get(['stb_form_persistence'])
        .then(result => {
          if (!result.stb_form_persistence) return;
          
          const formData = result.stb_form_persistence;
          const fields = formData.fields || {};
          
          Object.keys(fields).forEach(key => {
            if (key === 'personnel' || key === 'jenisApp') return;
            
            const el = document.getElementById(key);
            if (el) {
              if (el.type === 'checkbox' || el.type === 'radio') {
                el.checked = fields[key];
              } else {
                el.value = fields[key];
              }
            }
          });
          
          if (fields.jenisApp) {
            const radio = document.querySelector(`input[name="jenisApp"][value="${fields.jenisApp}"]`);
            if (radio) {
              radio.checked = true;
              radio.dispatchEvent(new Event('change'));
            }
          }
          
          const personnelListEl = document.getElementById('personnelList');
          if (personnelListEl && fields.personnel && Array.isArray(fields.personnel)) {
            personnelListEl.innerHTML = '';
            fields.personnel.forEach(person => {
              addPerson(person);
            });
          }
          
          setTimeout(() => {
            initializeTickButtons();
          }, 100);
          
          console.log('V6.5.1 Form data restored from persistence');
        })
        .catch(error => {
          console.error('V6.5.1 Error loading form data:', error);
        });
    } catch (error) {
      console.error('V6.5.1 Error in loadFormData:', error);
    }
  }

  function loadDatabaseFormData() {
    storageWrapper.get(['stb_database_persistence'])
      .then(result => {
        if (!result.stb_database_persistence) return;
        
        const formData = result.stb_database_persistence;
        const fields = formData.fields || {};
        
        Object.keys(fields).forEach(key => {
          if (key === 'cbCreateDriveFolder') {
            const el = document.getElementById(key);
            if (el) {
              el.checked = fields[key];
              el.dispatchEvent(new Event('change'));
            }
          } else {
            const el = document.getElementById(key);
            if (el) {
              if (el.type === 'checkbox' || el.type === 'radio') {
                el.checked = fields[key];
              } else {
                el.value = fields[key];
              }
            }
          }
        });
        
        console.log('V6.5.1 Database form data restored from persistence');
      })
      .catch(error => {
        console.error('V6.5.1 Error loading database form data:', error);
      });
  }

  // =========================================================================
  // TICK BUTTONS FUNCTIONALITY
  // =========================================================================

  function initializeTickButtons() {
    console.log("V6.5.1 Initializing tick buttons for all status inputs...");
    
    document.querySelectorAll('.status-input-container').forEach(container => {
      const input = container.querySelector('.status-input');
      const tickRightBtn = container.querySelector('.tick-btn.tick-right');
      const tickWrongBtn = container.querySelector('.tick-btn.tick-wrong');
      
      if (tickRightBtn) {
        tickRightBtn.addEventListener('click', () => {
          input.value = '✓';
          input.style.backgroundColor = '#dcfce7';
          input.style.color = '#166534';
          
          input.dispatchEvent(new Event('input'));
          input.dispatchEvent(new Event('change'));
          
          saveFormData();
        });
      }
      
      if (tickWrongBtn) {
        tickWrongBtn.addEventListener('click', () => {
          input.value = 'X';
          input.style.backgroundColor = '#fee2e2';
          input.style.color = '#991b1b';
          
          input.dispatchEvent(new Event('input'));
          input.dispatchEvent(new Event('change'));
          
          saveFormData();
        });
      }
      
      if (input) {
        input.addEventListener('input', saveFormData);
      }
    });

    document.querySelectorAll('.person-card').forEach(card => {
      const docTypes = ['ic', 'sb', 'epf'];
      
      docTypes.forEach(type => {
        const input = card.querySelector(`.status-${type}`);
        if (input) {
          if (!input.parentElement.querySelector('.tick-buttons')) {
            const container = document.createElement('div');
            container.className = 'tick-buttons';
            container.innerHTML = `
              <button type="button" class="tick-btn tick-right" title="Set OK">✓</button>
              <button type="button" class="tick-btn tick-wrong" title="Set X">✗</button>
            `;
            input.parentElement.style.position = 'relative';
            input.parentElement.appendChild(container);
            
            const tickRightBtn = container.querySelector('.tick-right');
            const tickWrongBtn = container.querySelector('.tick-wrong');
            
            if (tickRightBtn) {
              tickRightBtn.addEventListener('click', () => {
                input.value = '✓';
                input.style.backgroundColor = '#dcfce7';
                input.style.color = '#166534';
                input.dispatchEvent(new Event('input'));
                saveFormData();
              });
            }
            
            if (tickWrongBtn) {
              tickWrongBtn.addEventListener('click', () => {
                input.value = 'X';
                input.style.backgroundColor = '#fee2e2';
                input.style.color = '#991b1b';
                input.dispatchEvent(new Event('input'));
                saveFormData();
              });
            }
          }
          
          input.addEventListener('input', saveFormData);
        }
      });
    });
    
    console.log("V6.5.1 Tick buttons initialized successfully");
  }

  // =========================================================================
  // FUNGSI UPDATE DASHBOARD
  // =========================================================================
  
  function updateDashboard(showLoading = true) {
    console.log("V6.5.1 updateDashboard dipanggil dengan:", {
      currentUser: currentUser?.name,
      cachedDataLength: cachedData?.length,
      period: dashboardData.currentPeriod,
      year: dashboardData.currentYear,
      month: dashboardData.currentMonth,
      day: dashboardData.currentDay
    });
    
    if (dashboardUserInfo && dashboardUserRole) {
      if (currentUser.role === 'PENGESYOR') {
        dashboardUserRole.textContent = 'Pengesyor';
        if(dashboardUserSpecificInfo) dashboardUserSpecificInfo.textContent = 'Statistik berdasarkan syor anda (SOKONG/TIDAK DISOKONG)';
      } else if (currentUser.role === 'PELULUS') {
        dashboardUserRole.textContent = 'Pelulus';
        if(dashboardUserSpecificInfo) dashboardUserSpecificInfo.textContent = 'Statistik berdasarkan keputusan anda (LULUS/TOLAK)';
      } else if (currentUser.role === 'ADMIN' || currentUser.role === 'KETUA SEKSYEN') {
        dashboardUserRole.textContent = currentUser.role === 'ADMIN' ? 'Admin' : 'Ketua Seksyen';
        if(dashboardUserSpecificInfo) dashboardUserSpecificInfo.textContent = 'Statistik keseluruhan sistem';
      } else if (currentUser.role === 'PENGARAH') {
        dashboardUserRole.textContent = 'Pengarah';
        if(dashboardUserSpecificInfo) dashboardUserSpecificInfo.textContent = 'Statistik keseluruhan (Lihat Sahaja)';
      }
    }

    if (!cachedData || cachedData.length === 0) {
      console.warn("V6.5.1 Dashboard: Tiada data cache.");
      showDashboardNoData();
      if(document.getElementById('loading-overlay')) 
         document.getElementById('loading-overlay').style.display = 'none';
      return;
    }
    
    if (showLoading) {
      simulateLoadingWithSteps(
        ['Menganalisis data...', 'Mengira statistik...', 'Membina carta...', 'Siap!'],
        'Menjana Dashboard'
      );
    } else {
      if(document.getElementById('loading-overlay')) 
         document.getElementById('loading-overlay').style.display = 'none';
    }
    
    const currentYear = dashboardData.currentYear;
    const currentMonth = dashboardData.currentMonth;
    const currentDay = dashboardData.currentDay;
    const period = dashboardData.currentPeriod;
    
    let filteredData = [];
    
    console.log("V6.5.1 Filtering data untuk period:", period, "tahun:", currentYear, "bulan:", currentMonth, "hari:", currentDay);
    
    if (period === 'yearly') {
      filteredData = cachedData.filter(item => {
        let dateToUse = null;
        
        if (item.start_date) {
          dateToUse = new Date(item.start_date);
        } else if (item.tarikh_lulus) {
          dateToUse = new Date(item.tarikh_lulus);
        } else if (item.date_submit) {
          dateToUse = new Date(item.date_submit);
        }
        
        if (!dateToUse || isNaN(dateToUse)) return false;
        
        return dateToUse.getFullYear() === currentYear;
      });
    } else if (period === 'daily') {
      filteredData = cachedData.filter(item => {
        let dateToUse = null;
        
        if (item.start_date) {
          dateToUse = new Date(item.start_date);
        } else if (item.tarikh_lulus) {
          dateToUse = new Date(item.tarikh_lulus);
        } else if (item.date_submit) {
          dateToUse = new Date(item.date_submit);
        }
        
        if (!dateToUse || isNaN(dateToUse)) return false;
        
        return dateToUse.getFullYear() === currentYear && 
               dateToUse.getMonth() + 1 === currentMonth && 
               dateToUse.getDate() === currentDay;
      });
    } else {
      filteredData = cachedData.filter(item => {
        let dateToUse = null;
        
        if (item.start_date) {
          dateToUse = new Date(item.start_date);
        } else if (item.tarikh_lulus) {
          dateToUse = new Date(item.tarikh_lulus);
        } else if (item.date_submit) {
          dateToUse = new Date(item.date_submit);
        }
        
        if (!dateToUse || isNaN(dateToUse)) return false;
        
        return dateToUse.getFullYear() === currentYear && dateToUse.getMonth() + 1 === currentMonth;
      });
    }
    
    console.log("V6.5.1 Data setelah filter:", filteredData.length);

    let userSpecificData = filteredData.filter(item => {
      if (currentUser.role === 'ADMIN' || currentUser.role === 'KETUA SEKSYEN' || currentUser.role === 'PENGARAH') {
        return true;
      } else if (currentUser.role === 'PENGESYOR') {
        return item.pengesyor && item.pengesyor.trim().toUpperCase() === currentUser.name.trim().toUpperCase();
      } else if (currentUser.role === 'PELULUS') {
        return item.pelulus && item.pelulus.trim().toUpperCase() === currentUser.name.trim().toUpperCase();
      }
      return false;
    });
    
    console.log("V6.5.1 Data user-specific:", userSpecificData.length);

    const total = userSpecificData.length;
    
    let success = 0;
    let reject = 0;
    let card4Value = 0;
    let lblSuccess = '';
    let lblReject = '';
    let lblStatus = '';
    
    if (currentUser.role === 'PENGESYOR') {
      success = userSpecificData.filter(d => d.syor_status === 'SOKONG').length;
      reject = userSpecificData.filter(d => d.syor_status === 'TIDAK DISOKONG').length;
      card4Value = total - (success + reject);
      
      lblSuccess = 'SOKONG';
      lblReject = 'TOLAK';
      lblStatus = 'PROSES';
    } else if (currentUser.role === 'PELULUS') {
      success = userSpecificData.filter(d => d.kelulusan && d.kelulusan.includes('LULUS')).length;
      reject = userSpecificData.filter(d => d.kelulusan && (d.kelulusan.includes('TOLAK') || d.kelulusan.includes('SIASAT'))).length;
      let percent = total > 0 ? Math.round((success / total) * 100) : 0;
      card4Value = percent + '%';
      
      lblSuccess = 'LULUS';
      lblReject = 'GAGAL';
      lblStatus = 'PERATUS';
    } else if (currentUser.role === 'ADMIN' || currentUser.role === 'KETUA SEKSYEN' || currentUser.role === 'PENGARAH') {
      success = userSpecificData.filter(d => d.kelulusan && d.kelulusan.includes('LULUS')).length;
      reject = userSpecificData.filter(d => d.kelulusan && (d.kelulusan.includes('TOLAK') || d.kelulusan.includes('SIASAT'))).length;
      card4Value = userSpecificData.filter(d => !d.kelulusan || d.kelulusan === '').length;
      
      lblSuccess = 'LULUS';
      lblReject = 'TOLAK';
      lblStatus = 'PROSES';
    }
    
    console.log("V6.5.1 Statistik kad 4:", { total, success, reject, card4Value });
    
    if (totalCountElement) totalCountElement.textContent = total;
    if (successCountElement) successCountElement.textContent = success;
    if (labelSuccessElement) labelSuccessElement.textContent = lblSuccess;
    if (rejectCountElement) rejectCountElement.textContent = reject;
    if (labelRejectElement) labelRejectElement.textContent = lblReject;
    if (processCountElement) processCountElement.textContent = card4Value;
    if (labelStatusElement) labelStatusElement.textContent = lblStatus;
    
    updateApplicationTypeChart(userSpecificData);
    updateStatusChart(userSpecificData);
    
    if (currentUser.role === 'PELULUS' || currentUser.role === 'ADMIN' || currentUser.role === 'KETUA SEKSYEN') {
      updateRejectionReasonChart(userSpecificData);
      if (rejectionReasonChartContainer) {
        rejectionReasonChartContainer.style.display = 'block';
      }
    } else {
      if (rejectionReasonChartContainer) {
        rejectionReasonChartContainer.style.display = 'none';
      }
    }
    
    if (currentUser.role === 'PENGESYOR') {
       if (typeof updateRecommenderCharts === 'function') {
           updateRecommenderCharts(userSpecificData, filteredData);
       }
    } else if (currentUser.role === 'PELULUS' || currentUser.role === 'ADMIN' || currentUser.role === 'KETUA SEKSYEN' || currentUser.role === 'PENGARAH') {
       if (typeof updateApproverCharts === 'function') {
           updateApproverCharts(userSpecificData, filteredData);
       }
    }
    
    if (typeof updateDetailedTable === 'function') {
        updateDetailedTable(userSpecificData, period);
    }
    
    if (typeof updateApplicationTypeStats === 'function') {
      updateApplicationTypeStats(userSpecificData);
    }
    
    if ((currentUser.role === 'PELULUS' || currentUser.role === 'ADMIN' || currentUser.role === 'KETUA SEKSYEN') && typeof updateReasonStats === 'function') {
      updateReasonStats(userSpecificData);
    }
    
    updateKonsultansiChart(userSpecificData);
    
    hideLoading();
  }

  function updateStatusChart(data) {
    console.log("V6.5.1 updateStatusChart dipanggil dengan data:", data.length);
    
    const canvasId = 'chartStatus';
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    
    dashboardStatusChart = safeDestroyChart(dashboardStatusChart, canvasId);
    
    let labels = [], counts = [], colors = [];
    
    if (currentUser.role === 'PENGESYOR') {
      const sokong = data.filter(d => d.syor_status === 'SOKONG').length;
      const tidak = data.filter(d => d.syor_status === 'TIDAK DISOKONG').length;
      const proses = data.filter(d => !d.syor_status || d.syor_status === '').length;
      labels = ['SOKONG', 'TIDAK SOKONG', 'DALAM PROSES'];
      counts = [sokong, tidak, proses];
      colors = ['#22c55e', '#ef4444', '#f59e0b'];
    } else {
      const lulus = data.filter(d => d.kelulusan && d.kelulusan.includes('LULUS')).length;
      const tolak = data.filter(d => d.kelulusan && (d.kelulusan.includes('TOLAK') || d.kelulusan.includes('SIASAT'))).length;
      const proses = data.length - (lulus + tolak);
      labels = ['LULUS', 'TOLAK/SIASAT', 'DALAM PROSES'];
      counts = [lulus, tolak, proses];
      colors = ['#22c55e', '#ef4444', '#f59e0b'];
    }
    
    dashboardStatusChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: counts,
          backgroundColor: colors
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: currentUser.role === 'PENGESYOR' ? 'Status Syor' : 'Status Permohonan',
            font: {
              size: 14,
              weight: 'bold'
            }
          }
        }
      }
    });
    
    console.log("V6.5.1 Status chart updated successfully");
  }

  function updateApplicationTypeChart(data) {
    console.log("V6.5.1 updateApplicationTypeChart dipanggil dengan data:", data.length);
    
    const canvasId = 'chartTypeDist';
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    
    dashboardTypeChart = safeDestroyChart(dashboardTypeChart, canvasId);
    
    const types = {};
    data.forEach(item => {
      const t = item.jenis ? item.jenis.toUpperCase().trim() : 'LAIN-LAIN';
      types[t] = (types[t] || 0) + 1;
    });
    
    const labels = Object.keys(types);
    const values = Object.values(types);
    
    if (labels.length === 0) {
      return;
    }
    
    dashboardTypeChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#64748b']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Jenis Permohonan',
            font: {
              size: 14,
              weight: 'bold'
            }
          }
        }
      }
    });
    
    console.log("V6.5.1 Application type chart updated successfully");
  }

  function updateRejectionReasonChart(data) {
    console.log("V6.5.1 updateRejectionReasonChart dipanggil dengan data:", data.length);
    
    const container = document.getElementById('chartReasonDistContainer');
    const canvasId = 'chartReasonDist';
    const ctx = document.getElementById(canvasId);
    
    dashboardReasonChart = safeDestroyChart(dashboardReasonChart, canvasId);
    
    if (!ctx || (currentUser.role !== 'PELULUS' && currentUser.role !== 'ADMIN' && currentUser.role !== 'KETUA SEKSYEN')) {
      if (container) container.style.display = 'none';
      return;
    }
    
    const rejected = data.filter(d => d.kelulusan && (d.kelulusan.includes('TOLAK') || d.kelulusan.includes('SIASAT')));
    
    if (rejected.length === 0) {
      if (container) container.style.display = 'none';
      return;
    }
    
    if (container) container.style.display = 'block';
    
    const reasons = {};
    rejected.forEach(item => {
      const r = item.alasan ? item.alasan.trim() : 'Tiada Alasan';
      reasons[r] = (reasons[r] || 0) + 1;
    });
    
    const sortedReasons = Object.entries(reasons)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    const reasonLabels = sortedReasons.map(r => r[0].length > 30 ? r[0].substring(0, 27) + '...' : r[0]);
    const reasonValues = sortedReasons.map(r => r[1]);
    
    dashboardReasonChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: reasonLabels,
        datasets: [{
          label: 'Jumlah',
          data: reasonValues,
          backgroundColor: '#ef4444'
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Alasan Penolakan',
            font: {
              size: 14,
              weight: 'bold'
            }
          }
        }
      }
    });
    
    console.log("V6.5.1 Rejection reason chart updated successfully");
  }

  // =========================================================================
  // FUNGSI INITIALIZE DASHBOARD
  // =========================================================================

  function initializeDashboard() {
    console.log("V6.5.1 Initializing dashboard...");
    
    if (dashboardDay) {
      dashboardDay.innerHTML = '';
      for (let i = 1; i <= 31; i++) {
        const option = document.createElement('option');
        option.value = i.toString().padStart(2, '0');
        option.textContent = i.toString().padStart(2, '0');
        dashboardDay.appendChild(option);
      }
    }
    
    if (dashboardPeriod && !dashboardPeriod.hasAttribute('data-listener')) {
      dashboardPeriod.setAttribute('data-listener', 'true');
      dashboardPeriod.addEventListener('change', (e) => {
        dashboardData.currentPeriod = e.target.value;
        if (dashboardMonth) dashboardMonth.style.display = (e.target.value === 'monthly' || e.target.value === 'daily') ? 'block' : 'none';
        if (dashboardDay) dashboardDay.style.display = (e.target.value === 'daily') ? 'block' : 'none';
        updateDashboard(true);
      });
    }
    
    if (dashboardYear && !dashboardYear.hasAttribute('data-listener')) {
      dashboardYear.setAttribute('data-listener', 'true');
      dashboardYear.addEventListener('change', (e) => {
        dashboardData.currentYear = parseInt(e.target.value);
        updateDashboard(true);
      });
    }
    
    if (dashboardMonth && !dashboardMonth.hasAttribute('data-listener')) {
      dashboardMonth.setAttribute('data-listener', 'true');
      dashboardMonth.addEventListener('change', (e) => {
        dashboardData.currentMonth = parseInt(e.target.value);
        updateDashboard(true);
      });
    }
    
    if (dashboardDay && !dashboardDay.hasAttribute('data-listener')) {
      dashboardDay.setAttribute('data-listener', 'true');
      dashboardDay.addEventListener('change', (e) => {
        dashboardData.currentDay = parseInt(e.target.value);
        updateDashboard(true);
      });
    }
    
    if (isDashboardFirstLoad) {
      const now = new Date();
      dashboardData.currentPeriod = 'monthly';
      dashboardData.currentYear = now.getFullYear();
      dashboardData.currentMonth = now.getMonth() + 1;
      dashboardData.currentDay = now.getDate();
      
      isDashboardFirstLoad = false; 
    }
    
    if (dashboardPeriod) dashboardPeriod.value = dashboardData.currentPeriod;
    
    if (dashboardYear) {
       const yearOption = dashboardYear.querySelector(`option[value="${dashboardData.currentYear}"]`);
       if (yearOption) dashboardYear.value = dashboardData.currentYear;
    }
    
    if (dashboardMonth) {
      const monthStr = dashboardData.currentMonth.toString().padStart(2, '0');
      dashboardMonth.value = monthStr;
      dashboardMonth.style.display = (dashboardData.currentPeriod === 'monthly' || dashboardData.currentPeriod === 'daily') ? 'block' : 'none';
    }
    
    if (dashboardDay) {
      const dayStr = dashboardData.currentDay.toString().padStart(2, '0');
      dashboardDay.value = dayStr;
      dashboardDay.style.display = (dashboardData.currentPeriod === 'daily') ? 'block' : 'none';
    }
    
    updateDashboard(false);
  }

  function updateApplicationTypeStats(data) {
    if (!typeStats) return;
    
    const typeCounts = {
      'BARU': 0,
      'PEMBAHARUAN': 0,
      'UBAH MAKLUMAT': 0,
      'UBAH GRED': 0
    };
    
    data.forEach(item => {
      const jenis = item.jenis ? item.jenis.toUpperCase() : '';
      if (typeCounts.hasOwnProperty(jenis)) {
        typeCounts[jenis]++;
      } else if (jenis) {
        typeCounts[jenis] = 1;
      }
    });
    
    let badgesHtml = '';
    const colors = {
      'BARU': '#3b82f6',
      'PEMBAHARUAN': '#10b981',
      'UBAH MAKLUMAT': '#f59e0b',
      'UBAH GRED': '#8b5cf6'
    };
    
    for (const [type, count] of Object.entries(typeCounts)) {
      if (count > 0) {
        const color = colors[type] || '#6b7280';
        badgesHtml += `
          <div class="type-badge" style="background: ${color}20; border: 1px solid ${color}; color: ${color};">
            ${type}
            <span class="type-count" style="background: ${color}; color: white;">${count}</span>
          </div>
        `;
      }
    }
    
    if (badgesHtml === '') {
      badgesHtml = '<div style="color: #64748b; font-size: 0.9rem;">Tiada data jenis permohonan</div>';
    }
    
    typeStats.innerHTML = badgesHtml;
  }

  function updateRecommenderCharts(userData, filteredData) {
    if (recommenderMonthlyChart) {
      recommenderMonthlyChart.destroy();
      recommenderMonthlyChart = null;
    }
    
    const monthlyTrendCanvas = document.getElementById('chartMonthlyTrend');
    if (!monthlyTrendCanvas) {
      console.error('V6.5.1 Chart canvas elements not found');
      return;
    }
    
    const monthlyCtx = monthlyTrendCanvas.getContext('2d');
    if (!monthlyCtx) {
      console.error('V6.5.1 Could not get 2D context for charts');
      return;
    }
    
    monthlyCtx.clearRect(0, 0, monthlyTrendCanvas.width, monthlyTrendCanvas.height);
    
    const monthlyData = {};
    const monthlyLabels = [];
    
    const currentYear = dashboardData.currentYear;
    const currentMonth = dashboardData.currentMonth;
    
    const monthsToShow = 6;
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - 1 - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = `${date.toLocaleString('ms-MY', { month: 'short' })} ${date.getFullYear()}`;
      monthlyData[monthKey] = {
        label: monthLabel,
        supported: 0,
        notSupported: 0
      };
      monthlyLabels.push(monthKey);
    }
    
    filteredData.forEach(item => {
      if (item.start_date && item.pengesyor && item.pengesyor.toUpperCase() === currentUser.name.toUpperCase()) {
        const date = new Date(item.start_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (monthlyData[monthKey]) {
          if (item.syor_status && item.syor_status.includes('TIDAK DISOKONG')) {
            monthlyData[monthKey].notSupported++;
          } else if (item.syor_status && item.syor_status.includes('SOKONG')) {
            monthlyData[monthKey].supported++;
          }
        }
      }
    });
    
    recommenderMonthlyChart = new Chart(monthlyCtx, {
      type: 'bar',
      data: {
        labels: monthlyLabels.map(key => monthlyData[key]?.label || key),
        datasets: [
          {
            label: 'SOKONG',
            data: monthlyLabels.map(key => monthlyData[key]?.supported || 0),
            backgroundColor: '#10b981',
            borderColor: '#059669',
            borderWidth: 1
          },
          {
            label: 'TIDAK DISOKONG',
            data: monthlyLabels.map(key => monthlyData[key]?.notSupported || 0),
            backgroundColor: '#ef4444',
            borderColor: '#dc2626',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Bilangan Syor'
            },
            ticks: {
              stepSize: 1,
              callback: function(value) {
                return Number.isInteger(value) ? value : '';
              }
            }
          },
          x: {
            title: {
              display: true,
              text: 'Bulan'
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Trend Syor Bulanan'
          }
        }
      }
    });
  }

  function updateApproverCharts(userData, filteredData) {
    if (approverMonthlyChart) {
      approverMonthlyChart.destroy();
      approverMonthlyChart = null;
    }
    
    const monthlyTrendCanvas = document.getElementById('chartMonthlyTrend');
    if (!monthlyTrendCanvas) {
      console.error('V6.5.1 Approver chart canvas elements not found');
      return;
    }
    
    const monthlyCtx = monthlyTrendCanvas.getContext('2d');
    if (!monthlyCtx) {
      console.error('V6.5.1 Could not get 2D context for approver charts');
      return;
    }
    
    monthlyCtx.clearRect(0, 0, monthlyTrendCanvas.width, monthlyTrendCanvas.height);
    
    const monthlyData = {};
    const monthlyLabels = [];
    
    const currentYear = dashboardData.currentYear;
    const currentMonth = dashboardData.currentMonth;
    
    const monthsToShow = 6;
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - 1 - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = `${date.toLocaleString('ms-MY', { month: 'short' })} ${date.getFullYear()}`;
      monthlyData[monthKey] = {
        label: monthLabel,
        approved: 0,
        rejected: 0
      };
      monthlyLabels.push(monthKey);
    }
    
    filteredData.forEach(item => {
      if (item.start_date) {
        const date = new Date(item.start_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (monthlyData[monthKey]) {
          if (item.kelulusan && item.kelulusan.includes('LULUS')) {
            monthlyData[monthKey].approved++;
          } else if (item.kelulusan && (item.kelulusan.includes('TOLAK') || item.kelulusan.includes('SIASAT'))) {
            monthlyData[monthKey].rejected++;
          }
        }
      }
    });
    
    approverMonthlyChart = new Chart(monthlyCtx, {
      type: 'bar',
      data: {
        labels: monthlyLabels.map(key => monthlyData[key]?.label || key),
        datasets: [
          {
            label: 'DILULUSKAN',
            data: monthlyLabels.map(key => monthlyData[key]?.approved || 0),
            backgroundColor: '#10b981',
            borderColor: '#059669',
            borderWidth: 1
          },
          {
            label: 'DITOLAK/SIASAT',
            data: monthlyLabels.map(key => monthlyData[key]?.rejected || 0),
            backgroundColor: '#ef4444',
            borderColor: '#dc2626',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Bilangan Permohonan'
            },
            ticks: {
              stepSize: 1
            }
          },
          x: {
            title: {
              display: true,
              text: 'Bulan'
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Trend Kelulusan Bulanan'
          }
        }
      }
    });
  }

  function updateReasonStats(data) {
    if (!reasonStats) return;
    
    const reasonCounts = {};
    const rejectedData = data.filter(item => 
      item.kelulusan && (item.kelulusan.includes('TOLAK') || item.kelulusan.includes('SIASAT'))
    );
    
    rejectedData.forEach(item => {
      const alasan = item.alasan || 'Tiada alasan dinyatakan';
      if (reasonCounts[alasan]) {
        reasonCounts[alasan]++;
      } else {
        reasonCounts[alasan] = 1;
      }
    });
    
    let reasonCardsHtml = '';
    const totalRejected = rejectedData.length;
    const reasonColors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#06b6d4'];
    
    let colorIndex = 0;
    for (const [reason, count] of Object.entries(reasonCounts)) {
      const percentage = totalRejected > 0 ? Math.round((count / totalRejected) * 100) : 0;
      const color = reasonColors[colorIndex % reasonColors.length];
      
      reasonCardsHtml += `
        <div class="reason-card" style="border-left-color: ${color};">
          <h4>
            <span>${reason}</span>
            <span class="reason-count">${count}</span>
          </h4>
          <div>${percentage}% dari total ditolak</div>
          <div class="reason-bar">
            <div class="reason-fill" style="width: ${percentage}%; background: ${color};"></div>
          </div>
        </div>
      `;
      
      colorIndex++;
    }
    
    if (reasonCardsHtml === '') {
      reasonCardsHtml = '<div style="color: #64748b; font-size: 0.9rem; text-align: center;">Tiada data alasan penolakan</div>';
    }
    
    reasonStats.innerHTML = reasonCardsHtml;
  }

  function updateDetailedTable(data, period) {
    if (!detailedTableBody) return;
    
    let rowsHtml = '';
    
    if (period === 'yearly') {
      const months = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogos', 'Sep', 'Okt', 'Nov', 'Dis'];
      
      months.forEach((month, index) => {
        const monthData = data.filter(item => {
          if (!item.start_date) return false;
          const date = new Date(item.start_date);
          return date.getMonth() === index;
        });
        
        if (currentUser.role === 'PENGESYOR') {
          const user = currentUser.name.toUpperCase();
          const userData = monthData.filter(item => item.pengesyor && item.pengesyor.toUpperCase() === user);
          
          const total = userData.length;
          const supported = userData.filter(item => 
            item.syor_status && item.syor_status.includes('SOKONG') && !item.syor_status.includes('TIDAK')
          ).length;
          const notSupported = userData.filter(item => 
            item.syor_status && item.syor_status.includes('TIDAK DISOKONG')
          ).length;
          const inProcess = userData.filter(item => 
            !item.syor_status || item.syor_status === ''
          ).length;
          const rate = total > 0 ? Math.round((supported / total) * 100) : 0;
          
          rowsHtml += `
            <tr>
              <td>${month}</td>
              <td>${total}</td>
              <td>${supported}</td>
              <td>${notSupported}</td>
              <td>${inProcess}</td>
              <td>${rate}%</td>
            </tr>
          `;
        } else {
          const total = monthData.length;
          const approved = monthData.filter(item => 
            item.kelulusan && item.kelulusan.includes('LULUS')
          ).length;
          const rejected = monthData.filter(item => 
            item.kelulusan && (item.kelulusan.includes('TOLAK') || item.kelulusan.includes('SIASAT'))
          ).length;
          const inProcess = monthData.filter(item => 
            !item.kelulusan || item.kelulusan === ''
          ).length;
          const rate = total > 0 ? Math.round((approved / total) * 100) : 0;
          
          rowsHtml += `
            <tr>
              <td>${month}</td>
              <td>${total}</td>
              <td>${approved}</td>
              <td>${rejected}</td>
              <td>${inProcess}</td>
              <td>${rate}%</td>
            </tr>
          `;
        }
      });
    } else if (period === 'daily') {
      rowsHtml = `
        <tr>
          <td colspan="6" style="text-align:center;">
            Paparan Harian: ${dashboardData.currentDay}/${dashboardData.currentMonth}/${dashboardData.currentYear}<br>
            Jumlah rekod: ${data.length}
          </td>
        </tr>
      `;
    } else {
      const monthNames = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];
      const monthName = monthNames[dashboardData.currentMonth - 1];
      
      const weeks = [];
      data.forEach(item => {
        if (item.start_date) {
          const date = new Date(item.start_date);
          const week = Math.ceil(date.getDate() / 7);
          if (!weeks[week]) weeks[week] = [];
          weeks[week].push(item);
        }
      });
      
      for (let week = 1; week <= 5; week++) {
        const weekData = weeks[week] || [];
        
        if (currentUser.role === 'PENGESYOR') {
          const user = currentUser.name.toUpperCase();
          const userData = weekData.filter(item => item.pengesyor && item.pengesyor.toUpperCase() === user);
          
          const total = userData.length;
          const supported = userData.filter(item => 
            item.syor_status && item.syor_status.includes('SOKONG') && !item.syor_status.includes('TIDAK')
          ).length;
          const notSupported = userData.filter(item => 
            item.syor_status && item.syor_status.includes('TIDAK DISOKONG')
          ).length;
          const inProcess = userData.filter(item => 
            !item.syor_status || item.syor_status === ''
          ).length;
          const rate = total > 0 ? Math.round((supported / total) * 100) : 0;
          
          rowsHtml += `
            <tr>
              <td>Minggu ${week} (${monthName})</td>
              <td>${total}</td>
              <td>${supported}</td>
              <td>${notSupported}</td>
              <td>${inProcess}</td>
              <td>${rate}%</td>
            </tr>
          `;
        } else {
          const total = weekData.length;
          const approved = weekData.filter(item => 
            item.kelulusan && item.kelulusan.includes('LULUS')
          ).length;
          const rejected = weekData.filter(item => 
            item.kelulusan && (item.kelulusan.includes('TOLAK') || item.kelulusan.includes('SIASAT'))
          ).length;
          const inProcess = weekData.filter(item => 
            !item.kelulusan || item.kelulusan === ''
          ).length;
          const rate = total > 0 ? Math.round((approved / total) * 100) : 0;
          
          rowsHtml += `
            <tr>
              <td>Minggu ${week} (${monthName})</td>
              <td>${total}</td>
              <td>${approved}</td>
              <td>${rejected}</td>
              <td>${inProcess}</td>
              <td>${rate}%</td>
            </tr>
          `;
        }
      }
    }
    
    if (rowsHtml === '') {
      rowsHtml = `<tr><td colspan="6" style="text-align:center;">Tiada data untuk dipaparkan</td></tr>`;
    }
    
    detailedTableBody.innerHTML = rowsHtml;
  }

  function showDashboardNoData() {
    if (document.querySelector('.stat-card')) {
      document.querySelectorAll('.stat-card').forEach(card => {
        card.style.display = 'none';
      });
    }
    
    if (chartTypeMonthlyContainer) chartTypeMonthlyContainer.style.display = 'none';
    if (chartTypeYearlyContainer) chartTypeYearlyContainer.style.display = 'none';
    
    if (approverMonthlyChart) {
      approverMonthlyChart.destroy();
      approverMonthlyChart = null;
    }
    
    if (recommenderMonthlyChart) {
      recommenderMonthlyChart.destroy();
      recommenderMonthlyChart = null;
    }
    
    if (typeMonthlyChart) {
      typeMonthlyChart.destroy();
      typeMonthlyChart = null;
    }
    
    if (typeYearlyChart) {
      typeYearlyChart.destroy();
      typeYearlyChart = null;
    }
    
    dashboardStatusChart = safeDestroyChart(dashboardStatusChart, 'chartStatus');
    dashboardTypeChart = safeDestroyChart(dashboardTypeChart, 'chartTypeDist');
    dashboardReasonChart = safeDestroyChart(dashboardReasonChart, 'chartReasonDist');
    dashboardTrendChart = safeDestroyChart(dashboardTrendChart, 'chartMonthlyTrend');
    dashboardKonsultansiChart = safeDestroyChart(dashboardKonsultansiChart, 'chartKonsultansi');
    
    const canvases = [
      'chartMonthlyTrend', 'chartStatus', 'chartTypeMonthly', 'chartTypeYearly',
      'chartTypeDist', 'chartReasonDist', 'chartKonsultansi'
    ];
    
    canvases.forEach(canvasId => {
      const canvas = document.getElementById(canvasId);
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    });

    if (dashboardUserInfo) {
      dashboardUserInfo.innerHTML = `
        <p style="margin: 0; font-weight: 600; color: #64748b;">
          📊 Tiada data untuk dipaparkan
        </p>
        <p style="margin: 5px 0 0 0; font-size: 0.9rem; color: #94a3b8;">
          Sila muat turun data atau hantar permohonan terlebih dahulu
        </p>
      `;
    }
    
    if (detailedTableBody) {
      detailedTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Tiada data untuk dipaparkan</td></tr>`;
    }
    
    if (chartMonthlyTrend) {
      const container = chartMonthlyTrend.parentElement;
      if (container) {
        container.style.display = 'none';
      }
    }
    
    if (chartStatus) {
      const container = chartStatus.parentElement;
      if (container) {
        container.style.display = 'none';
      }
    }
    
    if (chartTypeMonthly) {
      const container = chartTypeMonthly.parentElement;
      if (container) {
        container.style.display = 'none';
      }
    }
    
    if (chartTypeYearly) {
      const container = chartTypeYearly.parentElement;
      if (container) {
        container.style.display = 'none';
      }
    }
    
    if (applicationTypeChartContainer) {
      applicationTypeChartContainer.style.display = 'none';
    }
    
    if (rejectionReasonChartContainer) {
      rejectionReasonChartContainer.style.display = 'none';
    }
  }

  // =========================================================================
  // FUNGSI ADMIN DASHBOARD
  // =========================================================================

  function loadAdminDashboard() {
    console.log("V6.5.1 Loading admin dashboard...");
    
    if (!cachedData || cachedData.length === 0) {
      console.warn("V6.5.1 No data for admin dashboard");
      if (adminTotalCount) adminTotalCount.textContent = '0';
      if (adminApprovedCount) adminApprovedCount.textContent = '0';
      if (adminRejectedCount) adminRejectedCount.textContent = '0';
      if (adminPendingCount) adminPendingCount.textContent = '0';
      if (adminPengesyorTbody) adminPengesyorTbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Tiada data</td></tr>';
      if (adminPelulusTbody) adminPelulusTbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Tiada data</td></tr>';
      if (adminRejectionReasonStats) adminRejectionReasonStats.innerHTML = '<div style="text-align:center; color:#64748b;">Tiada data penolakan</div>';
      const adminJenisTbody = document.getElementById('adminJenisTbody');
      if (adminJenisTbody) adminJenisTbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Tiada data</td></tr>';
      return;
    }
    
    const selectedMonth = adminFilterMonth ? parseInt(adminFilterMonth.value) : null;
    const selectedYear = adminFilterYear ? parseInt(adminFilterYear.value) : dashboardData.currentYear;
    
    let filteredData = cachedData;
    if (selectedMonth && selectedYear) {
      filteredData = cachedData.filter(item => {
        let dateToUse = null;
        if (item.start_date) {
          dateToUse = new Date(item.start_date);
        } else if (item.tarikh_lulus) {
          dateToUse = new Date(item.tarikh_lulus);
        } else if (item.date_submit) {
          dateToUse = new Date(item.date_submit);
        }
        
        if (!dateToUse || isNaN(dateToUse)) return false;
        
        return dateToUse.getMonth() + 1 === selectedMonth && dateToUse.getFullYear() === selectedYear;
      });
    } else if (selectedYear) {
      filteredData = cachedData.filter(item => {
        let dateToUse = null;
        if (item.start_date) {
          dateToUse = new Date(item.start_date);
        } else if (item.tarikh_lulus) {
          dateToUse = new Date(item.tarikh_lulus);
        } else if (item.date_submit) {
          dateToUse = new Date(item.date_submit);
        }
        
        if (!dateToUse || isNaN(dateToUse)) return false;
        
        return dateToUse.getFullYear() === selectedYear;
      });
    }
    
    const total = filteredData.length;
    const lulus = filteredData.filter(item => item.kelulusan && item.kelulusan.includes('LULUS')).length;
    const tolak = filteredData.filter(item => item.kelulusan && (item.kelulusan.includes('TOLAK') || item.kelulusan.includes('SIASAT'))).length;
    const proses = total - (lulus + tolak);
    
    if (adminTotalCount) adminTotalCount.textContent = total;
    if (adminApprovedCount) adminApprovedCount.textContent = lulus;
    if (adminRejectedCount) adminRejectedCount.textContent = tolak;
    if (adminPendingCount) adminPendingCount.textContent = proses;
    
    const jenisStats = {
      'BARU': 0,
      'PEMBAHARUAN': 0,
      'UBAH MAKLUMAT': 0,
      'UBAH GRED': 0,
      'LAIN-LAIN': 0
    };
    
    filteredData.forEach(item => {
      const jenis = item.jenis ? item.jenis.toUpperCase().trim() : 'LAIN-LAIN';
      if (jenisStats.hasOwnProperty(jenis)) {
        jenisStats[jenis]++;
      } else {
        jenisStats['LAIN-LAIN']++;
      }
    });
    
    renderAdminJenisTable(jenisStats, total);
    
    const pengesyorStats = {};
    const pelulusStats = {};
    
    filteredData.forEach(item => {
      const pengesyor = item.pengesyor || 'Tiada Pengesyor';
      if (!pengesyorStats[pengesyor]) {
        pengesyorStats[pengesyor] = { total: 0, sokong: 0, tidak_sokong: 0 };
      }
      pengesyorStats[pengesyor].total++;
      
      if (item.syor_status === 'SOKONG') {
        pengesyorStats[pengesyor].sokong++;
      } else if (item.syor_status === 'TIDAK DISOKONG') {
        pengesyorStats[pengesyor].tidak_sokong++;
      }
      
      const pelulus = item.pelulus || 'Tiada Pelulus';
      if (!pelulusStats[pelulus]) {
        pelulusStats[pelulus] = { total: 0, lulus: 0, tolak: 0 };
      }
      pelulusStats[pelulus].total++;
      
      if (item.kelulusan && item.kelulusan.includes('LULUS')) {
        pelulusStats[pelulus].lulus++;
      } else if (item.kelulusan && (item.kelulusan.includes('TOLAK') || item.kelulusan.includes('SIASAT'))) {
        pelulusStats[pelulus].tolak++;
      }
    });
    
    renderAdminPengesyorTable(pengesyorStats);
    renderAdminPelulusTable(pelulusStats);
    
    renderAdminRejectionReasons(filteredData);
  }

  function renderAdminJenisTable(jenisStats, total) {
    const adminJenisTbody = document.getElementById('adminJenisTbody');
    if (!adminJenisTbody) return;
    
    let html = '';
    const jenisColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#64748b'];
    let colorIndex = 0;
    
    for (const [jenis, count] of Object.entries(jenisStats)) {
      if (count > 0) {
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
        const color = jenisColors[colorIndex % jenisColors.length];
        html += `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px; font-weight: 600;">${jenis}</td>
            <td style="padding: 8px; text-align: center; font-weight: bold;">${count}</td>
            <td style="padding: 8px;">
              <div style="display: flex; align-items: center;">
                <span style="width: 50px;">${percentage}%</span>
                <div style="flex: 1; height: 8px; background: #e2e8f0; border-radius: 4px; margin-left: 8px;">
                  <div style="width: ${percentage}%; height: 8px; background: ${color}; border-radius: 4px;"></div>
                </div>
              </div>
            </td>
          </tr>
        `;
        colorIndex++;
      }
    }
    
    if (html === '') {
      html = '<tr><td colspan="3" style="text-align:center; padding: 8px;">Tiada data</td></tr>';
    }
    
    adminJenisTbody.innerHTML = html;
  }

  function renderAdminPengesyorTable(stats) {
    if (!adminPengesyorTbody) return;
    
    let html = '';
    const sorted = Object.entries(stats).sort((a, b) => b[1].total - a[1].total);
    
    sorted.forEach(([nama, data]) => {
      const kadarSokong = data.total > 0 ? Math.round((data.sokong / data.total) * 100) : 0;
      html += `
        <tr>
          <td>${nama}</td>
          <td>${data.total}</td>
          <td>${data.sokong}</td>
          <td>${data.tidak_sokong}</td>
          <td>${kadarSokong}%</td>
        </tr>
      `;
    });
    
    if (html === '') {
      html = '<tr><td colspan="5" style="text-align:center;">Tiada data</td></tr>';
    }
    
    adminPengesyorTbody.innerHTML = html;
  }

  function renderAdminPelulusTable(stats) {
    if (!adminPelulusTbody) return;
    
    let html = '';
    const sorted = Object.entries(stats).sort((a, b) => b[1].total - a[1].total);
    
    sorted.forEach(([nama, data]) => {
      const kadarLulus = data.total > 0 ? Math.round((data.lulus / data.total) * 100) : 0;
      html += `
        <tr>
          <td>${nama}</td>
          <td>${data.total}</td>
          <td>${data.lulus}</td>
          <td>${data.tolak}</td>
          <td>${kadarLulus}%</td>
        </tr>
      `;
    });
    
    if (html === '') {
      html = '<tr><td colspan="5" style="text-align:center;">Tiada data</td></tr>';
    }
    
    adminPelulusTbody.innerHTML = html;
  }
  
  function renderAdminRejectionReasons(data) {
    if (!adminRejectionReasonStats) return;
    
    const rejectedData = data.filter(item => 
      item.kelulusan && (item.kelulusan.includes('TOLAK') || item.kelulusan.includes('SIASAT'))
    );
    
    if (rejectedData.length === 0) {
      adminRejectionReasonStats.innerHTML = '<div style="text-align:center; padding:20px; color:#64748b;">Tiada rekod penolakan untuk tempoh ini</div>';
      return;
    }
    
    const reasonCounts = {};
    rejectedData.forEach(item => {
      const alasan = item.alasan || 'Tiada alasan dinyatakan';
      reasonCounts[alasan] = (reasonCounts[alasan] || 0) + 1;
    });
    
    const sortedReasons = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]);
    const totalRejected = rejectedData.length;
    
    let html = '<table style="width:100%; border-collapse:collapse;">';
    html += '<thead><tr style="background:#1e40af; color:white;"><th>Alasan Penolakan</th><th>Bilangan</th><th>Peratusan</th></tr></thead><tbody>';
    
    sortedReasons.forEach(([alasan, count]) => {
      const percentage = Math.round((count / totalRejected) * 100);
      html += `
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:8px;">${alasan}</td>
          <td style="padding:8px; text-align:center; font-weight:bold;">${count}</td>
          <td style="padding:8px;">
            <div style="display:flex; align-items:center;">
              <span style="width:50px;">${percentage}%</span>
              <div style="flex:1; height:8px; background:#fee2e2; border-radius:4px; margin-left:8px;">
                <div style="width:${percentage}%; height:8px; background:#ef4444; border-radius:4px;"></div>
              </div>
            </div>
          </td>
        </tr>
      `;
    });
    
    html += '</tbody></table>';
    adminRejectionReasonStats.innerHTML = html;
  }

  function showAdminStatsModal() {
    if (!adminStatsModal || !adminStatsPrintContent) return;
    
    const now = new Date();
    const dateStr = now.toLocaleDateString('ms-MY', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    if (adminStatsDate) {
      adminStatsDate.textContent = `Dijana pada: ${dateStr}`;
    }
    
    const selectedMonth = adminFilterMonth ? parseInt(adminFilterMonth.value) : null;
    const selectedYear = adminFilterYear ? parseInt(adminFilterYear.value) : dashboardData.currentYear;
    
    let filteredData = cachedData;
    if (selectedMonth && selectedYear) {
      filteredData = cachedData.filter(item => {
        let dateToUse = null;
        if (item.start_date) {
          dateToUse = new Date(item.start_date);
        } else if (item.tarikh_lulus) {
          dateToUse = new Date(item.tarikh_lulus);
        } else if (item.date_submit) {
          dateToUse = new Date(item.date_submit);
        }
        
        if (!dateToUse || isNaN(dateToUse)) return false;
        
        return dateToUse.getMonth() + 1 === selectedMonth && dateToUse.getFullYear() === selectedYear;
      });
    } else if (selectedYear) {
      filteredData = cachedData.filter(item => {
        let dateToUse = null;
        if (item.start_date) {
          dateToUse = new Date(item.start_date);
        } else if (item.tarikh_lulus) {
          dateToUse = new Date(item.tarikh_lulus);
        } else if (item.date_submit) {
          dateToUse = new Date(item.date_submit);
        }
        
        if (!dateToUse || isNaN(dateToUse)) return false;
        
        return dateToUse.getFullYear() === selectedYear;
      });
    }
    
    const pengesyorStats = {};
    const pelulusStats = {};
    const jenisStats = {
      'BARU': 0,
      'PEMBAHARUAN': 0,
      'UBAH MAKLUMAT': 0,
      'UBAH GRED': 0,
      'LAIN-LAIN': 0
    };
    const rejectionReasons = {};
    
    filteredData.forEach(item => {
      const pengesyor = item.pengesyor || 'Tiada Pengesyor';
      if (!pengesyorStats[pengesyor]) {
        pengesyorStats[pengesyor] = { total: 0, sokong: 0, tidak_sokong: 0 };
      }
      pengesyorStats[pengesyor].total++;
      
      if (item.syor_status === 'SOKONG') {
        pengesyorStats[pengesyor].sokong++;
      } else if (item.syor_status === 'TIDAK DISOKONG') {
        pengesyorStats[pengesyor].tidak_sokong++;
      }
      
      const pelulus = item.pelulus || 'Tiada Pelulus';
      if (!pelulusStats[pelulus]) {
        pelulusStats[pelulus] = { total: 0, lulus: 0, tolak: 0 };
      }
      pelulusStats[pelulus].total++;
      
      if (item.kelulusan && item.kelulusan.includes('LULUS')) {
        pelulusStats[pelulus].lulus++;
      } else if (item.kelulusan && (item.kelulusan.includes('TOLAK') || item.kelulusan.includes('SIASAT'))) {
        pelulusStats[pelulus].tolak++;
        
        const alasan = item.alasan || 'Tiada alasan dinyatakan';
        rejectionReasons[alasan] = (rejectionReasons[alasan] || 0) + 1;
      }
      
      const jenis = item.jenis ? item.jenis.toUpperCase().trim() : 'LAIN-LAIN';
      if (jenisStats.hasOwnProperty(jenis)) {
        jenisStats[jenis]++;
      } else {
        jenisStats['LAIN-LAIN']++;
      }
    });
    
    let pengesyorHtml = '';
    Object.entries(pengesyorStats).sort((a, b) => b[1].total - a[1].total).forEach(([nama, data]) => {
      const kadarSokong = data.total > 0 ? Math.round((data.sokong / data.total) * 100) : 0;
      pengesyorHtml += `
        <tr>
          <td>${nama}</td>
          <td>${data.total}</td>
          <td>${data.sokong}</td>
          <td>${data.tidak_sokong}</td>
          <td>${kadarSokong}%</td>
        </tr>
      `;
    });
    
    let pelulusHtml = '';
    Object.entries(pelulusStats).sort((a, b) => b[1].total - a[1].total).forEach(([nama, data]) => {
      const kadarLulus = data.total > 0 ? Math.round((data.lulus / data.total) * 100) : 0;
      pelulusHtml += `
        <tr>
          <td>${nama}</td>
          <td>${data.total}</td>
          <td>${data.lulus}</td>
          <td>${data.tolak}</td>
          <td>${kadarLulus}%</td>
        </tr>
      `;
    });
    
    let jenisHtml = '';
    const jenisColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#64748b'];
    let colorIndex = 0;
    for (const [jenis, count] of Object.entries(jenisStats)) {
      if (count > 0) {
        const color = jenisColors[colorIndex % jenisColors.length];
        jenisHtml += `
          <div style="display: flex; justify-content: space-between; padding: 8px; border-bottom: 1px solid #e2e8f0;">
            <span style="font-weight: 600;">${jenis}</span>
            <span style="background: ${color}; color: white; padding: 2px 10px; border-radius: 20px;">${count}</span>
          </div>
        `;
        colorIndex++;
      }
    }
    
    let rejectionHtml = '';
    const totalRejected = filteredData.filter(item => item.kelulusan && (item.kelulusan.includes('TOLAK') || item.kelulusan.includes('SIASAT'))).length;
    const sortedReasons = Object.entries(rejectionReasons).sort((a, b) => b[1] - a[1]);
    
    sortedReasons.forEach(([alasan, count]) => {
      const percentage = totalRejected > 0 ? Math.round((count / totalRejected) * 100) : 0;
      rejectionHtml += `
        <div style="display: flex; justify-content: space-between; padding: 6px; border-bottom: 1px solid #fee2e2;">
          <span>${alasan}</span>
          <span style="font-weight: bold; color: #b91c1c;">${count} (${percentage}%)</span>
        </div>
      `;
    });
    
    const totalT = filteredData.length;
    const lulusT = filteredData.filter(item => item.kelulusan && item.kelulusan.includes('LULUS')).length;
    const tolakT = filteredData.filter(item => item.kelulusan && (item.kelulusan.includes('TOLAK') || item.kelulusan.includes('SIASAT'))).length;
    const prosesT = totalT - (lulusT + tolakT);
    
    const filterInfo = (selectedMonth && selectedYear) 
      ? `Bulan: ${new Date(selectedYear, selectedMonth - 1).toLocaleString('ms-MY', { month: 'long' })} ${selectedYear}`
      : (selectedYear ? `Tahun: ${selectedYear}` : 'Semua Data');
    
    adminStatsPrintContent.innerHTML = `
      <div style="margin-bottom: 20px;">
        <h3 style="color: #1e40af; text-align: center;">RINGKASAN KESELURUHAN</h3>
        <div style="text-align: center; margin-bottom: 10px; font-weight: bold; color: #64748b;">${filterInfo}</div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 15px;">
          <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; text-align: center; border-left: 5px solid #2563eb;">
            <div style="font-size: 24px; font-weight: bold; color: #2563eb;">${totalT}</div>
            <div style="font-size: 12px; color: #64748b;">JUMLAH</div>
          </div>
          <div style="background: #dcfce7; padding: 15px; border-radius: 8px; text-align: center; border-left: 5px solid #22c55e;">
            <div style="font-size: 24px; font-weight: bold; color: #166534;">${lulusT}</div>
            <div style="font-size: 12px; color: #64748b;">LULUS</div>
          </div>
          <div style="background: #fee2e2; padding: 15px; border-radius: 8px; text-align: center; border-left: 5px solid #ef4444;">
            <div style="font-size: 24px; font-weight: bold; color: #991b1b;">${tolakT}</div>
            <div style="font-size: 12px; color: #64748b;">TOLAK/SIASAT</div>
          </div>
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; text-align: center; border-left: 5px solid #f59e0b;">
            <div style="font-size: 24px; font-weight: bold; color: #92400e;">${prosesT}</div>
            <div style="font-size: 12px; color: #64748b;">DALAM PROSES</div>
          </div>
        </div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #1e40af;">STATISTIK JENIS PERMOHONAN</h3>
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          ${jenisHtml || '<div style="padding: 10px; text-align: center;">Tiada data</div>'}
        </div>
      </div>
      
      ${rejectionHtml ? `
      <div style="margin-bottom: 20px;">
        <h3 style="color: #1e40af;">ANALISIS PENOLAKAN</h3>
        <div style="border: 1px solid #fee2e2; border-radius: 8px; background: #fef2f2; padding: 10px;">
          ${rejectionHtml}
        </div>
      </div>
      ` : ''}
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #1e40af;">STATISTIK MENGIKUT PENGESYOR</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #1e40af; color: white;">
              <th style="padding: 8px; border: 1px solid #3b82f6;">Pengesyor</th>
              <th style="padding: 8px; border: 1px solid #3b82f6;">Jumlah</th>
              <th style="padding: 8px; border: 1px solid #3b82f6;">SOKONG</th>
              <th style="padding: 8px; border: 1px solid #3b82f6;">TIDAK DISOKONG</th>
              <th style="padding: 8px; border: 1px solid #3b82f6;">Kadar Sokongan</th>
            </tr>
          </thead>
          <tbody>
            ${pengesyorHtml || '<tr><td colspan="5" style="text-align:center; padding: 8px;">Tiada data</td></tr>'}
          </tbody>
        </table>
      </div>
      
      <div>
        <h3 style="color: #1e40af;">STATISTIK MENGIKUT PELULUS</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #1e40af; color: white;">
              <th style="padding: 8px; border: 1px solid #3b82f6;">Pelulus</th>
              <th style="padding: 8px; border: 1px solid #3b82f6;">Jumlah</th>
              <th style="padding: 8px; border: 1px solid #3b82f6;">LULUS</th>
              <th style="padding: 8px; border: 1px solid #3b82f6;">TOLAK</th>
              <th style="padding: 8px; border: 1px solid #3b82f6;">Kadar Kelulusan</th>
            </tr>
          </thead>
          <tbody>
            ${pelulusHtml || '<tr><td colspan="5" style="text-align:center; padding: 8px;">Tiada data</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
    
    adminStatsModal.classList.add('active');
  }

  // =========================================================================
  // FUNGSI MUAT TURUN CSV
  // =========================================================================
  
  function downloadAdminStatsCSV() {
    if (!cachedData || cachedData.length === 0) {
      alert("Tiada data untuk dimuat turun.");
      return;
    }
    
    const selectedMonth = adminFilterMonth ? parseInt(adminFilterMonth.value) : null;
    const selectedYear = adminFilterYear ? parseInt(adminFilterYear.value) : dashboardData.currentYear;
    
    let filteredData = cachedData;
    if (selectedMonth && selectedYear) {
      filteredData = cachedData.filter(item => {
        let dateToUse = null;
        if (item.start_date) {
          dateToUse = new Date(item.start_date);
        } else if (item.tarikh_lulus) {
          dateToUse = new Date(item.tarikh_lulus);
        } else if (item.date_submit) {
          dateToUse = new Date(item.date_submit);
        }
        
        if (!dateToUse || isNaN(dateToUse)) return false;
        
        return dateToUse.getMonth() + 1 === selectedMonth && dateToUse.getFullYear() === selectedYear;
      });
    } else if (selectedYear) {
      filteredData = cachedData.filter(item => {
        let dateToUse = null;
        if (item.start_date) {
          dateToUse = new Date(item.start_date);
        } else if (item.tarikh_lulus) {
          dateToUse = new Date(item.tarikh_lulus);
        } else if (item.date_submit) {
          dateToUse = new Date(item.date_submit);
        }
        
        if (!dateToUse || isNaN(dateToUse)) return false;
        
        return dateToUse.getFullYear() === selectedYear;
      });
    }
    
    const total = filteredData.length;
    const lulus = filteredData.filter(item => item.kelulusan && item.kelulusan.includes('LULUS')).length;
    const tolak = filteredData.filter(item => item.kelulusan && (item.kelulusan.includes('TOLAK') || item.kelulusan.includes('SIASAT'))).length;
    const proses = total - (lulus + tolak);
    
    const jenisStats = {};
    filteredData.forEach(item => {
      const jenis = item.jenis || 'LAIN-LAIN';
      jenisStats[jenis] = (jenisStats[jenis] || 0) + 1;
    });
    
    const rejectionReasons = {};
    filteredData.forEach(item => {
      if (item.kelulusan && (item.kelulusan.includes('TOLAK') || item.kelulusan.includes('SIASAT'))) {
        const alasan = item.alasan || 'Tiada alasan';
        rejectionReasons[alasan] = (rejectionReasons[alasan] || 0) + 1;
      }
    });
    
    const pengesyorStats = {};
    filteredData.forEach(item => {
      const pengesyor = item.pengesyor || 'Tiada Pengesyor';
      if (!pengesyorStats[pengesyor]) {
        pengesyorStats[pengesyor] = { total: 0, sokong: 0, tidak_sokong: 0 };
      }
      pengesyorStats[pengesyor].total++;
      if (item.syor_status === 'SOKONG') pengesyorStats[pengesyor].sokong++;
      else if (item.syor_status === 'TIDAK DISOKONG') pengesyorStats[pengesyor].tidak_sokong++;
    });
    
    const pelulusStats = {};
    filteredData.forEach(item => {
      const pelulus = item.pelulus || 'Tiada Pelulus';
      if (!pelulusStats[pelulus]) {
        pelulusStats[pelulus] = { total: 0, lulus: 0, tolak: 0 };
      }
      pelulusStats[pelulus].total++;
      if (item.kelulusan && item.kelulusan.includes('LULUS')) pelulusStats[pelulus].lulus++;
      else if (item.kelulusan && (item.kelulusan.includes('TOLAK') || item.kelulusan.includes('SIASAT'))) pelulusStats[pelulus].tolak++;
    });
    
    let csvContent = "LAPORAN STATISTIK ADMIN\n";
    csvContent += `Tarikh Jana,${new Date().toLocaleString('ms-MY')}\n`;
    csvContent += `Tempoh,${selectedMonth ? `Bulan ${selectedMonth} ` : ''}Tahun ${selectedYear}\n\n`;
    
    csvContent += "RINGKASAN KESELURUHAN\n";
    csvContent += `Jumlah,${total}\n`;
    csvContent += `LULUS,${lulus}\n`;
    csvContent += `TOLAK/SIASAT,${tolak}\n`;
    csvContent += `DALAM PROSES,${proses}\n\n`;
    
    csvContent += "ANALISIS MENGIKUT JENIS PERMOHONAN\n";
    csvContent += "Jenis,Bilangan\n";
    Object.entries(jenisStats).forEach(([jenis, count]) => {
      csvContent += `${jenis},${count}\n`;
    });
    csvContent += "\n";
    
    csvContent += "ANALISIS PENOLAKAN MENGIKUT ALASAN\n";
    csvContent += "Alasan,Bilangan\n";
    Object.entries(rejectionReasons).forEach(([alasan, count]) => {
      csvContent += `"${alasan}",${count}\n`;
    });
    csvContent += "\n";
    
    csvContent += "PRESTASI PENGESYOR\n";
    csvContent += "Pengesyor,Jumlah,SOKONG,TIDAK DISOKONG,Kadar Sokongan\n";
    Object.entries(pengesyorStats).forEach(([nama, data]) => {
      const kadar = data.total > 0 ? Math.round((data.sokong / data.total) * 100) : 0;
      csvContent += `"${nama}",${data.total},${data.sokong},${data.tidak_sokong},${kadar}%\n`;
    });
    csvContent += "\n";
    
    csvContent += "PRESTASI PELULUS\n";
    csvContent += "Pelulus,Jumlah,LULUS,TOLAK,Kadar Kelulusan\n";
    Object.entries(pelulusStats).forEach(([nama, data]) => {
      const kadar = data.total > 0 ? Math.round((data.lulus / data.total) * 100) : 0;
      csvContent += `"${nama}",${data.total},${data.lulus},${data.tolak},${kadar}%\n`;
    });
    
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `admin_stats_${selectedYear}${selectedMonth ? '_'+selectedMonth : ''}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function downloadDashboardCSV() {
    if (!cachedData || cachedData.length === 0) {
      alert("Tiada data untuk dimuat turun.");
      return;
    }
    
    const currentYear = dashboardData.currentYear;
    const currentMonth = dashboardData.currentMonth;
    const currentDay = dashboardData.currentDay;
    const period = dashboardData.currentPeriod;
    
    let filteredData = [];
    
    if (period === 'yearly') {
      filteredData = cachedData.filter(item => {
        let dateToUse = item.start_date ? new Date(item.start_date) : (item.tarikh_lulus ? new Date(item.tarikh_lulus) : (item.date_submit ? new Date(item.date_submit) : null));
        if (!dateToUse || isNaN(dateToUse)) return false;
        return dateToUse.getFullYear() === currentYear;
      });
    } else if (period === 'daily') {
      filteredData = cachedData.filter(item => {
        let dateToUse = item.start_date ? new Date(item.start_date) : (item.tarikh_lulus ? new Date(item.tarikh_lulus) : (item.date_submit ? new Date(item.date_submit) : null));
        if (!dateToUse || isNaN(dateToUse)) return false;
        return dateToUse.getFullYear() === currentYear && dateToUse.getMonth() + 1 === currentMonth && dateToUse.getDate() === currentDay;
      });
    } else {
      filteredData = cachedData.filter(item => {
        let dateToUse = item.start_date ? new Date(item.start_date) : (item.tarikh_lulus ? new Date(item.tarikh_lulus) : (item.date_submit ? new Date(item.date_submit) : null));
        if (!dateToUse || isNaN(dateToUse)) return false;
        return dateToUse.getFullYear() === currentYear && dateToUse.getMonth() + 1 === currentMonth;
      });
    }
    
    let userSpecificData = filteredData.filter(item => {
      if (currentUser.role === 'ADMIN' || currentUser.role === 'KETUA SEKSYEN' || currentUser.role === 'PENGARAH') {
        return true;
      } else if (currentUser.role === 'PENGESYOR') {
        return item.pengesyor && item.pengesyor.trim().toUpperCase() === currentUser.name.trim().toUpperCase();
      } else if (currentUser.role === 'PELULUS') {
        return item.pelulus && item.pelulus.trim().toUpperCase() === currentUser.name.trim().toUpperCase();
      }
      return false;
    });
    
    let csvContent = "DATA DASHBOARD INDIVIDU\n";
    csvContent += `Pengguna,${currentUser.name} (${currentUser.role})\n`;
    csvContent += `Tempoh,${period} ${currentYear}${period === 'daily' ? `-${currentMonth}-${currentDay}` : (period === 'monthly' ? `-${currentMonth}` : '')}\n`;
    csvContent += `Tarikh Jana,${new Date().toLocaleString('ms-MY')}\n\n`;
    
    csvContent += "KUMPULAN: BELUM SYOR\n";
    csvContent += "Nama Syarikat,No. CIDB,Jenis Permohonan,Tarikh Mohon,Nama Pengesyor,Status Syor,Nama Pelulus,Status Kelulusan\n";
    const belumSyor = userSpecificData.filter(item => !item.tarikh_syor);
    belumSyor.forEach(item => {
      csvContent += `"${item.syarikat || '-'}",${item.cidb || '-'},${item.jenis || '-'},${item.start_date || '-'},${item.pengesyor || '-'},${item.syor_status || '-'},${item.pelulus || '-'},${item.kelulusan || '-'}\n`;
    });
    
    csvContent += "\nKUMPULAN: TELAH SYOR (MENUNGGU KELULUSAN)\n";
    csvContent += "Nama Syarikat,No. CIDB,Jenis Permohonan,Tarikh Mohon,Nama Pengesyor,Status Syor,Nama Pelulus,Status Kelulusan\n";
    const telahSyor = userSpecificData.filter(item => item.tarikh_syor && (!item.tarikh_lulus || item.tarikh_lulus === ''));
    telahSyor.forEach(item => {
      csvContent += `"${item.syarikat || '-'}",${item.cidb || '-'},${item.jenis || '-'},${item.start_date || '-'},${item.pengesyor || '-'},${item.syor_status || '-'},${item.pelulus || '-'},${item.kelulusan || '-'}\n`;
    });
    
    csvContent += "\nKUMPULAN: SELESAI (LULUS/TOLAK)\n";
    csvContent += "Nama Syarikat,No. CIDB,Jenis Permohonan,Tarikh Mohon,Nama Pengesyor,Status Syor,Nama Pelulus,Status Kelulusan\n";
    const selesai = userSpecificData.filter(item => item.tarikh_lulus && item.tarikh_lulus !== '');
    selesai.forEach(item => {
      csvContent += `"${item.syarikat || '-'}",${item.cidb || '-'},${item.jenis || '-'},${item.start_date || '-'},${item.pengesyor || '-'},${item.syor_status || '-'},${item.pelulus || '-'},${item.kelulusan || '-'}\n`;
    });
    
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `dashboard_${currentUser.name}_${period}_${currentYear}${currentMonth ? '_'+currentMonth : ''}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // =========================================================================
  // DYNAMIC YEAR FUNCTION
  // =========================================================================
  function updateDynamicYears(data) {
    if (!data || data.length === 0) return;
    
    const years = new Set();
    data.forEach(item => {
      if (item.start_date) {
        const year = new Date(item.start_date).getFullYear();
        if (!isNaN(year)) years.add(year);
      }
      if (item.tarikh_syor) {
        const year = new Date(item.tarikh_syor).getFullYear();
        if (!isNaN(year)) years.add(year);
      }
      if (item.tarikh_lulus) {
        const year = new Date(item.tarikh_lulus).getFullYear();
        if (!isNaN(year)) years.add(year);
      }
      if (item.date_submit) {
        const year = new Date(item.date_submit).getFullYear();
        if (!isNaN(year)) years.add(year);
      }
    });
    
    const sortedYears = Array.from(years).sort((a, b) => b - a);
    
    const yearSelectors = [
      { element: dashboardYear, addAll: false },
      { element: adminFilterYear, addAll: true },
      { element: listFilterYear, addAll: true },
      { element: document.getElementById('historyYearFilter'), addAll: true }
    ];
    
    yearSelectors.forEach(({ element, addAll }) => {
      if (element) {
        const currentVal = element.value;
        element.innerHTML = '';
        if (addAll) {
          const allOption = document.createElement('option');
          allOption.value = '';
          allOption.textContent = 'Semua Tahun';
          element.appendChild(allOption);
        }
        sortedYears.forEach(year => {
          const option = document.createElement('option');
          option.value = year;
          option.textContent = year;
          element.appendChild(option);
        });
        if (currentVal && element.querySelector(`option[value="${currentVal}"]`)) {
          element.value = currentVal;
        } else if (sortedYears.length > 0) {
          element.value = addAll ? '' : sortedYears[0];
        }
      }
    });
    
    console.log("V6.5.1 Dynamic years updated:", sortedYears);
  }

  // =========================================================================
  // PDF UPLOAD FUNCTIONALITY - MAIN FORM
  // =========================================================================

  if (pdfUploadArea) {
    pdfUploadArea.addEventListener('click', () => {
      pdfFileInput.click();
    });

    pdfUploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      pdfUploadArea.classList.add('dragover');
    });

    pdfUploadArea.addEventListener('dragleave', () => {
      pdfUploadArea.classList.remove('dragover');
    });

    pdfUploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      pdfUploadArea.classList.remove('dragover');
      
      if (e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type === 'application/pdf') {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          pdfFileInput.files = dataTransfer.files;
          
          pdfFileInput.dispatchEvent(new Event('change', { bubbles: true }));
          updateFileName(file.name);
        } else {
          alert("Sila muat naik fail PDF sahaja.");
        }
      }
    });
  }

  if (pdfFileInput) {
    pdfFileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        updateFileName(e.target.files[0].name);
      } else {
        updateFileName('Tiada fail dipilih');
      }
    });
  }

  if (btnProcessManual) {
    btnProcessManual.addEventListener('click', () => {
      processPdfManual();
    });
  }

  if (btnProcessAI) {
    btnProcessAI.addEventListener('click', () => {
      processPdfWithAI();
    });
  }

  if (btnApplyPdfData) {
    btnApplyPdfData.addEventListener('click', applyPdfDataToForm);
  }

  if (btnClearPdfData) {
    btnClearPdfData.addEventListener('click', clearPdfData);
  }

  function updateFileName(fileName) {
    if (pdfFileName) {
      pdfFileName.textContent = fileName;
      pdfFileName.style.fontWeight = 'bold';
      pdfFileName.style.color = '#3b82f6';
    }
    if (btnProcessManual) {
      btnProcessManual.disabled = fileName === 'Tiada fail dipilih';
    }
    if (btnProcessAI) {
      btnProcessAI.disabled = fileName === 'Tiada fail dipilih';
    }
  }

  async function processPdfManual() {
    if (!pdfFileInput.files.length) {
      alert("Sila pilih fail PDF terlebih dahulu.");
      return;
    }

    const file = pdfFileInput.files[0];
    
    if (file.size > 10 * 1024 * 1024) {
      alert("Fail terlalu besar. Sila pilih fail kurang daripada 10MB.");
      return;
    }

    if (pdfProcessing) {
      pdfProcessing.style.display = 'block';
      pdfProcessing.textContent = 'Memproses PDF... Sila tunggu.';
    }
    if (pdfResult) {
      pdfResult.style.display = 'none';
    }

    try {
      if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.js';
      } else {
        console.error("V6.5.1 PDF.js library not loaded");
        alert("PDF processing library tidak dimuatkan. Sila muat semula halaman.");
        return;
      }

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      let fullText = '';
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
      }

      console.log("V6.5.1 PDF Text extracted (first 5000 chars):", fullText.substring(0, 5000));
      
      extractedPdfData = extractDataFromPdfSimple(fullText);
      
      displayExtractedData(extractedPdfData);
      
      if (pdfResult) {
        pdfResult.style.display = 'block';
      }
      
      storageWrapper.set({ 'stb_extracted_pdf_data': extractedPdfData });
      
    } catch (error) {
      console.error("V6.5.1 Error processing PDF:", error);
      await playErrorSound();
      alert("Ralat memproses PDF: " + error.message);
    } finally {
      if (pdfProcessing) {
        pdfProcessing.style.display = 'none';
      }
    }
  }

  async function processPdfWithAI() {
    if (!pdfFileInput.files.length) {
      alert("Sila pilih fail PDF terlebih dahulu.");
      return;
    }

    const file = pdfFileInput.files[0];
    if (file.size > 10 * 1024 * 1024) {
      alert("Fail terlalu besar (Maks 10MB).");
      return;
    }

    let aiInterval = null;

    const updateProgress = (percent, message) => {
      if (pdfProcessing) {
        pdfProcessing.style.display = 'block';
        pdfProcessing.innerHTML = `
          <div style="margin:10px 0;">
            <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-weight:bold; color:#1e40af;">
              <span>${message}</span>
              <span>${percent}%</span>
            </div>
            <div style="width:100%; background:#e2e8f0; height:10px; border-radius:5px; overflow:hidden;">
              <div style="width:${percent}%; background:linear-gradient(90deg, #3b82f6, #60a5fa); height:100%; transition:width 0.3s ease-out;"></div>
            </div>
            <div style="font-size:0.8rem; color:#64748b; margin-top:5px; text-align:center;">Sedang memproses data...</div>
          </div>`;
      }
      if (pdfResult) pdfResult.style.display = 'none';
    };

    try {
      updateProgress(5, "Membaca fail...");
      
      if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.js';
      } else {
        throw new Error("PDF.js library not loaded");
      }

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      let fullText = '';
      const totalPages = pdf.numPages;

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
        
        const progress = 10 + Math.round((pageNum / totalPages) * 50);
        updateProgress(progress, `Mengekstrak halaman ${pageNum}/${totalPages}`);
      }

      console.log("V6.5.1 PDF Extracted. Length:", fullText.length);
      
      updateProgress(65, "Sedang Menghantar Untuk Keajaiban Backend AI...");
      
      let aiProgress = 65;
      aiInterval = setInterval(() => {
        if (aiProgress < 95) {
          aiProgress += 1;
          updateProgress(aiProgress, "Sedang menganalisis di pelayan...");
        }
      }, 500);

      extractedPdfData = await processPdfTextWithAI(fullText);
      
      if (aiInterval) clearInterval(aiInterval);
      
      updateProgress(100, "Selesai!");
      
      await playSuccessSound();
      
      setTimeout(() => {
        displayExtractedData(extractedPdfData);
        if (pdfResult) {
          pdfResult.style.display = 'block';
          pdfProcessing.style.display = 'none'; 
        }
      }, 500);
      
      storageWrapper.set({ 'stb_extracted_pdf_data': extractedPdfData });
      
    } catch (error) {
      console.error("V6.5.1 AI Error:", error);
      
      if (aiInterval) clearInterval(aiInterval);

      await playErrorSound();

      if (pdfProcessing) {
        pdfProcessing.innerHTML = `
          <div style="background:#fee2e2; padding:10px; border-radius:6px; border:1px solid #ef4444; color:#991b1b;">
            <strong>Ralat:</strong> ${error.message}
          </div>`;
      }
      alert("Gagal memproses: " + error.message);
    }
  }

  async function processPdfTextWithAI(pdfText) {
    const maxTextLength = 30000;
    const truncatedText = pdfText.length > maxTextLength
      ? pdfText.substring(0, maxTextLength) + "... [text truncated]"
      : pdfText;

    console.log("V6.5.1 (Web) Menghantar teks borang ke backend untuk AI processing...");
    
    const payload = {
      action: 'processAI',
      type: 'borang',
      text: truncatedText
    };

    const response = await fetchWithRetry(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    }, 3, 1000);

    const result = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.message || result.error || 'Gagal mengekstrak data dari pelayan AI.');
    }
    
    return result.data;
  }

  function extractDataFromPdfSimple(pdfText) {
    const extractedData = {
      companyName: '',
      cidbNumber: '',
      grade: '',
      spkkStartDate: '',
      spkkEndDate: '',
      stbStartDate: '',
      stbEndDate: '',
      directors: [],
      shareholders: [],
      spkkPersons: [],
      chequeSignatories: [],
      phoneNumbers: [],
      alamatPerniagaan: ''
    };

    console.log("V6.5.1 Mula mengekstrak data...");

    const rawText = pdfText.toUpperCase().replace(/\s+/g, ' ');
    const cleanHeaderText = rawText.replace(/TEL\s*:\s*[\d-]+\s*/g, '');

    const companyMatch = cleanHeaderText.match(/([A-Z0-9\s\.\&\-]+?)\s*\(\d{6,}[-\s]?[A-Z0-9]+\)/);
    if (companyMatch && companyMatch[1]) {
      let name = companyMatch[1].trim();
      name = name.replace(/.*(?:ADDR|ALAMAT|LUMPUR|SELANGOR|JOHOR|KUALA)[:\s]*/, '').trim();
      extractedData.companyName = name;
    }

    const cidbMatch = rawText.match(/(\d{6,}-[A-Z]{2,}\d{5,})/);
    if (cidbMatch) extractedData.cidbNumber = cidbMatch[1];
    
    const gradeMatches = rawText.match(/\b(G[1-7])\b/gi);
    if (gradeMatches && gradeMatches.length > 0) {
      extractedData.grade = gradeMatches[0].toUpperCase();
    }

    const spkkMatch = rawText.match(/KERJA KERAJAAN \(SPKK\)\s*(\d{2}\/\d{2}\/\d{4})\s*(\d{2}\/\d{2}\/\d{4})/);
    if (spkkMatch) { 
      extractedData.spkkStartDate = spkkMatch[1]; 
      extractedData.spkkEndDate = spkkMatch[2]; 
    }

    const stbMatch = rawText.match(/TARAF BUMIPUTERA \(STB\)\s*(\d{2}\/\d{2}\/\d{4})\s*(\d{2}\/\d{2}\/\d{4})/);
    if (stbMatch) { 
      extractedData.stbStartDate = stbMatch[1]; 
      extractedData.stbEndDate = stbMatch[2]; 
    }
    
    const phoneRegex = /(?:TEL|H\/P|PHONE)[\s:]*([\d\s\-\(\)\+]+)/gi;
    let phoneMatch;
    const phones = new Set();
    while ((phoneMatch = phoneRegex.exec(rawText)) !== null) {
      let phoneNum = phoneMatch[1].trim();
      phoneNum = phoneNum.replace(/\s+/g, '');
      if (phoneNum.length >= 6) {
        phones.add(phoneNum);
      }
    }
    extractedData.phoneNumbers = Array.from(phones);

    function sanitizeName(rawName) {
      let name = rawName.trim();
      
      const cutOffWords = [
        " PENGARAH", " PENGURUS", " MANAGER", " SECRETARY", " SETIAUSAHA",
        " PEMEGANG", " SAHAM", " SHARES", " EKUITI", " EQUITY",
        " LEMBAGA", " JAWATAN", " POSITION", " APPOINTMENT", " LANTIKAN", 
        " WARGANEGARA", " MALAYSIA", " MELAYU", " LELAKI", " PEREMPUAN",
        " NO.", " BIL", " IC", " KP", " PASSPORT", " MANAGING", " EXECUTIVE"
      ];

      for (let word of cutOffWords) {
        const idx = name.indexOf(word);
        if (idx !== -1) {
          name = name.substring(0, idx).trim();
        }
      }
      
      name = name.replace(/[^A-Z0-9\)\.\@\&\-\/\s]*$/, ''); 
      name = name.replace(/^[\d\.\)\-\s]+/, '');   
      
      return name.trim();
    }

    function extractNamesFromStream(streamText) {
      if (!streamText) return [];

      let cleanStream = streamText.replace(/NO\.?\s+NAME\s+IC\s+NO.*?DATE/g, ''); 
      cleanStream = cleanStream.replace(/NO\.?\s+NAMA\s+NO\.\s+KAD.*?TARIKH/g, '');

      const headerBlocklist = [
        "DIRECTOR", "PENGARAH", "SHAREHOLDER", "PEMEGANG SAHAM",
        "SPKK RESPONSIBLE", "PENAMA SPKK", "CHEQUE SIGNATORIES", "PENANDATANGAN CEK",
        "KEY MANAGEMENT", "PERSONEL PENGURUSAN", "TECHNICAL PERSONNEL", "PERSONEL TEKNIKAL",
        "COMPETENT PERSON", "ORANG KOMPETEN", "JOINT VENTURE", "KONSORTIUM", 
        "INTERNATIONAL REGISTERED", "REGISTRATION NO", "APPLICATION NO",
        "EQUITY", "BUMIPUTERA", "ASING", "BUKAN BUMIPUTERA", "AGENSI BERKAITAN"
      ];

      const regex = /(?:\b|^)(\d{1,2})(?:[\.\)\s]*)\s+([A-Z\s\.\'\@\&\-\(\)\/]+?)(?=\s+(?:\d{6,}|\d{5,}[A-Z]|[A-Z]\d{5,}|MALAYSIA|MELAYU|CINA|INDIA|LELAKI|PEREMPUAN|DIRECTOR|PENGARAH|MANAGING|WARGANEGARA))/g;

      let match;
      const names = [];
      
      while ((match = regex.exec(cleanStream)) !== null) {
        let potentialName = match[2].trim();
        
        let isHeader = false;
        for (let block of headerBlocklist) {
          if (potentialName.includes(block)) { 
            isHeader = true; 
            break; 
          }
        }
        if (isHeader) continue;

        if (potentialName.length > 80 || potentialName.length < 3) continue;

        let clean = sanitizeName(potentialName);

        if (clean.length > 3 && /[A-Z]/.test(clean) && !names.includes(clean)) {
          if (!/^[\W\d]+$/.test(clean)) {
            names.push(clean);
          }
        }
      }
      return names;
    }

    const getIndex = (pattern) => {
      const m = rawText.match(pattern);
      return m ? m.index : -1;
    };

    const idxDir = getIndex(/4\.\s*(?:DIRECTORS|PENGARAH)/);
    const idxShare = getIndex(/5\.\s*(?:SHAREHOLDERS|PEMEGANG)/);

    let idxNext = getIndex(/6\.\s*(?:KEY|PERSONEL)/);
    if (idxNext === -1) idxNext = getIndex(/7\.\s*(?:TECHNICAL|TEKNIKAL)/);

    const idxSpkk = getIndex(/(\d+\.\s+SPKK\s+(?:RESPONSIBLE|PENAMA))/);
    const idxCheque = getIndex(/(\d+\.\s+CHEQUE\s+(?:SIGNATORIES|PENANDATANGAN))/);

    let idxStopCheque = getIndex(/(?:MANDATORY|JOINT VENTURE|INTERNATIONAL|DISCLAIMER|20\.|21\.)/);
    if (idxStopCheque === -1 || idxStopCheque < idxCheque) idxStopCheque = rawText.length;

    const strDirectors = (idxDir !== -1 && idxShare !== -1) ? rawText.substring(idxDir + 15, idxShare) : "";
    const strShareholders = (idxShare !== -1 && idxNext !== -1) ? rawText.substring(idxShare + 15, idxNext) : "";

    let strSpkk = "";
    if (idxSpkk !== -1) {
      const endSpkk = (idxCheque !== -1) ? idxCheque : rawText.length;
      strSpkk = rawText.substring(idxSpkk + 25, endSpkk); 
    }

    let strCheque = "";
    if (idxCheque !== -1) {
      strCheque = rawText.substring(idxCheque + 25, idxStopCheque);
    }

    extractedData.directors = extractNamesFromStream(strDirectors);
    extractedData.shareholders = extractNamesFromStream(strShareholders);
    extractedData.spkkPersons = extractNamesFromStream(strSpkk);
    extractedData.chequeSignatories = extractNamesFromStream(strCheque);

    console.log("V6.5.1 Final Clean Data:", extractedData);
    return extractedData;
  }

  function displayExtractedData(data) {
    if (!pdfExtractedData) return;

    let html = '';

    if (data.companyName) {
      html += `<div class="extracted-item">
        <span class="extracted-label">Nama Syarikat:</span>
        <span class="extracted-value">${data.companyName}</span>
      </div>`;
    }

    if (data.cidbNumber) {
      html += `<div class="extracted-item">
        <span class="extracted-label">No. CIDB:</span>
        <span class="extracted-value">${data.cidbNumber}</span>
      </div>`;
    }
    
    if (data.grade) {
      html += `<div class="extracted-item">
        <span class="extracted-label">Gred:</span>
        <span class="extracted-value">${data.grade}</span>
      </div>`;
    }

    if (data.spkkStartDate && data.spkkEndDate) {
      html += `<div class="extracted-item">
        <span class="extracted-label">Tempoh SPKK:</span>
        <span class="extracted-value">${data.spkkStartDate} - ${data.spkkEndDate}</span>
      </div>`;
    }

    if (data.stbStartDate && data.stbEndDate) {
      html += `<div class="extracted-item">
        <span class="extracted-label">Tempoh STB:</span>
        <span class="extracted-value">${data.stbStartDate} - ${data.stbEndDate}</span>
      </div>`;
    }

    if (data.phoneNumbers && data.phoneNumbers.length > 0) {
      html += `<div class="extracted-item">
        <span class="extracted-label">Nombor Telefon (${data.phoneNumbers.length}):</span>
        <span class="extracted-value">${data.phoneNumbers.join(', ')}</span>
      </div>`;
    } else {
      html += `<div class="extracted-item">
        <span class="extracted-label" style="color: #dc2626;">Nombor Telefon:</span>
        <span class="extracted-value" style="color: #dc2626;">Tiada nombor telefon dapat diekstrak</span>
      </div>`;
    }

    if (data.alamatPerniagaan) {
      html += `<div class="extracted-item">
        <span class="extracted-label">Alamat Perniagaan:</span>
        <span class="extracted-value">${data.alamatPerniagaan}</span>
      </div>`;
    }

    if (data.directors.length > 0) {
      html += `<div class="extracted-item">
        <span class="extracted-label">Pengarah (${data.directors.length}):</span>
        <span class="extracted-value">${data.directors.join(', ')}</span>
      </div>`;
    } else {
      html += `<div class="extracted-item">
        <span class="extracted-label" style="color: #dc2626;">Pengarah:</span>
        <span class="extracted-value" style="color: #dc2626;">Tiada nama dapat diekstrak</span>
      </div>`;
    }

    if (data.shareholders.length > 0) {
      html += `<div class="extracted-item">
        <span class="extracted-label">Pemegang Saham (${data.shareholders.length}):</span>
        <span class="extracted-value">${data.shareholders.join(', ')}</span>
      </div>`;
    }

    if (data.spkkPersons.length > 0) {
      html += `<div class="extracted-item">
        <span class="extracted-label">Penama SPKK (${data.spkkPersons.length}):</span>
        <span class="extracted-value">${data.spkkPersons.join(', ')}</span>
      </div>`;
    }

    if (data.chequeSignatories.length > 0) {
      html += `<div class="extracted-item">
        <span class="extracted-label">Penandatangan Cek (${data.chequeSignatories.length}):</span>
        <span class="extracted-value">${data.chequeSignatories.join(', ')}</span>
      </div>`;
    }

    pdfExtractedData.innerHTML = html;
  }

  function applyPdfDataToForm() {
    if (!extractedPdfData) {
      alert("Tiada data PDF untuk digunakan.");
      return;
    }

    const setValueAndTrigger = (elementId, value) => {
      const el = document.getElementById(elementId);
      if (el) {
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        console.log(`V6.5.1 Set value for ${elementId}:`, value);
      }
    };

    const setSelectValue = (elementId, valueToFind) => {
      const el = document.getElementById(elementId);
      if (el) {
        for (let i = 0; i < el.options.length; i++) {
          if (el.options[i].value.toUpperCase() === valueToFind.toUpperCase()) {
            el.selectedIndex = i;
            el.dispatchEvent(new Event('change', { bubbles: true }));
            console.log(`V6.5.1 Set select for ${elementId}:`, valueToFind);
            break;
          }
        }
      }
    };

    if (extractedPdfData.companyName) {
      setValueAndTrigger('borang_syarikat', extractedPdfData.companyName);
      setValueAndTrigger('db_syarikat', extractedPdfData.companyName);
    }
    if (extractedPdfData.cidbNumber) {
      setValueAndTrigger('borang_cidb', extractedPdfData.cidbNumber);
      setValueAndTrigger('db_cidb', extractedPdfData.cidbNumber);
    }
    
    if (extractedPdfData.grade) {
      setSelectValue('borang_gred', extractedPdfData.grade);
      setSelectValue('db_gred', extractedPdfData.grade);
    }
    
    if (extractedPdfData.spkkStartDate) {
      setValueAndTrigger('spkkDuration', `${extractedPdfData.spkkStartDate} - ${extractedPdfData.spkkEndDate}`);
    }
    if (extractedPdfData.stbStartDate) {
      setValueAndTrigger('stbDuration', `${extractedPdfData.stbStartDate} - ${extractedPdfData.stbEndDate}`);
    }
    
    if (extractedPdfData.phoneNumbers && extractedPdfData.phoneNumbers.length > 0) {
      setValueAndTrigger('borang_no_telefon', extractedPdfData.phoneNumbers.join(', '));
    }

    if (extractedPdfData.alamatPerniagaan) {
      setValueAndTrigger('db_alamat_perniagaan', extractedPdfData.alamatPerniagaan);
      
      const negeriSelect = document.getElementById('db_negeri');
      if (negeriSelect && extractedPdfData.alamatPerniagaan) {
        const alamatUpper = extractedPdfData.alamatPerniagaan.toUpperCase();
        const stateMap = {
          'JOHOR': 'JOHOR', 'KEDAH': 'KEDAH', 'KELANTAN': 'KELANTAN', 'MELAKA': 'MELAKA',
          'NEGERI SEMBILAN': 'NEGERI SEMBILAN', 'PAHANG': 'PAHANG', 'PERAK': 'PERAK',
          'PERLIS': 'PERLIS', 'PULAU PINANG': 'PULAU PINANG', 'PENANG': 'PULAU PINANG',
          'SABAH': 'SABAH', 'SARAWAK': 'SARAWAK', 'SELANGOR': 'SELANGOR', 'TERENGGANU': 'TERENGGANU',
          'KUALA LUMPUR': 'W.P. KUALA LUMPUR', 'LABUAN': 'W.P. LABUAN', 'PUTRAJAYA': 'W.P. PUTRAJAYA'
        };
        
        let foundState = '';
        for (const [key, value] of Object.entries(stateMap)) {
          if (alamatUpper.includes(key)) {
            foundState = value;
            break;
          }
        }
        
        if (foundState) {
          setSelectValue('db_negeri', foundState);
        }
      }
    }

    const personnelList = document.getElementById('personnelList');
    if (personnelList) personnelList.innerHTML = '';

    const allNames = new Set();
    [extractedPdfData.directors, extractedPdfData.shareholders, 
     extractedPdfData.spkkPersons, extractedPdfData.chequeSignatories]
     .forEach(list => { 
       if(Array.isArray(list)) list.forEach(n => allNames.add(n)); 
     });

    allNames.forEach(name => {
      if (name && name.length > 2) {
        const roles = [];
        if (extractedPdfData.directors.includes(name)) roles.push('PENGARAH');
        if (extractedPdfData.shareholders.includes(name)) roles.push('P.EKUITI');
        if (extractedPdfData.spkkPersons.includes(name)) roles.push('P.SPKK');
        if (extractedPdfData.chequeSignatories.includes(name)) roles.push('T.T CEK');

        addPerson({ 
          name: name, 
          isCompany: false, 
          roles: roles, 
          s_ic: '', 
          s_sb: '', 
          s_epf: '' 
        });
      }
    });

    if (allNames.size === 0) addPerson();

    saveFormData();
    saveDatabaseFormData(); 
    
    setTimeout(() => {
      const dbState = {};
      document.querySelectorAll('#tab-database input, #tab-database select, #tab-database textarea').forEach(el => {
        if (el.id) {
          dbState[el.id] = (el.type === 'checkbox' || el.type === 'radio') ? el.checked : el.value;
        }
      });
      
      formStates['db'] = dbState;
      storageWrapper.set({ 'stb_form_states': formStates });
      
      console.log("V6.5.1 PDF Data applied and force-saved to storage successfully.");
      alert("PDF Data berjaya diekstrak dan disimpan! Semua input termasuk Alamat Perniagaan & Negeri telah diisi.");
    }, 200);
  }

  function clearPdfData() {
    if (pdfFileInput && pdfFileInput.parentNode) {
      const newInput = document.createElement('input');
      newInput.type = 'file';
      newInput.id = pdfFileInput.id;
      newInput.className = pdfFileInput.className;
      newInput.accept = 'application/pdf';
      newInput.style.display = 'none';
      pdfFileInput.parentNode.replaceChild(newInput, pdfFileInput);
      
      pdfFileInput = newInput;
      
      pdfFileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
          updateFileName(e.target.files[0].name);
        } else {
          updateFileName('Tiada fail dipilih');
        }
      });
    }

    if (pdfFileName) {
      pdfFileName.textContent = 'Tiada fail dipilih';
      pdfFileName.style.fontWeight = 'normal';
      pdfFileName.style.color = '';
    }
    if (pdfResult) {
      pdfResult.style.display = 'none';
    }
    if (pdfExtractedData) {
      pdfExtractedData.innerHTML = '';
    }
    if (btnProcessManual) {
      btnProcessManual.disabled = true;
    }
    if (btnProcessAI) {
      btnProcessAI.disabled = true;
    }
    extractedPdfData = null;

    storageWrapper.remove(['stb_extracted_pdf_data']);
  }

  // =========================================================================
  // PROFILE PDF AI PROCESSING
  // =========================================================================

  if (profilePdfUploadArea) {
    profilePdfUploadArea.addEventListener('click', () => {
      profilePdfInput.click();
    });

    profilePdfUploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      profilePdfUploadArea.classList.add('dragover');
    });

    profilePdfUploadArea.addEventListener('dragleave', () => {
      profilePdfUploadArea.classList.remove('dragover');
    });

    profilePdfUploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      profilePdfUploadArea.classList.remove('dragover');
      
      if (e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type === 'application/pdf') {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          profilePdfInput.files = dataTransfer.files;
          
          profilePdfInput.dispatchEvent(new Event('change', { bubbles: true }));
          updateProfileFileName(file.name);
        } else {
          alert("Sila muat naik fail PDF sahaja.");
        }
      }
    });
  }

  if (profilePdfInput) {
    profilePdfInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        updateProfileFileName(e.target.files[0].name);
      } else {
        updateProfileFileName('Tiada fail dipilih');
      }
    });
  }

  function updateProfileFileName(fileName) {
    if (profilePdfFileName) {
      profilePdfFileName.textContent = fileName;
      profilePdfFileName.style.fontWeight = 'bold';
      profilePdfFileName.style.color = '#3b82f6';
    }
    if (btnProsesProfileAI) {
      btnProsesProfileAI.disabled = fileName === 'Tiada fail dipilih';
    }
  }

  if (btnProsesProfileAI) {
    btnProsesProfileAI.addEventListener('click', () => {
      processProfileWithAI();
    });
  }

  if (btnApplyProfileData) {
    btnApplyProfileData.addEventListener('click', applyProfileDataToForm);
  }

  if (btnClearProfileData) {
    btnClearProfileData.addEventListener('click', clearProfileData);
  }

  if (btnResetProfile) {
    btnResetProfile.addEventListener('click', () => {
      if (confirm("Adakah anda pasti mahu mereset semua maklumat dalam borang Profile Syarikat?")) {
        resetProfileForm();
      }
    });
  }

  function resetProfileForm() {
    if (profileSyarikat) profileSyarikat.value = '';
    if (profileCidb) profileCidb.value = '';
    if (profileGred) profileGred.value = '';
    if (profileNamaPemohon) profileNamaPemohon.value = '';
    if (profileJawatanPemohon) profileJawatanPemohon.value = '';
    if (profileIcPemohon) profileIcPemohon.value = '';
    if (profileTelefonPemohon) profileTelefonPemohon.value = '';
    if (profileEmailPemohon) profileEmailPemohon.value = '';
    if (profileJenisPendaftaran) profileJenisPendaftaran.value = '';
    if (profileTarikhDaftar) profileTarikhDaftar.value = '';
    if (profileAlamatBerdaftar) profileAlamatBerdaftar.value = '';
    if (profileAlamatSurat) profileAlamatSurat.value = '';
    if (profileNoTelefonSyarikat) profileNoTelefonSyarikat.value = '';
    if (profileNoFax) profileNoFax.value = '';
    if (profileEmailSyarikat) profileEmailSyarikat.value = '';
    if (profileWeb) profileWeb.value = '';
    if (profilePautanDrive) profilePautanDrive.value = '';
    if (profileJenisPerubahan) profileJenisPerubahan.value = '';
    
    if (cbSsmBerdaftar) cbSsmBerdaftar.checked = false;
    if (cbSsmSurat) cbSsmSurat.checked = false;
    
    if (labelAlamatBerdaftar) labelAlamatBerdaftar.textContent = 'Alamat Berdaftar';
    
    if (previewQrCode) {
      previewQrCode.style.display = 'none';
      previewQrCode.src = '';
    }
    
    if (profilePdfInput && profilePdfInput.parentNode) {
      const newInput = document.createElement('input');
      newInput.type = 'file';
      newInput.id = profilePdfInput.id;
      newInput.className = profilePdfInput.className;
      newInput.accept = 'application/pdf';
      newInput.style.display = 'none';
      profilePdfInput.parentNode.replaceChild(newInput, profilePdfInput);
      profilePdfInput = newInput;
      
      profilePdfInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
          updateProfileFileName(e.target.files[0].name);
        } else {
          updateProfileFileName('Tiada fail dipilih');
        }
      });
    }
    
    if (profilePdfFileName) {
      profilePdfFileName.textContent = 'Tiada fail dipilih';
      profilePdfFileName.style.fontWeight = 'normal';
      profilePdfFileName.style.color = '';
    }
    if (profilePdfResult) {
      profilePdfResult.style.display = 'none';
    }
    if (profilePdfExtractedData) {
      profilePdfExtractedData.innerHTML = '';
    }
    if (btnProsesProfileAI) {
      btnProsesProfileAI.disabled = true;
    }
    
    extractedProfileData = null;
    
    storageWrapper.remove(['stb_extracted_profile_data']);
    
    alert("Borang Profile Syarikat telah direset.");
    console.log("V6.5.1 Profile form reset completed");
  }

  if (btnPreviewQR) {
    btnPreviewQR.addEventListener('click', () => {
      const driveUrl = profilePautanDrive ? profilePautanDrive.value.trim() : '';
      
      if (!driveUrl) {
        alert("Sila masukkan Pautan Drive terlebih dahulu.");
        return;
      }
      
      const encodedUrl = encodeURIComponent(driveUrl);
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodedUrl}`;
      
      if (previewQrCode) {
        previewQrCode.src = qrApiUrl;
        previewQrCode.style.display = 'block';
        console.log("V6.5.1 QR Code generated for URL:", driveUrl);
      }
    });
  }

  async function processProfileWithAI() {
    if (!profilePdfInput.files.length) {
      alert("Sila pilih fail PDF terlebih dahulu.");
      return;
    }

    const file = profilePdfInput.files[0];
    if (file.size > 10 * 1024 * 1024) {
      alert("Fail terlalu besar (Maks 10MB).");
      return;
    }

    if (profilePdfProcessing) {
      profilePdfProcessing.style.display = 'block';
    }
    if (profilePdfResult) {
      profilePdfResult.style.display = 'none';
    }

    try {
      if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.js';
      } else {
        throw new Error("PDF.js library not loaded");
      }

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      let fullText = '';
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
      }

      console.log("V6.5.1 Profile PDF extracted. Length:", fullText.length);
      
      if (profilePdfProcessing) {
        profilePdfProcessing.innerHTML = `
          <div style="margin:10px 0;">
            <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-weight:bold; color:#1e40af;">
              <span>Menganalisis dengan backend AI...</span>
              <span>Memproses</span>
            </div>
            <div style="width:100%; background:#e2e8f0; height:10px; border-radius:5px; overflow:hidden;">
              <div style="width:70%; background:linear-gradient(90deg, #3b82f6, #60a5fa); height:100%;"></div>
            </div>
          </div>`;
      }

      extractedProfileData = await processProfileTextWithAI(fullText);
      
      if (profilePdfProcessing) {
        profilePdfProcessing.style.display = 'none';
      }
      
      await playSuccessSound();
      
      displayProfileExtractedData(extractedProfileData);
      
      if (profilePdfResult) {
        profilePdfResult.style.display = 'block';
      }
      
      storageWrapper.set({ 'stb_extracted_profile_data': extractedProfileData });
      
    } catch (error) {
      console.error("V6.5.1 Profile AI Error:", error);
      
      await playErrorSound();
      
      if (profilePdfProcessing) {
        profilePdfProcessing.innerHTML = `
          <div style="background:#fee2e2; padding:10px; border-radius:6px; border:1px solid #ef4444; color:#991b1b;">
            <strong>Ralat:</strong> ${error.message}
          </div>`;
        setTimeout(() => {
          if (profilePdfProcessing) profilePdfProcessing.style.display = 'none';
        }, 3000);
      }
      alert("Gagal memproses profile PDF: " + error.message);
    }
  }

  async function processProfileTextWithAI(pdfText) {
    const maxTextLength = 30000;
    const truncatedText = pdfText.length > maxTextLength
      ? pdfText.substring(0, maxTextLength) + "... [text truncated]"
      : pdfText;

    console.log("V6.5.1 (Web) Menghantar teks profil ke backend untuk AI processing...");
    
    const payload = {
      action: 'processAI',
      type: 'profile',
      text: truncatedText
    };

    const response = await fetchWithRetry(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    }, 3, 1000);

    const result = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.message || result.error || 'Gagal mengekstrak data dari pelayan AI.');
    }
    
    return result.data;
  }

  function displayProfileExtractedData(data) {
    if (!profilePdfExtractedData) return;

    let html = '';

    if (data.applicantName) {
      html += `<div class="extracted-item">
        <span class="extracted-label">Nama Pemohon:</span>
        <span class="extracted-value">${data.applicantName}</span>
      </div>`;
    }

    if (data.jawatan) {
      html += `<div class="extracted-item">
        <span class="extracted-label">Jawatan:</span>
        <span class="extracted-value">${data.jawatan}</span>
      </div>`;
    }

    if (data.icNumber) {
      html += `<div class="extracted-item">
        <span class="extracted-label">No. IC Pemohon:</span>
        <span class="extracted-value">${data.icNumber}</span>
      </div>`;
    }

    if (data.phoneNumber) {
      html += `<div class="extracted-item">
        <span class="extracted-label">No. Telefon Pemohon:</span>
        <span class="extracted-value">${data.phoneNumber}</span>
      </div>`;
    }

    if (data.email) {
      html += `<div class="extracted-item">
        <span class="extracted-label">Emel Pemohon:</span>
        <span class="extracted-value">${data.email}</span>
      </div>`;
    }

    if (data.companyName) {
      html += `<div class="extracted-item">
        <span class="extracted-label">Nama Syarikat:</span>
        <span class="extracted-value">${data.companyName}</span>
      </div>`;
    }

    if (data.registrationNumber) {
      html += `<div class="extracted-item">
        <span class="extracted-label">No. Pendaftaran/CIDB:</span>
        <span class="extracted-value">${data.registrationNumber}</span>
      </div>`;
    }

    if (data.grade) {
      html += `<div class="extracted-item">
        <span class="extracted-label">Gred:</span>
        <span class="extracted-value">${data.grade}</span>
      </div>`;
    }

    if (data.registrationDate) {
      html += `<div class="extracted-item">
        <span class="extracted-label">Tarikh Daftar:</span>
        <span class="extracted-value">${data.registrationDate}</span>
      </div>`;
    }

    if (data.jenisPendaftaran) {
      html += `<div class="extracted-item">
        <span class="extracted-label">Jenis Pendaftaran:</span>
        <span class="extracted-value">${data.jenisPendaftaran}</span>
      </div>`;
    }

    if (data.alamatUtama) {
      const labelText = data.labelAlamatUtama || 'Alamat';
      html += `<div class="extracted-item">
        <span class="extracted-label">${labelText}:</span>
        <span class="extracted-value">${data.alamatUtama}</span>
      </div>`;
    }

    if (data.alamatSuratMenyurat) {
      html += `<div class="extracted-item">
        <span class="extracted-label">Alamat Surat-menyurat:</span>
        <span class="extracted-value">${data.alamatSuratMenyurat}</span>
      </div>`;
    }

    if (data.noTelefonSyarikat) {
      html += `<div class="extracted-item">
        <span class="extracted-label">No. Telefon Syarikat:</span>
        <span class="extracted-value">${data.noTelefonSyarikat}</span>
      </div>`;
    }

    if (data.noFax) {
      html += `<div class="extracted-item">
        <span class="extracted-label">No. Fax:</span>
        <span class="extracted-value">${data.noFax}</span>
      </div>`;
    }

    if (data.emailSyarikat) {
      html += `<div class="extracted-item">
        <span class="extracted-label">Emel Syarikat:</span>
        <span class="extracted-value">${data.emailSyarikat}</span>
      </div>`;
    }

    if (data.webAddress) {
      html += `<div class="extracted-item">
        <span class="extracted-label">Web Address:</span>
        <span class="extracted-value">${data.webAddress}</span>
      </div>`;
    }

    if (html === '') {
      html = '<div class="extracted-item"><span class="extracted-label">Tiada data diekstrak</span></div>';
    }

    profilePdfExtractedData.innerHTML = html;
  }

  function applyProfileDataToForm() {
    if (!extractedProfileData) {
      alert("Tiada data profile untuk digunakan.");
      return;
    }

    if (extractedProfileData.applicantName && profileNamaPemohon) {
      profileNamaPemohon.value = extractedProfileData.applicantName;
    }

    if (extractedProfileData.jawatan && profileJawatanPemohon) {
      profileJawatanPemohon.value = extractedProfileData.jawatan;
    }

    if (extractedProfileData.icNumber && profileIcPemohon) {
      profileIcPemohon.value = extractedProfileData.icNumber;
    }

    if (extractedProfileData.phoneNumber && profileTelefonPemohon) {
      profileTelefonPemohon.value = extractedProfileData.phoneNumber;
    }

    if (extractedProfileData.email && profileEmailPemohon) {
      profileEmailPemohon.value = extractedProfileData.email;
    }

    if (extractedProfileData.companyName && profileSyarikat) {
      profileSyarikat.value = extractedProfileData.companyName;
    }

    if (extractedProfileData.registrationNumber && profileCidb) {
      profileCidb.value = extractedProfileData.registrationNumber;
    }

    if (extractedProfileData.grade && profileGred) {
      for (let i = 0; i < profileGred.options.length; i++) {
        if (profileGred.options[i].value.toUpperCase() === extractedProfileData.grade.toUpperCase()) {
          profileGred.selectedIndex = i;
          break;
        }
      }
    }

    if (extractedProfileData.registrationDate && profileTarikhDaftar) {
      let dateVal = extractedProfileData.registrationDate;
      if (dateVal.match(/\d{2}\/\d{2}\/\d{4}/)) {
        const parts = dateVal.split('/');
        dateVal = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      profileTarikhDaftar.value = dateVal;
    }

    if (extractedProfileData.jenisPendaftaran && profileJenisPendaftaran) {
      profileJenisPendaftaran.value = extractedProfileData.jenisPendaftaran;
    }

    if (extractedProfileData.labelAlamatUtama && labelAlamatBerdaftar) {
      const labelLower = extractedProfileData.labelAlamatUtama.toLowerCase();
      if (labelLower.includes('perniagaan') || labelLower.includes('business')) {
        labelAlamatBerdaftar.textContent = 'Alamat Perniagaan';
      } else if (labelLower.includes('surat-menyurat') || labelLower.includes('correspondence')) {
        labelAlamatBerdaftar.textContent = 'Alamat Surat-menyurat';
      } else {
        labelAlamatBerdaftar.textContent = 'Alamat Berdaftar';
      }
    }

    if (extractedProfileData.alamatUtama && profileAlamatBerdaftar) {
      profileAlamatBerdaftar.value = extractedProfileData.alamatUtama;
    }

    if (extractedProfileData.alamatSuratMenyurat && profileAlamatSurat) {
      profileAlamatSurat.value = extractedProfileData.alamatSuratMenyurat;
    }

    if (extractedProfileData.noTelefonSyarikat && profileNoTelefonSyarikat) {
      profileNoTelefonSyarikat.value = extractedProfileData.noTelefonSyarikat;
    }

    if (extractedProfileData.noFax && profileNoFax) {
      profileNoFax.value = extractedProfileData.noFax;
    }

    if (extractedProfileData.emailSyarikat && profileEmailSyarikat) {
      profileEmailSyarikat.value = extractedProfileData.emailSyarikat;
    }

    if (extractedProfileData.webAddress && profileWeb) {
      profileWeb.value = extractedProfileData.webAddress;
    }

    alert("Data profile berjaya diisi ke borang!");
  }

  function clearProfileData() {
    if (profilePdfInput && profilePdfInput.parentNode) {
      const newInput = document.createElement('input');
      newInput.type = 'file';
      newInput.id = profilePdfInput.id;
      newInput.className = profilePdfInput.className;
      newInput.accept = 'application/pdf';
      newInput.style.display = 'none';
      profilePdfInput.parentNode.replaceChild(newInput, profilePdfInput);
      
      profilePdfInput = newInput;
      
      profilePdfInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
          updateProfileFileName(e.target.files[0].name);
        } else {
          updateProfileFileName('Tiada fail dipilih');
        }
      });
    }

    if (profilePdfFileName) {
      profilePdfFileName.textContent = 'Tiada fail dipilih';
      profilePdfFileName.style.fontWeight = 'normal';
      profilePdfFileName.style.color = '';
    }
    if (profilePdfResult) {
      profilePdfResult.style.display = 'none';
    }
    if (profilePdfExtractedData) {
      profilePdfExtractedData.innerHTML = '';
    }
    if (btnProsesProfileAI) {
      btnProsesProfileAI.disabled = true;
    }
    extractedProfileData = null;

    storageWrapper.remove(['stb_extracted_profile_data']);
  }

  if (btnCetakProfile) {
    btnCetakProfile.addEventListener('click', async () => {
      if (!profileSyarikat.value.trim()) {
        alert("Sila isi Nama Syarikat terlebih dahulu sebelum mencetak.");
        return;
      }

      const printProfileSyarikat = document.getElementById('printProfile_syarikat_header');
      const printProfileCidb = document.getElementById('printProfile_cidb_header');
      const printProfileNamaPemohon = document.getElementById('printProfile_nama_pemohon');
      const printProfileJawatanPemohon = document.getElementById('printProfile_jawatan_pemohon');
      const printProfileIcPemohon = document.getElementById('printProfile_ic_pemohon');
      const printProfileTelefonPemohon = document.getElementById('printProfile_telefon_pemohon');
      const printProfileEmailPemohon = document.getElementById('printProfile_email_pemohon');
      const printProfileJenisPendaftaran = document.getElementById('printProfile_jenis_pendaftaran');
      const printProfileTarikhDaftar = document.getElementById('printProfile_tarikh_daftar');
      const printProfileAlamatBerdaftar = document.getElementById('printProfile_alamat_berdaftar');
      const printProfileAlamatSurat = document.getElementById('printProfile_alamat_surat');
      const printProfileNoTelefonSyarikat = document.getElementById('printProfile_no_telefon_syarikat');
      const printProfileNoFax = document.getElementById('printProfile_no_fax');
      const printProfileEmailSyarikat = document.getElementById('printProfile_email_syarikat');
      const printProfileWeb = document.getElementById('printProfile_web');
      const printProfileGred = document.getElementById('printProfile_gred');
      const printProfileJenisPerubahan = document.getElementById('printProfile_jenis_perubahan');
      
      if (printProfileSyarikat) printProfileSyarikat.innerText = profileSyarikat.value || '-';
      if (printProfileCidb) printProfileCidb.innerText = profileCidb.value || '-';
      if (printProfileNamaPemohon) printProfileNamaPemohon.innerText = profileNamaPemohon ? (profileNamaPemohon.value || '-') : '-';
      if (printProfileJawatanPemohon) printProfileJawatanPemohon.innerText = profileJawatanPemohon ? (profileJawatanPemohon.value || '-') : '-';
      if (printProfileIcPemohon) printProfileIcPemohon.innerText = profileIcPemohon ? (profileIcPemohon.value || '-') : '-';
      if (printProfileTelefonPemohon) printProfileTelefonPemohon.innerText = profileTelefonPemohon ? (profileTelefonPemohon.value || '-') : '-';
      if (printProfileEmailPemohon) printProfileEmailPemohon.innerText = profileEmailPemohon ? (profileEmailPemohon.value || '-') : '-';
      if (printProfileJenisPendaftaran) printProfileJenisPendaftaran.innerText = profileJenisPendaftaran ? (profileJenisPendaftaran.value || '-') : '-';
      if (printProfileTarikhDaftar) printProfileTarikhDaftar.innerText = profileTarikhDaftar.value ? formatDateDisplay(profileTarikhDaftar.value) : '-';
      
      const alamatBerdaftarText = (profileAlamatBerdaftar.value || '-') + (cbSsmBerdaftar && cbSsmBerdaftar.checked ? ' (Sepadan e-info SSM)' : '');
      if (printProfileAlamatBerdaftar) printProfileAlamatBerdaftar.innerText = alamatBerdaftarText;
      
      const alamatSuratText = (profileAlamatSurat.value || '-') + (cbSsmSurat && cbSsmSurat.checked ? ' (Sepadan e-info SSM)' : '');
      if (printProfileAlamatSurat) printProfileAlamatSurat.innerText = alamatSuratText;
      
      if (printProfileNoTelefonSyarikat) printProfileNoTelefonSyarikat.innerText = profileNoTelefonSyarikat ? (profileNoTelefonSyarikat.value || '-') : '-';
      if (printProfileNoFax) printProfileNoFax.innerText = profileNoFax ? (profileNoFax.value || '-') : '-';
      if (printProfileEmailSyarikat) printProfileEmailSyarikat.innerText = profileEmailSyarikat ? (profileEmailSyarikat.value || '-') : '-';
      if (printProfileWeb) printProfileWeb.innerText = profileWeb ? (profileWeb.value || '-') : '-';
      if (printProfileGred) printProfileGred.innerText = profileGred.options[profileGred.selectedIndex]?.text || '-';
      
      if (printProfileJenisPerubahan) printProfileJenisPerubahan.innerText = profileJenisPerubahan ? (profileJenisPerubahan.value || '-') : '-';
      
      const today = new Date();
      const dateStr = today.toLocaleDateString('ms-MY', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
      const printProfileDate = document.getElementById('printProfile_date');
      if (printProfileDate) printProfileDate.innerText = dateStr;
      
      const driveUrl = profilePautanDrive ? profilePautanDrive.value.trim() : '';
      const printProfileQrCodeImg = document.getElementById('printProfileQrCode');
      
      if (driveUrl && printProfileQrCodeImg) {
        const encodedUrl = encodeURIComponent(driveUrl);
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodedUrl}`;
        printProfileQrCodeImg.src = qrApiUrl;
        printProfileQrCodeImg.style.display = 'block';
      } else if (printProfileQrCodeImg) {
        printProfileQrCodeImg.style.display = 'none';
      }
      
      const userColor = getUserColorHex(currentUser.color);
      let themeColorHex = userColor;
      
      const profilePrintLayout = document.getElementById('printProfileLayout');
      if (profilePrintLayout) {
        const themeBgElements = profilePrintLayout.querySelectorAll('.profile-theme-bg');
        themeBgElements.forEach(el => {
          el.style.backgroundColor = themeColorHex;
          el.style.color = 'white';
        });
        
        const themeBorderElements = profilePrintLayout.querySelectorAll('.profile-theme-border');
        themeBorderElements.forEach(el => {
          el.style.borderLeftColor = themeColorHex;
        });
        
        const profileHeader = profilePrintLayout.querySelector('.profile-company-header');
        if (profileHeader) {
          profileHeader.style.backgroundColor = themeColorHex;
          profileHeader.style.color = 'white';
        }
      }
      
      const mainPrintLayout = document.getElementById('printLayout');
      
      if (mainPrintLayout) mainPrintLayout.style.display = 'none';
      if (profilePrintLayout) profilePrintLayout.style.display = 'block';
      
      window.print();
      
      setTimeout(() => {
        if (mainPrintLayout) mainPrintLayout.style.display = '';
        if (profilePrintLayout) profilePrintLayout.style.display = 'none';
      }, 500);
    });
  }

  // =========================================================================
  // CORE SYSTEM FUNCTIONS
  // =========================================================================

  async function initSystem() {
    simulateLoading('Menyediakan sistem...', 'Memuatkan tetapan...');

    fetchUsers();
    try {
      const storage = await storageWrapper.get([
        'stb_session', 
        'stb_last_active_tab',
        'stb_last_active_element',
        'stb_form_states',
        'stb_pelulus_state',
        'stb_search_state',
        'stb_search_history_state',
        'stb_has_printed',
        'stb_users_cache',
        'stb_data_cache',
        'stb_cache_timestamp',
        'stb_drive_folder_url',
        'stb_user_folder_url',
        'stb_filter_pengesyor',
        'stb_all_recommenders',
        'stb_all_approvers',
        'stb_form_data',
        'stb_extracted_pdf_data',
        'stb_extracted_profile_data',
        'stb_dashboard_data',
        'stb_form_persistence',
        'stb_database_persistence',
        'stb_current_draft_filter',
        'stb_current_submitted_status_filter',
        'stb_current_submitted_jenis_filter',
        'stb_current_history_status_filter',
        'stb_current_history_jenis_filter',
        'stb_music_playing',
        'stb_bgm_volume',
        'stb_sfx_volume'
      ]);
      
      if (storage.stb_session) {
        currentUser = storage.stb_session;
        setupUserUI(); 
      }
      
      if (storage.stb_last_active_tab) {
        lastActiveTab = storage.stb_last_active_tab;
      }
      
      if (storage.stb_last_active_element) {
        lastActiveElementId = storage.stb_last_active_element;
      }
      
      if (storage.stb_form_states) {
        formStates = storage.stb_form_states;
      }
      
      if (storage.stb_has_printed) {
        hasPrinted = storage.stb_has_printed;
        if (btnSyncToDb && hasPrinted) {
          btnSyncToDb.style.display = 'inline-block';
        }
      }
      
      if (storage.stb_drive_folder_url) {
        createdFolderUrl = storage.stb_drive_folder_url;
        driveFolderCreated = true;
      }
      
      if (storage.stb_user_folder_url) {
        userFolderUrl = storage.stb_user_folder_url;
      }
      
      if (storage.stb_all_recommenders) {
        allRecommenders = storage.stb_all_recommenders;
      }
      
      if (storage.stb_all_approvers) {
        allApprovers = storage.stb_all_approvers;
      }
      
      if (storage.stb_users_cache) {
        usersList = storage.stb_users_cache;
        console.log("V6.5.1 Loaded users from cache:", usersList.length);
        populateWhatsAppDropdown();
      }
      
      if (storage.stb_data_cache) {
        cachedData = storage.stb_data_cache;
        console.log("V6.5.1 Loaded data from cache:", cachedData.length);
        updateDynamicYears(cachedData);
      }
      
      if (storage.stb_extracted_pdf_data) {
        extractedPdfData = storage.stb_extracted_pdf_data;
        displayExtractedData(extractedPdfData);
        if (pdfResult) {
          pdfResult.style.display = 'block';
        }
      }
      
      if (storage.stb_extracted_profile_data) {
        extractedProfileData = storage.stb_extracted_profile_data;
        displayProfileExtractedData(extractedProfileData);
        if (profilePdfResult) {
          profilePdfResult.style.display = 'block';
        }
      }
      
      if (storage.stb_dashboard_data) {
        dashboardData = storage.stb_dashboard_data;
      }
      
      if (storage.stb_form_persistence) {
        console.log('V6.5.1 Found persisted form data');
      }
      
      if (storage.stb_database_persistence) {
        console.log('V6.5.1 Found persisted database form data');
      }
      
      if (storage.stb_current_draft_filter) {
        currentDraftFilter = storage.stb_current_draft_filter;
      }
      
      if (storage.stb_current_submitted_status_filter) {
        currentSubmittedStatusFilter = storage.stb_current_submitted_status_filter;
      }
      if (storage.stb_current_submitted_jenis_filter) {
        currentSubmittedJenisFilter = storage.stb_current_submitted_jenis_filter;
      }
      if (storage.stb_current_history_status_filter) {
        currentHistoryStatusFilter = storage.stb_current_history_status_filter;
      }
      if (storage.stb_current_history_jenis_filter) {
        currentHistoryJenisFilter = storage.stb_current_history_jenis_filter;
      }
      
      if (storage.stb_music_playing) {
        isMusicPlaying = storage.stb_music_playing;
        updateMusicButtonState(isMusicPlaying);
      }
      
      if (storage.stb_bgm_volume !== undefined) {
        bgmVolume = storage.stb_bgm_volume;
      }
      
      if (storage.stb_sfx_volume !== undefined) {
        sfxVolume = storage.stb_sfx_volume;
      }
      
      // Restore search inputs
      const searchListInput = document.getElementById('searchListInput');
      const searchHistoryInput = document.getElementById('searchHistoryInput');
      if (storage.stb_search_state && searchListInput) {
        searchListInput.value = storage.stb_search_state;
      }
      if (storage.stb_search_history_state && searchHistoryInput) {
        searchHistoryInput.value = storage.stb_search_history_state;
      }
      
    } catch (e) { 
      console.error("V6.5.1 Storage Error:", e); 
    }

    setupAudioControls();
    setupGlobalButtonClickSound();
    
    // Setup Mobile Menu Listeners
    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }
    
    if (menuOverlay) {
      menuOverlay.addEventListener('click', closeMobileMenu);
    }
    
    // Tutup menu pada saiz desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        closeMobileMenu();
      }
    });
    
    hideLoading();
  }

  function populateWhatsAppDropdown() {
    if (!dbPelulusWhatsapp) return;
    
    const pelulusList = usersList.filter(user => user.role === 'PELULUS');
    
    dbPelulusWhatsapp.innerHTML = '<option value="">- Tiada Notifikasi / Pilih Pelulus -</option>';
    
    pelulusList.forEach(pelulus => {
      const phone = pelulus.phone || '';
      const name = pelulus.name || '';
      const option = document.createElement('option');
      option.value = phone;
      option.textContent = `${name} ${phone ? '(' + phone + ')' : ''}`;
      dbPelulusWhatsapp.appendChild(option);
    });
    
    console.log(`V6.5.1 WhatsApp dropdown populated with ${pelulusList.length} pelulus`);
  }

  function sendWhatsAppNotification(companyName, cidb, jenisPermohonan, syorStatus, tarikhSyor, pelulusPhone) {
    if (!pelulusPhone || pelulusPhone.trim() === '') {
      console.log("V6.5.1 No phone number provided for WhatsApp notification");
      return null;
    }
    
    let cleanPhone = pelulusPhone.replace(/[\s\-\(\)]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '60' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('60')) {
      cleanPhone = '60' + cleanPhone;
    }
    
    if (!/^\d{9,15}$/.test(cleanPhone)) {
      console.log("V6.5.1 Invalid phone number format:", cleanPhone);
      return null;
    }
    
    const message = `*NOTIFIKASI PERMOHONAN STB*
    
Syarikat: ${companyName}
No. CIDB: ${cidb || 'Tiada'}
Jenis Permohonan: ${jenisPermohonan || 'Tiada'}
Status Syor: ${syorStatus || 'Tiada'}
Tarikh Syor: ${tarikhSyor || 'Tiada'}

Sila semak sistem STB untuk tindakan selanjutnya.`;

    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    
    console.log("V6.5.1 WhatsApp notification URL prepared:", whatsappUrl);
    
    return whatsappUrl;
  }

  function generatePdfCssString(userColor) {
    const themeColor = userColor || '#2563eb';
    
    return `
      body {
        font-family: 'Arial', 'Segoe UI', sans-serif;
        margin: 0;
        padding: 10px;
        color: #000000;
        background: white;
      }
      
      .print-header-strip {
        height: 6px;
        background-color: ${themeColor};
        margin-bottom: 10px;
      }
      
      .jenis-permohonan-bar {
        border: 1px solid #000;
        padding: 8px 10px;
        margin-bottom: 10px;
        background-color: #f0f9ff;
      }
      
      .jenis-permohonan-row-1 {
        border-bottom: 1px dotted #ccc;
        padding-bottom: 5px;
        margin-bottom: 5px;
      }
      
      .jenis-permohonan-row-2 {
        border-bottom: 1px dotted #ccc;
        padding-bottom: 5px;
        margin-bottom: 5px;
      }
      
      .jenis-permohonan-row-3 {
        display: block;
      }
      
      .checkbox-large {
        transform: scale(1.2);
        margin: 0 5px;
      }
      
      .print-fill-text {
        font-weight: bold;
        text-decoration: underline;
        padding: 0 10px;
      }
      
      .border-box {
        border: 1px solid #000;
        padding: 8px;
        margin: 2px 0;
        background-color: #f8fafc;
      }
      
      .themed-box {
        background-color: ${themeColor};
        color: white;
        padding: 8px;
      }
      
      .grade-bar {
        border: 1px solid #000;
        padding: 8px;
        margin: 5px 0;
        background-color: #fef3c7;
        display: block;
      }
      
      .print-table {
        width: 100%;
        border-collapse: collapse;
        margin: 5px 0;
      }
      
      .print-table th, .print-table td {
        border: 1px solid #000;
        padding: 4px 6px;
        vertical-align: top;
      }
      
      .col-tick {
        text-align: center;
        width: 40px;
      }
      
      .layout-table td {
        border: none;
        padding: 2px;
      }
      
      .info-field {
        display: inline-block;
        margin-right: 15px;
      }
      
      .info-label {
        font-weight: bold;
      }
      
      .print-result {
        font-weight: bold;
        text-align: center;
      }
      
      .verification-box {
        border: none;
        padding: 10px;
        margin-top: 10px;
      }
      
      .ver-title {
        font-weight: bold;
        text-decoration: underline;
        margin-bottom: 5px;
      }
      
      .options-text-center {
        text-align: center;
        font-style: italic;
        border-bottom: 1px dotted #ccc;
        padding-bottom: 5px;
        margin-bottom: 5px;
      }
      
      .pengesyor-grid-new {
        display: block;
        margin-top: 10px;
      }
      
      .pengesyor-dates {
        margin-bottom: 10px;
      }
      
      .pengesyor-sign-box {
        text-align: center;
        margin-top: 15px;
      }
      
      .verification-separator {
        border-bottom: 2px solid #000;
        margin: 10px 0;
      }
      
      .font-large-nobold {
        font-size: 16pt;
        font-weight: normal;
      }
      
      h2 {
        font-size: 14pt;
        margin: 10px 0 5px 0;
        border-bottom: 1px solid #000;
      }
    `;
  }

  function getCompanyFolderName() {
    const companyName = document.getElementById('borang_syarikat')?.value.trim() || '';
    const tarikhMohon = document.getElementById('borang_tarikh_mohon')?.value || '';
    const dbJenis = document.getElementById('db_jenis')?.value || '';
    const ubahMaklumat = document.getElementById('input_ubah_maklumat')?.value.trim() || '';
    const ubahGred = document.getElementById('input_ubah_gred')?.value.trim() || '';
    
    let formattedDate = '';
    try {
      const tarikhDate = new Date(tarikhMohon);
      formattedDate = tarikhDate.toLocaleDateString('ms-MY', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).replace(/\//g, '-');
    } catch (e) {
      formattedDate = tarikhMohon;
    }
    
    let folderName = `${companyName.toUpperCase()} - ${formattedDate}`;
    
    if (dbJenis === 'UBAH MAKLUMAT' && ubahMaklumat) {
      folderName = `${companyName.toUpperCase()} - ${formattedDate} - ${ubahMaklumat.toUpperCase()}`;
    } else if (dbJenis === 'UBAH GRED' && ubahGred) {
      folderName = `${companyName.toUpperCase()} - ${formattedDate} - ${ubahGred.toUpperCase()}`;
    }
    
    return folderName;
  }

  if(triggerPrintBtn) {
    triggerPrintBtn.addEventListener('click', async () => {
      preparePrintView();
      
      const dbPautanValue = document.getElementById('db_pautan')?.value || '';
      const isDriveAlreadyCreated = driveFolderCreated === true || (dbPautanValue && dbPautanValue.trim() !== '');
      
      if (isDriveAlreadyCreated) {
        window.print();
        hasPrinted = true;
        storageWrapper.set({ 'stb_has_printed': true });
        if (btnSyncToDb) {
          btnSyncToDb.style.display = 'inline-block';
        }
        alert("Cetakan biasa. Folder Drive telah pun dicipta sebelum ini.");
        return;
      }
      
      const userConfirmed = confirm("Adakah anda pasti ingin mencetak dan menyimpan borang ini ke Google Drive?");
      
      if (!userConfirmed) {
        window.print();
        hasPrinted = true;
        storageWrapper.set({ 'stb_has_printed': true });
        if (btnSyncToDb) {
          btnSyncToDb.style.display = 'inline-block';
        }
        alert("Borang telah dicetak. Butang 'Simpan & Ke Input Database' kini tersedia.");
        return;
      }
      
      const companyName = document.getElementById('borang_syarikat')?.value.trim();
      if (!companyName) {
        alert("Sila isi Nama Syarikat terlebih dahulu sebelum mencetak dan menyimpan ke Drive.");
        return;
      }
      
      const applicationTypeRadio = document.querySelector('input[name="jenisApp"]:checked');
      let applicationType = '';
      if (applicationTypeRadio) {
        if (applicationTypeRadio.value === 'baru') applicationType = 'BARU';
        else if (applicationTypeRadio.value === 'pembaharuan') applicationType = 'PEMBAHARUAN';
        else if (applicationTypeRadio.value === 'ubah_maklumat') applicationType = 'UBAH MAKLUMAT';
        else if (applicationTypeRadio.value === 'ubah_gred') applicationType = 'UBAH GRED';
      }
      
      if (!applicationType) {
        alert("Sila pilih Jenis Permohonan terlebih dahulu.");
        return;
      }
      
      const tarikhMohon = document.getElementById('borang_tarikh_mohon')?.value;
      if (!tarikhMohon) {
        alert("Sila isi Tarikh Mohon terlebih dahulu.");
        return;
      }
      
      const userName = currentUser.name;
      
      const now = new Date();
      const currentMonth = now.toLocaleString('ms-MY', { month: 'long' });
      const currentYear = now.getFullYear();
      const monthYearFolder = `${currentMonth.toUpperCase()} ${currentYear}`;
      
      let formattedDate = '';
      try {
        const tarikhDate = new Date(tarikhMohon);
        formattedDate = tarikhDate.toLocaleDateString('ms-MY', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }).replace(/\//g, '-');
      } catch (e) {
        formattedDate = tarikhMohon;
      }
      
      const subfolderName = `${applicationType} - ${formattedDate}`;
      
      const printLayoutElement = document.getElementById('printLayout');
      if (!printLayoutElement) {
        alert("Ralat: Elemen cetakan tidak ditemui.");
        return;
      }
      
      const userColorHex = getUserColorHex(currentUser.color);
      
      const pdfCss = generatePdfCssString(userColorHex);
      
      const printHTML = `<style>${pdfCss}</style>${printLayoutElement.outerHTML}`;
      
      if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
        loadingText.textContent = 'Menyimpan ke Drive';
        if (loadingSubtext) loadingSubtext.textContent = 'Sila tunggu sebentar';
        
        const progressBar = document.getElementById('loading-progress-bar');
        const progressPercent = document.getElementById('loading-progress-percent');
        const progressLabel = document.getElementById('loading-progress-label');
        
        if (progressBar) {
          progressBar.style.display = 'block';
          progressBar.style.width = '0%';
        }
        if (progressPercent) progressPercent.textContent = '0%';
        if (progressLabel) progressLabel.textContent = 'Menyediakan dokumen PDF...';
        
        const progressSteps = document.getElementById('loading-progress-steps');
        if (progressSteps) progressSteps.style.display = 'flex';
        
        let currentProgress = 0;
        if (loadingProgressInterval) clearInterval(loadingProgressInterval);
        
        loadingProgressInterval = setInterval(() => {
          if (currentProgress < 90) {
            currentProgress += Math.floor(Math.random() * 5) + 1;
            if (currentProgress > 90) currentProgress = 90;
            if (progressBar) progressBar.style.width = `${currentProgress}%`;
            if (progressPercent) progressPercent.textContent = `${currentProgress}%`;
            
            if (progressLabel) {
              if (currentProgress < 30) {
                progressLabel.textContent = 'Menyediakan dokumen PDF...';
              } else if (currentProgress < 60) {
                progressLabel.textContent = 'Mencipta folder di Google Drive...';
              } else {
                progressLabel.textContent = 'Menyimpan fail...';
              }
            }
          }
        }, 200);
      }
      
      if (printLayoutElement) {
        printLayoutElement.style.display = 'none';
      }
      
      const payload = {
        action: 'cetak_dan_simpan_pdf',
        company_name: companyName,
        application_type: subfolderName,
        month_year: monthYearFolder,
        user_name: userName,
        user_color: userColorHex,
        main_folder_id: mainFolderId,
        htmlContent: printHTML
      };
      
      try {
        const response = await fetchWithRetry(SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        }, 3, 1000);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (loadingProgressInterval) clearInterval(loadingProgressInterval);
        const progressBar = document.getElementById('loading-progress-bar');
        const progressPercent = document.getElementById('loading-progress-percent');
        const progressLabel = document.getElementById('loading-progress-label');
        
        if (progressBar) progressBar.style.width = '100%';
        if (progressPercent) progressPercent.textContent = '100%';
        if (progressLabel) progressLabel.textContent = 'Selesai!';
        
        if (result.success) {
          await playSuccessSound();
          
          const folderUrl = result.folder_url;
          
          const dbPautanField = document.getElementById('db_pautan');
          if (dbPautanField) {
            dbPautanField.value = folderUrl;
          }
          
          driveFolderCreated = true;
          createdFolderUrl = folderUrl;
          userFolderUrl = result.user_folder_url || '';
          
          if (cbCreateDriveFolder) {
            cbCreateDriveFolder.checked = false;
          }
          
          await storageWrapper.set({ 
            'stb_drive_folder_url': folderUrl,
            'stb_user_folder_url': userFolderUrl
          });
          
          updateOpenDriveButton();
          
          setTimeout(() => {
            if (loadingOverlay) {
              loadingOverlay.style.display = 'none';
            }
            if (printLayoutElement) {
              printLayoutElement.style.display = '';
            }
            
            window.print();
            
            hasPrinted = true;
            storageWrapper.set({ 'stb_has_printed': true });
            
            if (btnSyncToDb) {
              btnSyncToDb.style.display = 'inline-block';
            }
            
            alert("Borang telah dicetak dan fail PDF berjaya disimpan di Drive!\nPautan folder telah dimasukkan secara automatik ke Input Database.");
            
            if (driveResult && folderUrl) {
              showDriveFolderLink(folderUrl, userFolderUrl);
            }
          }, 500);
          
        } else {
          throw new Error(result.message || 'Gagal menyimpan ke Drive');
        }
        
      } catch (error) {
        console.error("V6.5.1 Print & Drive save error:", error);
        
        await playErrorSound();
        
        if (loadingProgressInterval) clearInterval(loadingProgressInterval);
        
        if (loadingOverlay) {
          loadingOverlay.style.display = 'none';
        }
        if (printLayoutElement) {
          printLayoutElement.style.display = '';
        }
        
        alert("Gagal menyimpan ke Drive: " + error.message + "\n\nCetakan akan diteruskan tanpa simpanan Drive.");
        
        window.print();
        hasPrinted = true;
        storageWrapper.set({ 'stb_has_printed': true });
        if (btnSyncToDb) {
          btnSyncToDb.style.display = 'inline-block';
        }
      }
    });
  }

  function preparePrintView() {
    const val = (id) => { 
      const el = document.getElementById(id); 
      return el ? el.value.toUpperCase() : ''; 
    };

    const selectedType = document.querySelector('input[name="jenisApp"]:checked')?.value;
    ['baru', 'pembaharuan', 'ubah_maklumat', 'ubah_gred'].forEach(type => {
      const cb = document.getElementById(`print_type_${type}`);
      if(cb) cb.checked = false;
    });
    if(selectedType) {
      const targetCb = document.getElementById(`print_type_${selectedType}`);
      if(targetCb) targetCb.checked = true;
    }

    const setTxt = (id, val) => { 
      const el = document.getElementById(id); 
      if(el) el.innerText = val; 
    };

    const combinedNameCidb = `${val('borang_syarikat')} (${val('borang_cidb')})`;
    setTxt('print_companyDetails', combinedNameCidb);

    setTxt('print_spkkDuration', val('spkkDuration'));
    setTxt('print_stbDuration', val('stbDuration'));
    setTxt('print_text_ubah_maklumat', val('input_ubah_maklumat'));
    setTxt('print_text_ubah_gred', val('input_ubah_gred'));
    setTxt('print_grade_display', val('borang_gred'));
    setTxt('print_tatatertib', val('borang_tatatertib'));
    setTxt('print_justifikasi', val('borang_justifikasi') || val('input_justifikasi') || val('db_justifikasi'));
    
    setTxt('print_no_telefon', val('borang_no_telefon'));
    
    setTxt('print_ssm_date', formatDateDisplay(val('ssm_date_input')));
    setTxt('print_bank_date', formatDateDisplay(val('bank_date_input')));
    setTxt('print_ssm_status_display', val('ssm_status'));

    const bankSign = val('bank_sign_input');
    const bankStatus = val('bank_status_input');
    const bankDisplay = bankStatus ? `${bankSign} (${bankStatus})` : bankSign;
    setTxt('print_bank_sign', bankDisplay);

    setTxt('print_doc_carta', val('doc_carta_status'));
    setTxt('print_doc_peta', val('doc_peta_status'));
    setTxt('print_doc_gambar', val('doc_gambar_status'));
    setTxt('print_doc_sewa', val('doc_sewa_status'));

    const kwsp1 = formatKWSP(val('kwsp_date_1'), val('kwsp_s1'));
    const kwsp2 = formatKWSP(val('kwsp_date_2'), val('kwsp_s2'));
    const kwsp3 = formatKWSP(val('kwsp_date_3'), val('kwsp_s3'));
    setTxt('print_kwsp_1', kwsp1);
    setTxt('print_kwsp_2', kwsp2);
    setTxt('print_kwsp_3', kwsp3);

    const tMohon = document.getElementById('borang_tarikh_mohon')?.value || '';
    setTxt('print_tarikh_mohon', tMohon ? formatDateDisplay(tMohon) : '_____________');

    const tbody = document.getElementById('print_personnel_page1');
    if (!tbody) return;

    tbody.innerHTML = '';

    const cards = document.querySelectorAll('.person-card');
    let rowsHtml = '';

    cards.forEach(card => {
      const name = card.querySelector('.p-name')?.value.toUpperCase() || '';
      const roles = [];
      card.querySelectorAll('.role-cb:checked').forEach(cb => roles.push(cb.value));
      const s_ic = card.querySelector('.status-ic')?.value.toUpperCase() || '';
      const s_sb = card.querySelector('.status-sb')?.value.toUpperCase() || '';
      const s_epf = card.querySelector('.status-epf')?.value.toUpperCase() || '';
      
      const tick = (role) => roles.includes(role) ? '✓' : '';
      
      rowsHtml += `<tr>
        <td style="padding:2px;"><div style="font-weight:bold; font-size:12pt; text-transform:uppercase;">${name}</div></td>
        <td class="col-tick">${tick('PENGARAH')}</td>
        <td class="col-tick">${tick('P.EKUITI')}</td>
        <td class="col-tick">${tick('T.T CEK')}</td>
        <td class="col-tick">${tick('P.SPKK')}</td>
        <td class="col-tick">${s_ic}</td>
        <td class="col-tick">${s_sb}</td>
        <td class="col-tick">${s_epf}</td>
      </tr>`;
    });

    for(let i = cards.length; i < 6; i++) {
      rowsHtml += `<tr><td style="height:35px;"></td><td class="col-tick"></td><td class="col-tick"></td><td class="col-tick"></td><td class="col-tick"></td><td class="col-tick"></td><td class="col-tick"></td><td class="col-tick"></td></tr>`;
    }

    tbody.innerHTML = rowsHtml;
  }

  function setupAutoSaveListeners() {
    const checkerTab = document.getElementById('tab-checker');
    if (checkerTab) {
      checkerTab.querySelectorAll('input, select, textarea').forEach(el => {
        if (el.id && !el.id.includes('print_') && !el.id.includes('pelulus_') && !el.id.includes('login')) {
          el.addEventListener('input', saveFormData);
          el.addEventListener('change', saveFormData);
        }
      });
    }

    document.querySelectorAll('input[name="jenisApp"]').forEach(radio => {
      radio.addEventListener('change', saveFormData);
    });

    document.querySelectorAll('.tick-btn').forEach(btn => {
      btn.addEventListener('click', saveFormData);
    });

    console.log('V6.5.1 Auto-save listeners initialized for checker tab');
  }

  function setupDatabaseAutoSaveListeners() {
    const databaseTab = document.getElementById('tab-database');
    if (databaseTab) {
      databaseTab.querySelectorAll('input, select, textarea').forEach(el => {
        if (el.id && !el.id.includes('print_') && !el.id.includes('pelulus_') && !el.id.includes('login')) {
          el.addEventListener('input', saveDatabaseFormData);
          el.addEventListener('change', saveDatabaseFormData);
        }
      });
    }

    const createDriveFolder = document.getElementById('cbCreateDriveFolder');
    if (createDriveFolder) {
      createDriveFolder.addEventListener('change', saveDatabaseFormData);
    }

    console.log('V6.5.1 Auto-save listeners initialized for database tab');
  }

  if(dbSyor) {
    dbSyor.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val === 'YA' && dbPautanInput) {
        dbPautanInput.style.backgroundColor = '#fffbeb';
        dbPautanInput.style.borderColor = '#f59e0b';
        dbPautanInput.style.borderWidth = '2px';
      } else if (dbPautanInput) {
        dbPautanInput.style.backgroundColor = '';
        dbPautanInput.style.borderColor = '';
        dbPautanInput.style.borderWidth = '';
      }
      
      if(currentUser && (currentUser.role === 'PENGESYOR' || currentUser.role === 'ADMIN') && !isRestoring) {
        saveDatabaseFormData();
      }
    });
  }

  if (cbCreateDriveFolder) {
    cbCreateDriveFolder.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      if (driveFolderInfo) {
        driveFolderInfo.style.display = isChecked ? 'block' : 'none';
      }
      if (btnCreateDriveFolder) {
        btnCreateDriveFolder.style.display = isChecked ? 'inline-block' : 'none';
      }
      
      if(currentUser && (currentUser.role === 'PENGESYOR' || currentUser.role === 'ADMIN') && !isRestoring) {
        saveDatabaseFormData();
      }
    });
  }

  if (btnCreateDriveFolder) {
    btnCreateDriveFolder.addEventListener('click', () => {
      createDriveFolder();
    });
  }

  function openDriveFolder() {
    const dbPautan = document.getElementById('db_pautan')?.value;
    
    if (!dbPautan || dbPautan.trim() === '') {
      alert("Tiada pautan folder Drive. Sila cipta folder terlebih dahulu.");
      return;
    }
    
    window.open(dbPautan, '_blank');
  }

  if (btnOpenDriveFolder) {
    btnOpenDriveFolder.addEventListener('click', openDriveFolder);
  }

  if (btnOpenMyDriveFolder) {
    btnOpenMyDriveFolder.addEventListener('click', () => {
      if (userFolderUrl) {
        window.open(userFolderUrl, '_blank');
      } else {
        alert("Folder user anda belum dicipta. Sila cipta folder untuk syarikat ini terlebih dahulu.");
      }
    });
  }

  if (btnClearFilter) {
    btnClearFilter.addEventListener('click', () => {
      document.querySelectorAll('#pengesyorFilterButtonsContainer button').forEach(btn => {
        btn.style.backgroundColor = '#f3f4f6';
        btn.style.color = '#374151';
        btn.style.fontWeight = 'normal';
      });
      storageWrapper.set({ 'stb_filter_pengesyor': '' });
      renderFilteredList(activeListType);
    });
  }

  function updatePengesyorFilter() {
    if (!pengesyorFilterButtonsContainer) return;
    
    const recommenders = new Set();
    if (cachedData && cachedData.length > 0) {
      cachedData.forEach(item => {
        if (item.pengesyor && item.pengesyor.trim() !== '') {
          recommenders.add(item.pengesyor.trim());
        }
      });
    }
    allRecommenders = Array.from(recommenders).sort();
    storageWrapper.set({ 'stb_all_recommenders': allRecommenders });
    
    let buttonsHtml = '';
    allRecommenders.forEach(name => {
      buttonsHtml += `<button class="filter-btn" data-name="${name}" style="padding:4px 12px; background:#f3f4f6; border:none; border-radius:16px; font-size:0.8rem; cursor:pointer; transition:all 0.2s;">${name}</button>`;
    });
    pengesyorFilterButtonsContainer.innerHTML = buttonsHtml;
    
    pengesyorFilterButtonsContainer.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const selectedName = btn.getAttribute('data-name');
        const isActive = btn.style.backgroundColor === 'rgb(37, 99, 235)' || btn.style.backgroundColor === '#2563eb';
        
        pengesyorFilterButtonsContainer.querySelectorAll('button').forEach(b => {
          b.style.backgroundColor = '#f3f4f6';
          b.style.color = '#374151';
          b.style.fontWeight = 'normal';
        });
        
        if (isActive) {
          storageWrapper.set({ 'stb_filter_pengesyor': '' });
        } else {
          btn.style.backgroundColor = '#2563eb';
          btn.style.color = 'white';
          btn.style.fontWeight = 'bold';
          storageWrapper.set({ 'stb_filter_pengesyor': selectedName });
        }
        
        renderFilteredList(activeListType);
      });
    });
    
    storageWrapper.get(['stb_filter_pengesyor']).then(storage => {
      if (storage.stb_filter_pengesyor) {
        const activeBtn = Array.from(pengesyorFilterButtonsContainer.querySelectorAll('button')).find(b => b.getAttribute('data-name') === storage.stb_filter_pengesyor);
        if (activeBtn) {
          activeBtn.style.backgroundColor = '#2563eb';
          activeBtn.style.color = 'white';
          activeBtn.style.fontWeight = 'bold';
        }
      }
    });
  }

  function updatePelulusFilter() {
    if (!pelulusFilterButtonsContainer) return;
    
    const approvers = new Set();
    if (cachedData && cachedData.length > 0) {
      cachedData.forEach(item => {
        if (item.pelulus && item.pelulus.trim() !== '') {
          approvers.add(item.pelulus.trim());
        }
      });
    }
    allApprovers = Array.from(approvers).sort();
    storageWrapper.set({ 'stb_all_approvers': allApprovers });
    
    let buttonsHtml = '';
    allApprovers.forEach(name => {
      buttonsHtml += `<button class="filter-btn" data-name="${name}" style="padding:4px 12px; background:#f3f4f6; border:none; border-radius:16px; font-size:0.8rem; cursor:pointer; transition:all 0.2s;">${name}</button>`;
    });
    pelulusFilterButtonsContainer.innerHTML = buttonsHtml;
    
    pelulusFilterButtonsContainer.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const selectedName = btn.getAttribute('data-name');
        const isActive = btn.style.backgroundColor === 'rgb(37, 99, 235)' || btn.style.backgroundColor === '#2563eb';
        
        pelulusFilterButtonsContainer.querySelectorAll('button').forEach(b => {
          b.style.backgroundColor = '#f3f4f6';
          b.style.color = '#374151';
          b.style.fontWeight = 'normal';
        });
        
        if (isActive) {
          storageWrapper.set({ 'stb_filter_pelulus': '' });
        } else {
          btn.style.backgroundColor = '#2563eb';
          btn.style.color = 'white';
          btn.style.fontWeight = 'bold';
          storageWrapper.set({ 'stb_filter_pelulus': selectedName });
        }
        
        renderFilteredList(activeListType);
      });
    });
    
    storageWrapper.get(['stb_filter_pelulus']).then(storage => {
      if (storage.stb_filter_pelulus) {
        const activeBtn = Array.from(pelulusFilterButtonsContainer.querySelectorAll('button')).find(b => b.getAttribute('data-name') === storage.stb_filter_pelulus);
        if (activeBtn) {
          activeBtn.style.backgroundColor = '#2563eb';
          activeBtn.style.color = 'white';
          activeBtn.style.fontWeight = 'bold';
        }
      }
    });
  }

  if (listFilterMonth) {
    listFilterMonth.addEventListener('change', () => {
      if (activeListType) {
        renderFilteredList(activeListType);
      }
    });
  }
  
  if (listFilterYear) {
    listFilterYear.addEventListener('change', () => {
      if (activeListType) {
        renderFilteredList(activeListType);
      }
    });
  }
  
  const historyMonthFilter = document.getElementById('historyMonthFilter');
  if (historyMonthFilter) {
    historyMonthFilter.addEventListener('change', () => {
      if (activeListType) renderFilteredList(activeListType);
    });
  }

  const historyYearFilter = document.getElementById('historyYearFilter');
  if (historyYearFilter) {
    historyYearFilter.addEventListener('change', () => {
      if (activeListType) renderFilteredList(activeListType);
    });
  }

  const btnRefreshHistory = document.getElementById('btnRefreshHistory');
  if (btnRefreshHistory) {
    btnRefreshHistory.addEventListener('click', () => {
      fetchAndRenderList('history');
    });
  }
  
  const draftContainer = document.getElementById('draftFiltersContainer');
  if (draftContainer && !draftContainer.hasAttribute('data-listener')) {
      draftContainer.setAttribute('data-listener', 'true');
      draftContainer.addEventListener('click', (e) => {
          const btn = e.target.closest('button');
          if (!btn || !btn.id.startsWith('filterBtn')) return;
          
          let filterVal = '';
          if (btn.id === 'filterBtnBaru') filterVal = 'BARU';
          else if (btn.id === 'filterBtnPembaharuan') filterVal = 'PEMBAHARUAN';
          else if (btn.id === 'filterBtnUbahMaklumat') filterVal = 'UBAH MAKLUMAT';
          else if (btn.id === 'filterBtnUbahGred') filterVal = 'UBAH GRED';
          else if (btn.id === 'filterBtnSpi') filterVal = 'SPI';
          else if (btn.id === 'filterBtnAll') filterVal = 'ALL';
          
          if (filterVal) {
              if (filterVal === 'ALL') {
                  currentDraftFilter = 'ALL';
              } else {
                  currentDraftFilter = (currentDraftFilter === filterVal) ? 'ALL' : filterVal;
              }
              
              updateDraftFilterButtons();
              
              if (activeListType) {
                  renderFilteredList(activeListType);
              }
              
              storageWrapper.set({ 'stb_current_draft_filter': currentDraftFilter });
          }
      });
  }
  
  if (submittedFiltersContainer && !submittedFiltersContainer.hasAttribute('data-listener')) {
    submittedFiltersContainer.setAttribute('data-listener', 'true');
    submittedFiltersContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn || !btn.id.startsWith('filterSubmitted')) return;
      
      const isStatusBtn = ['filterSubmittedAll', 'filterSubmittedLulus', 'filterSubmittedTolak', 'filterSubmittedPending'].includes(btn.id);
      const isJenisBtn = ['filterSubmittedJenisBaru', 'filterSubmittedJenisPembaharuan', 'filterSubmittedJenisUbahMaklumat', 'filterSubmittedJenisUbahGred'].includes(btn.id);
      
      if (isStatusBtn) {
        if (btn.id === 'filterSubmittedAll') {
          currentSubmittedStatusFilter = 'ALL';
        } else if (btn.id === 'filterSubmittedLulus') {
          currentSubmittedStatusFilter = (currentSubmittedStatusFilter === 'LULUS') ? 'ALL' : 'LULUS';
        } else if (btn.id === 'filterSubmittedTolak') {
          currentSubmittedStatusFilter = (currentSubmittedStatusFilter === 'TOLAK') ? 'ALL' : 'TOLAK';
        } else if (btn.id === 'filterSubmittedPending') {
          currentSubmittedStatusFilter = (currentSubmittedStatusFilter === 'PENDING') ? 'ALL' : 'PENDING';
        }
      } else if (isJenisBtn) {
        if (btn.id === 'filterSubmittedJenisBaru') {
          currentSubmittedJenisFilter = (currentSubmittedJenisFilter === 'BARU') ? 'ALL' : 'BARU';
        } else if (btn.id === 'filterSubmittedJenisPembaharuan') {
          currentSubmittedJenisFilter = (currentSubmittedJenisFilter === 'PEMBAHARUAN') ? 'ALL' : 'PEMBAHARUAN';
        } else if (btn.id === 'filterSubmittedJenisUbahMaklumat') {
          currentSubmittedJenisFilter = (currentSubmittedJenisFilter === 'UBAH MAKLUMAT') ? 'ALL' : 'UBAH MAKLUMAT';
        } else if (btn.id === 'filterSubmittedJenisUbahGred') {
          currentSubmittedJenisFilter = (currentSubmittedJenisFilter === 'UBAH GRED') ? 'ALL' : 'UBAH GRED';
        }
      }
      
      updateSubmittedFilterButtons();
      
      if (activeListType === 'submitted') {
        renderFilteredList('submitted');
      }
      
      storageWrapper.set({ 
        'stb_current_submitted_status_filter': currentSubmittedStatusFilter,
        'stb_current_submitted_jenis_filter': currentSubmittedJenisFilter
      });
    });
  }
  
  if (historyFiltersContainer && !historyFiltersContainer.hasAttribute('data-listener')) {
    historyFiltersContainer.setAttribute('data-listener', 'true');
    historyFiltersContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn || !btn.id.startsWith('filterHistory')) return;
      
      const isStatusBtn = ['filterHistoryAll', 'filterHistoryStatusAll', 'filterHistoryStatusLulus', 'filterHistoryStatusTolak', 'filterHistoryStatusPending'].includes(btn.id);
      const isJenisBtn = ['filterHistoryJenisBaru', 'filterHistoryJenisPembaharuan', 'filterHistoryJenisUbahMaklumat', 'filterHistoryJenisUbahGred'].includes(btn.id);
      
      if (isStatusBtn) {
        if (btn.id === 'filterHistoryStatusAll' || btn.id === 'filterHistoryAll') {
          currentHistoryStatusFilter = 'ALL';
        } else if (btn.id === 'filterHistoryStatusLulus') {
          currentHistoryStatusFilter = (currentHistoryStatusFilter === 'LULUS') ? 'ALL' : 'LULUS';
        } else if (btn.id === 'filterHistoryStatusTolak') {
          currentHistoryStatusFilter = (currentHistoryStatusFilter === 'TOLAK') ? 'ALL' : 'TOLAK';
        } else if (btn.id === 'filterHistoryStatusPending') {
          currentHistoryStatusFilter = (currentHistoryStatusFilter === 'PENDING') ? 'ALL' : 'PENDING';
        }
      } else if (isJenisBtn) {
        if (btn.id === 'filterHistoryJenisBaru') {
          currentHistoryJenisFilter = (currentHistoryJenisFilter === 'BARU') ? 'ALL' : 'BARU';
        } else if (btn.id === 'filterHistoryJenisPembaharuan') {
          currentHistoryJenisFilter = (currentHistoryJenisFilter === 'PEMBAHARUAN') ? 'ALL' : 'PEMBAHARUAN';
        } else if (btn.id === 'filterHistoryJenisUbahMaklumat') {
          currentHistoryJenisFilter = (currentHistoryJenisFilter === 'UBAH MAKLUMAT') ? 'ALL' : 'UBAH MAKLUMAT';
        } else if (btn.id === 'filterHistoryJenisUbahGred') {
          currentHistoryJenisFilter = (currentHistoryJenisFilter === 'UBAH GRED') ? 'ALL' : 'UBAH GRED';
        }
      }
      
      updateHistoryFilterButtons();
      
      if (activeListType === 'history') {
        renderFilteredList('history');
      }
      
      storageWrapper.set({ 
        'stb_current_history_status_filter': currentHistoryStatusFilter,
        'stb_current_history_jenis_filter': currentHistoryJenisFilter
      });
    });
  }
  
  function updateSubmittedFilterButtons() {
    if (!submittedFiltersContainer) return;
    
    submittedFiltersContainer.querySelectorAll('button').forEach(b => {
      b.style.opacity = '0.4';
      b.style.border = '2px solid transparent';
    });
    
    if (currentSubmittedStatusFilter !== 'ALL') {
      let activeId = 'filterSubmittedAll';
      if (currentSubmittedStatusFilter === 'LULUS') activeId = 'filterSubmittedLulus';
      else if (currentSubmittedStatusFilter === 'TOLAK') activeId = 'filterSubmittedTolak';
      else if (currentSubmittedStatusFilter === 'PENDING') activeId = 'filterSubmittedPending';
      
      const activeBtn = document.getElementById(activeId);
      if (activeBtn) {
        activeBtn.style.opacity = '1';
        activeBtn.style.border = '2px solid #000000';
      }
    } else {
      const allBtn = document.getElementById('filterSubmittedAll');
      if (allBtn) {
        allBtn.style.opacity = '1';
        allBtn.style.border = '2px solid #000000';
      }
    }
    
    if (currentSubmittedJenisFilter !== 'ALL') {
      let activeId = 'filterSubmittedAll';
      if (currentSubmittedJenisFilter === 'BARU') activeId = 'filterSubmittedJenisBaru';
      else if (currentSubmittedJenisFilter === 'PEMBAHARUAN') activeId = 'filterSubmittedJenisPembaharuan';
      else if (currentSubmittedJenisFilter === 'UBAH MAKLUMAT') activeId = 'filterSubmittedJenisUbahMaklumat';
      else if (currentSubmittedJenisFilter === 'UBAH GRED') activeId = 'filterSubmittedJenisUbahGred';
      
      const activeBtn = document.getElementById(activeId);
      if (activeBtn) {
        activeBtn.style.opacity = '1';
        activeBtn.style.border = '2px solid #000000';
      }
    }
  }
  
  function updateHistoryFilterButtons() {
    if (!historyFiltersContainer) return;
    
    historyFiltersContainer.querySelectorAll('button').forEach(b => {
      b.style.opacity = '0.4';
      b.style.border = '2px solid transparent';
    });
    
    if (currentHistoryStatusFilter !== 'ALL') {
      let activeId = 'filterHistoryStatusAll';
      if (currentHistoryStatusFilter === 'LULUS') activeId = 'filterHistoryStatusLulus';
      else if (currentHistoryStatusFilter === 'TOLAK') activeId = 'filterHistoryStatusTolak';
      else if (currentHistoryStatusFilter === 'PENDING') activeId = 'filterHistoryStatusPending';
      
      const activeBtn = document.getElementById(activeId);
      if (activeBtn) {
        activeBtn.style.opacity = '1';
        activeBtn.style.border = '2px solid #000000';
      }
    } else {
      const allBtn = document.getElementById('filterHistoryStatusAll');
      if (allBtn) {
        allBtn.style.opacity = '1';
        allBtn.style.border = '2px solid #000000';
      }
    }
    
    if (currentHistoryJenisFilter !== 'ALL') {
      let activeId = 'filterHistoryJenisBaru';
      if (currentHistoryJenisFilter === 'PEMBAHARUAN') activeId = 'filterHistoryJenisPembaharuan';
      else if (currentHistoryJenisFilter === 'UBAH MAKLUMAT') activeId = 'filterHistoryJenisUbahMaklumat';
      else if (currentHistoryJenisFilter === 'UBAH GRED') activeId = 'filterHistoryJenisUbahGred';
      
      const activeBtn = document.getElementById(activeId);
      if (activeBtn) {
        activeBtn.style.opacity = '1';
        activeBtn.style.border = '2px solid #000000';
      }
    }
  }
  
  function updateDraftFilterButtons() {
    if (!draftFiltersContainer) return;
    
    draftFiltersContainer.querySelectorAll('button').forEach(b => {
        b.style.opacity = '0.4';
        b.style.border = '2px solid transparent';
    });
    
    let activeBtnId = 'filterBtnAll';
    if (currentDraftFilter !== 'ALL') {
        if (currentDraftFilter === 'BARU') activeBtnId = 'filterBtnBaru';
        else if (currentDraftFilter === 'PEMBAHARUAN') activeBtnId = 'filterBtnPembaharuan';
        else if (currentDraftFilter === 'UBAH MAKLUMAT') activeBtnId = 'filterBtnUbahMaklumat';
        else if (currentDraftFilter === 'UBAH GRED') activeBtnId = 'filterBtnUbahGred';
        else if (currentDraftFilter === 'SPI') activeBtnId = 'filterBtnSpi';
    }
    
    const activeBtn = document.getElementById(activeBtnId);
    if (activeBtn) {
        activeBtn.style.opacity = '1';
        activeBtn.style.border = '2px solid #000000';
    }
  }

  function updateSubmittedBadges(baseSubmittedData) {
    if (!badgeSubmittedAll) return;
    
    const total = baseSubmittedData.length;
    const lulus = baseSubmittedData.filter(item => item.kelulusan && item.kelulusan.includes('LULUS')).length;
    const tolak = baseSubmittedData.filter(item => item.kelulusan && (item.kelulusan.includes('TOLAK') || item.kelulusan.includes('SIASAT'))).length;
    const pending = total - (lulus + tolak);
    
    const jenisBaru = baseSubmittedData.filter(item => item.jenis === 'BARU').length;
    const jenisPembaharuan = baseSubmittedData.filter(item => item.jenis === 'PEMBAHARUAN').length;
    const jenisUbahMaklumat = baseSubmittedData.filter(item => item.jenis === 'UBAH MAKLUMAT').length;
    const jenisUbahGred = baseSubmittedData.filter(item => item.jenis === 'UBAH GRED').length;
    
    if (badgeSubmittedAll) badgeSubmittedAll.textContent = total;
    if (badgeSubmittedLulus) badgeSubmittedLulus.textContent = lulus;
    if (badgeSubmittedTolak) badgeSubmittedTolak.textContent = tolak;
    if (badgeSubmittedPending) badgeSubmittedPending.textContent = pending;
    if (badgeSubmittedJenisBaru) badgeSubmittedJenisBaru.textContent = jenisBaru;
    if (badgeSubmittedJenisPembaharuan) badgeSubmittedJenisPembaharuan.textContent = jenisPembaharuan;
    if (badgeSubmittedJenisUbahMaklumat) badgeSubmittedJenisUbahMaklumat.textContent = jenisUbahMaklumat;
    if (badgeSubmittedJenisUbahGred) badgeSubmittedJenisUbahGred.textContent = jenisUbahGred;
  }
  
  function updateHistoryBadges(data) {
    if (!badgeHistoryAll) return;
    
    const total = data.length;
    const lulus = data.filter(item => item.kelulusan && item.kelulusan.includes('LULUS')).length;
    const tolak = data.filter(item => item.kelulusan && (item.kelulusan.includes('TOLAK') || item.kelulusan.includes('SIASAT'))).length;
    const pending = total - (lulus + tolak);
    
    const jenisBaru = data.filter(item => item.jenis === 'BARU').length;
    const jenisPembaharuan = data.filter(item => item.jenis === 'PEMBAHARUAN').length;
    const jenisUbahMaklumat = data.filter(item => item.jenis === 'UBAH MAKLUMAT').length;
    const jenisUbahGred = data.filter(item => item.jenis === 'UBAH GRED').length;
    
    if (badgeHistoryAll) badgeHistoryAll.textContent = total;
    if (badgeHistoryStatusLulus) badgeHistoryStatusLulus.textContent = lulus;
    if (badgeHistoryStatusTolak) badgeHistoryStatusTolak.textContent = tolak;
    if (badgeHistoryStatusPending) badgeHistoryStatusPending.textContent = pending;
    if (badgeHistoryJenisBaru) badgeHistoryJenisBaru.textContent = jenisBaru;
    if (badgeHistoryJenisPembaharuan) badgeHistoryJenisPembaharuan.textContent = jenisPembaharuan;
    if (badgeHistoryJenisUbahMaklumat) badgeHistoryJenisUbahMaklumat.textContent = jenisUbahMaklumat;
    if (badgeHistoryJenisUbahGred) badgeHistoryJenisUbahGred.textContent = jenisUbahGred;
  }

  const dbJenisSelect = document.getElementById('db_jenis');
  if (dbJenisSelect) {
    dbJenisSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      const dbPerubahanContainer = document.getElementById('db_perubahan_container');
      const dbPerubahanLabel = document.getElementById('db_perubahan_label');
      const dbPerubahanInput = document.getElementById('db_perubahan_input');
      
      if (!dbPerubahanContainer || !dbPerubahanLabel || !dbPerubahanInput) return;

      if (val === 'UBAH MAKLUMAT') {
        dbPerubahanContainer.style.display = 'block';
        dbPerubahanLabel.textContent = 'Nyatakan Perubahan Maklumat:';
        const ubahMaklumatValue = document.getElementById('input_ubah_maklumat')?.value || '';
        dbPerubahanInput.value = ubahMaklumatValue;
      } else if (val === 'UBAH GRED') {
        dbPerubahanContainer.style.display = 'block';
        dbPerubahanLabel.textContent = 'Nyatakan Perubahan Gred:';
        const ubahGredValue = document.getElementById('input_ubah_gred')?.value || '';
        dbPerubahanInput.value = ubahGredValue;
      } else {
        dbPerubahanContainer.style.display = 'none';
        dbPerubahanInput.value = '';
      }
      
      saveDatabaseFormData();
    });
  }

  const radioInputs = document.querySelectorAll('input[name="jenisApp"]');
  radioInputs.forEach(radio => {
    radio.addEventListener('change', (e) => {
      const val = e.target.value;
      const ubahMaklumatInput = document.getElementById('input_ubah_maklumat');
      const ubahGredInput = document.getElementById('input_ubah_gred');
      if (ubahMaklumatInput) ubahMaklumatInput.style.display = (val === 'ubah_maklumat') ? 'block' : 'none';
      if (ubahGredInput) ubahGredInput.style.display = (val === 'ubah_gred') ? 'block' : 'none';
      saveFormData();
    });
  });

  if (pelulusTukarSyor) {
    pelulusTukarSyor.addEventListener('change', (e) => {
      const val = e.target.value;
      
      if (divPelulusJustifikasi) {
        divPelulusJustifikasi.style.display = (val === 'YA' || val === 'PEMUTIHAN') ? 'block' : 'none';
      }
      
      if (divPelulusDateSpi) {
        divPelulusDateSpi.style.display = (val === 'YA') ? 'block' : 'none';
      }
    });
  }

  if (cbSelesaiLawatan) {
    cbSelesaiLawatan.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      if (containerLawatan) {
        containerLawatan.style.display = isChecked ? 'block' : 'none';
      }
      
      if (!isChecked) {
        if (dbLawatanTarikh) dbLawatanTarikh.value = '';
        if (dbLawatanSubmitSptb) dbLawatanSubmitSptb.value = '';
        if (dbLawatanSyor) dbLawatanSyor.value = '';
      }
    });
  }

  if (cbNotifyWhatsapp) {
    cbNotifyWhatsapp.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      if (pelulusWhatsappContainer) {
        pelulusWhatsappContainer.style.display = isChecked ? 'block' : 'none';
      }
      if (!isChecked && dbPelulusWhatsapp) {
        dbPelulusWhatsapp.value = '';
      }
    });
  }

  if (dbSahSyor) {
    dbSahSyor.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      
      if (labelNotifyWhatsapp) {
        labelNotifyWhatsapp.style.display = isChecked ? 'block' : 'none';
      }
      
      if (!isChecked) {
        if (cbNotifyWhatsapp) {
          cbNotifyWhatsapp.checked = false;
        }
        if (pelulusWhatsappContainer) {
          pelulusWhatsappContainer.style.display = 'none';
        }
        if (dbPelulusWhatsapp) {
          dbPelulusWhatsapp.value = '';
        }
      }
    });
  }

  initSystem();

  function fetchUsers() {
    if (!btnLogin || isFetching) return;

    isFetching = true;
    btnLogin.innerText = 'Memuat turun data...';
    btnLogin.disabled = true;

    console.log("V6.5.1 Fetching users from:", SCRIPT_URL + '?action=getUsers&t=' + Date.now());

    const fetchTimeout = setTimeout(() => {
      if (usersList.length === 0 && btnLogin) {
        btnLogin.innerText = 'LOG MASUK';
        btnLogin.disabled = false;
        if (usersList.length === 0 && loginError) {
          console.warn("V6.5.1 Fetch timeout, no cache available");
        }
      }
      isFetching = false;
    }, 10000);

    fetchWithRetry(`${SCRIPT_URL}?action=getUsers&t=${Date.now()}`, {
      method: 'GET',
      redirect: 'follow'
    }, 3, 1000)
      .then(res => {
        clearTimeout(fetchTimeout);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log("V6.5.1 Users data received:", data.length);
        usersList = data;
        
        storageWrapper.set({ 
          'stb_users_cache': data,
          'stb_cache_timestamp': Date.now()
        });
        
        populateWhatsAppDropdown();
        
        btnLogin.disabled = false;
        btnLogin.innerText = 'LOG MASUK';
        isFetching = false;
      })
      .catch(err => {
        clearTimeout(fetchTimeout);
        console.error("V6.5.1 Fetch error details:", err);
        
        if (usersList.length > 0) {
          console.log("V6.5.1 Using cached users data (silent fallback)");
          populateWhatsAppDropdown();
        } else {
          btnLogin.innerText = "Connection Failed";
          if (loginError) loginError.innerText = "Cannot connect to server. Check internet or server URL.";
        }
        
        btnLogin.disabled = false;
        isFetching = false;
      });
  }

  function saveActiveElement() {
    if (document.activeElement && document.activeElement.id) {
      lastActiveElementId = document.activeElement.id;
      storageWrapper.set({ 
        'stb_last_active_element': lastActiveElementId,
            'stb_last_active_tab': lastActiveTab 
          });
        }
      }

  function restoreActiveElement() {
    if (lastActiveElementId) {
      const element = document.getElementById(lastActiveElementId);
      if (element) {
        setTimeout(() => {
          element.focus();
          if (element.type === 'text' || element.type === 'textarea') {
            element.setSelectionRange(element.value.length, element.value.length);
          }
        }, 100);
      }
    }
  }

  function saveFormState(tabName) {
    if (isRestoring) return;

    const tabContent = document.getElementById(`tab-${tabName}`);
    if (!tabContent) return;

    const state = {};
    tabContent.querySelectorAll('input, select, textarea').forEach(el => {
      if (el.id && !el.id.startsWith('login')) {
        if (el.type === 'checkbox' || el.type === 'radio') {
          state[el.id] = el.checked;
        } else {
          state[el.id] = el.value;
        }
      }
    });

    formStates[tabName] = state;
    storageWrapper.set({ 'stb_form_states': formStates });
  }

  function restoreFormState(tabName) {
    isRestoring = true;

    if (formStates[tabName]) {
      const state = formStates[tabName];
      const tabContent = document.getElementById(`tab-${tabName}`);
      if (tabContent) {
        tabContent.querySelectorAll('input, select, textarea').forEach(el => {
          if (el.id && state[el.id] !== undefined) {
            if (el.type === 'checkbox' || el.type === 'radio') {
              el.checked = state[el.id];
            } else {
              el.value = state[el.id];
            }
            
            if (el.type === 'radio' || el.classList.contains('.role-cb')) {
              el.dispatchEvent(new Event('change'));
            }
          }
        });
      }
    }

    const syorVal = document.getElementById('db_syor')?.value;
    if (syorVal === 'YA' && dbPautanInput) {
      dbPautanInput.style.backgroundColor = '#fffbeb';
      dbPautanInput.style.borderColor = '#f59e0b';
      dbPautanInput.style.borderWidth = '2px';
    }

    isRestoring = false;
  }

  document.addEventListener('focusin', saveActiveElement);

  if (btnLogin) {
    btnLogin.addEventListener('click', performLogin);
  }

  if (loginPin) {
    loginPin.addEventListener('keyup', (e) => { if(e.key === 'Enter') performLogin(); });
  }

  async function performLogin() {
    if (!loginPin || !btnLogin) return;

    const pin = loginPin.value.trim();

    simulateLoadingWithSteps(
      [
        'Mengesahkan identiti...',
        'Memuatkan profil pengguna...',
        'Menyediakan sistem...',
        'Memuatkan data terkini...',
        'Sistem sedia!'
      ],
      'Proses log masuk'
    );

    const user = usersList.find(u => {
      const userPin = String(u.pin || '').trim();
      const inputPin = String(pin).trim();
      return userPin === inputPin;
    });

    if (user) {
      currentUser = user;
      currentUser.role = user.role ? user.role.toUpperCase().trim() : "";
      
      await storageWrapper.set({ 'stb_session': currentUser });
      
      setTimeout(() => {
        hideLoading();
        setupUserUI();
      }, 800);
    } else {
      hideLoading();
      if (loginError) {
        loginError.innerText = "PIN Tidak Sah.";
        setTimeout(() => {
          if (loginError) loginError.innerText = '';
        }, 3000);
      }
    }
  }

  if (userBadge) {
    userBadge.addEventListener('click', async () => {
      if(confirm("Log keluar dari sistem?")) {
        await storageWrapper.remove([
          'stb_session', 
          'stb_form_data', 
          'stb_pelulus_state', 
          'stb_last_active_tab',
          'stb_last_active_element',
          'stb_form_states',
          'stb_search_state',
          'stb_search_history_state',
          'stb_has_printed',
          'stb_drive_folder_url',
          'stb_user_folder_url',
          'stb_filter_pengesyor',
          'stb_dashboard_data',
          'stb_form_persistence',
          'stb_database_persistence',
          'stb_current_submitted_status_filter',
          'stb_current_submitted_jenis_filter',
          'stb_current_history_status_filter',
          'stb_current_history_jenis_filter',
          'stb_current_draft_filter',
          'stb_music_playing',
          'stb_bgm_volume',
          'stb_sfx_volume'
        ]);
        location.reload();
      }
    });
  }

  async function logoutUserOnTimeout() {
    if (!currentUser) return; 
    
    alert("Sesi anda telah tamat tempoh kerana tiada aktiviti selama 1 jam. Anda telah dilog keluar secara automatik demi keselamatan.");
    
    await storageWrapper.remove([
      'stb_session', 'stb_form_data', 'stb_pelulus_state', 'stb_last_active_tab',
      'stb_last_active_element', 'stb_form_states', 'stb_search_state', 'stb_search_history_state',
      'stb_has_printed', 'stb_drive_folder_url', 'stb_user_folder_url', 'stb_filter_pengesyor',
      'stb_dashboard_data', 'stb_form_persistence', 'stb_database_persistence',
      'stb_current_submitted_status_filter', 'stb_current_submitted_jenis_filter',
      'stb_current_history_status_filter', 'stb_current_history_jenis_filter',
      'stb_current_draft_filter', 'stb_music_playing', 'stb_bgm_volume', 'stb_sfx_volume'
    ]);
    location.reload();
  }

  function resetInactivityTimer() {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    if (currentUser) { 
      inactivityTimer = setTimeout(logoutUserOnTimeout, TIMEOUT_DURATION);
    }
  }

  ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(evt => {
    document.addEventListener(evt, resetInactivityTimer, true);
  });

  async function setupUserUI() {
    if (!loginScreen || !appContainer || !userBadge) return;

    loginScreen.style.display = 'none';
    appContainer.style.display = 'block';
    
    if (anonymousBadge) anonymousBadge.style.display = 'none';
    userBadge.innerText = `👤 ${currentUser.name} (${currentUser.role})`;
    
    let themeColor = '#2563eb'; 
    themeColor = getUserColorHex(currentUser.color);
    
    document.documentElement.style.setProperty('--theme-color', themeColor);
    await initAppBasedOnRole();
    
    resetInactivityTimer();
  }

  async function initAppBasedOnRole() {
    if (!tabsContainer) return;

    tabsContainer.innerHTML = '';

    await loadPelulusState(); 
    if (currentUser.role === 'PENGESYOR' || currentUser.role === 'ADMIN') {
      await loadPengesyorState();
      loadFormData();
      setupAutoSaveListeners();
      setupDatabaseAutoSaveListeners();
      loadDatabaseFormData();
    }

    const searchState = await storageWrapper.get(['stb_search_state', 'stb_search_history_state']);
    const searchListInput = document.getElementById('searchListInput');
    const searchHistoryInput = document.getElementById('searchHistoryInput');
    
    if(searchState.stb_search_state && searchListInput) {
      try {
        searchListInput.value = searchState.stb_search_state;
      } catch (e) {
        console.log("V6.5.1 Error setting search input:", e);
      }
    }
    if(searchState.stb_search_history_state && searchHistoryInput) {
      try {
        searchHistoryInput.value = searchState.stb_search_history_state;
      } catch (e) {
        console.log("V6.5.1 Error setting history search input:", e);
      }
    }

    const storage = await storageWrapper.get(['stb_last_active_tab', 'stb_filter_pengesyor']);
    let activeTab = storage.stb_last_active_tab;
    
    const urlParams = getUrlParams();
    if (urlParams.tab) {
      activeTab = urlParams.tab;
      console.log("V6.5.1 Using tab from URL:", activeTab);
    }

    if (!activeTab) {
      if (currentUser.role === 'PENGESYOR') {
        activeTab = 'dashboard';
      } else if (currentUser.role === 'PELULUS') {
        activeTab = 'dashboard';
      } else if (currentUser.role === 'ADMIN') {
        activeTab = 'dashboard';
      } else if (currentUser.role === 'PENGARAH') {
        activeTab = 'admin-dashboard';
      } else if (currentUser.role === 'KETUA SEKSYEN') {
        activeTab = 'admin-dashboard';
      }
    }

    const showProfileTab = (currentUser.role === 'PENGESYOR' || currentUser.role === 'ADMIN');
    
    if (currentUser.role === 'PENGESYOR') {
      tabsContainer.innerHTML = `
        <button class="tab-btn" data-target="dashboard">📊 Dashboard</button>
        <button class="tab-btn" data-target="stb">✓ Borang Semakan</button>
        <button class="tab-btn" data-target="db">📂 Input Database</button>
        <button class="tab-btn" data-target="drafts">📋 Rekod Belum Hantar</button>
        <button class="tab-btn" data-target="submitted">📋 Telah Disyor</button>
        ${showProfileTab ? '<button class="tab-btn" data-target="profile">🏢 Cipta Profile Syarikat</button>' : ''}
      `;
      
      const nameField = document.getElementById('db_pengesyor');
      if(nameField) {
        nameField.value = currentUser.name;
        nameField.readOnly = true;
      }
      
      if(!activeTab || !['dashboard','stb','db','drafts','submitted', 'profile'].includes(activeTab)) {
        activeTab = 'dashboard';
      }
      if(activeTab === 'pelulus-view' && !pelulusActiveItem) {
        activeTab = 'submitted';
      }

      switchTab(activeTab);

    } else if (currentUser.role === 'PELULUS') {
      tabsContainer.innerHTML = `
        <button class="tab-btn" data-target="dashboard">📊 Dashboard</button>
        <button class="tab-btn" data-target="inbox">1. Inbox</button>
        <button class="tab-btn" data-target="pelulus-view">2. Semakan</button>
        <button class="tab-btn" data-target="pelulus-action">3. Keputusan</button>
        <button class="tab-btn" data-target="history">4. Sejarah</button>
      `;
      
      const pelulusNamaField = document.getElementById('pelulus_nama');
      if (pelulusNamaField) pelulusNamaField.value = currentUser.name;
      
      if(!activeTab || !['dashboard','inbox','pelulus-view','pelulus-action','history'].includes(activeTab)) {
        activeTab = 'dashboard';
      }
      
      if (pelulusActiveItem) {
        if (!activeTab || (activeTab !== 'pelulus-action' && activeTab !== 'pelulus-view')) {
          activeTab = 'pelulus-view';
        }
      } else {
        if(activeTab === 'pelulus-view' || activeTab === 'pelulus-action') {
          activeTab = 'dashboard';
        }
      }
      
      switchTab(activeTab);
      
    } else if (currentUser.role === 'ADMIN') {
      tabsContainer.innerHTML = `
        <button class="tab-btn" data-target="admin-dashboard">👑 Admin Dashboard</button>
        ${showProfileTab ? '<button class="tab-btn" data-target="profile">🏢 Cipta Profile Syarikat</button>' : ''}
      `;
      
      const nameField = document.getElementById('db_pengesyor');
      if(nameField) {
        nameField.value = currentUser.name;
        nameField.readOnly = true;
      }
      
      const pelulusNamaField = document.getElementById('pelulus_nama');
      if (pelulusNamaField) pelulusNamaField.value = currentUser.name;
      
      if(!activeTab || !['admin-dashboard', 'profile'].includes(activeTab)) {
        activeTab = 'admin-dashboard';
      }
      
      switchTab(activeTab);
      
    } else if (currentUser.role === 'PENGARAH') {
      tabsContainer.innerHTML = `
        <button class="tab-btn" data-target="admin-dashboard">👑 Admin Dashboard</button>
        <button class="tab-btn" data-target="inbox">📋 Belum Syor</button>
        <button class="tab-btn" data-target="submitted">📋 Telah Syor</button>
        <button class="tab-btn" data-target="history">📜 Sejarah</button>
      `;
      
      const nameField = document.getElementById('db_pengesyor');
      if(nameField) {
        nameField.value = currentUser.name;
        nameField.readOnly = true;
      }
      
      const pelulusNamaField = document.getElementById('pelulus_nama');
      if (pelulusNamaField) pelulusNamaField.value = currentUser.name;
      
      if(!activeTab || !['admin-dashboard','inbox','submitted','history'].includes(activeTab)) {
        activeTab = 'admin-dashboard';
      }
      
      switchTab(activeTab);
      
    } else if (currentUser.role === 'KETUA SEKSYEN') {
      tabsContainer.innerHTML = `
        <button class="tab-btn" data-target="admin-dashboard">👑 Admin Dashboard</button>
        <button class="tab-btn" data-target="inbox">📋 Belum Syor</button>
        <button class="tab-btn" data-target="submitted">📋 Telah Syor</button>
        <button class="tab-btn" data-target="history">📜 Sejarah</button>
      `;
      
      const nameField = document.getElementById('db_pengesyor');
      if(nameField) {
        nameField.value = currentUser.name;
        nameField.readOnly = true;
      }
      
      const pelulusNamaField = document.getElementById('pelulus_nama');
      if (pelulusNamaField) pelulusNamaField.value = currentUser.name;
      
      if(!activeTab || !['admin-dashboard','inbox','submitted','history'].includes(activeTab)) {
        activeTab = 'admin-dashboard';
      }
      
      switchTab(activeTab);
      
    } else {
      alert("Role pengguna tidak dikenali.");
    }

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        closeMobileMenu();
        switchTab(this.getAttribute('data-target')); 
      });
    });

    isAppReady = true; 
  }

  function switchTab(tabName) {
    closeMobileMenu();
    
    if (lastActiveTab) {
      saveFormState(lastActiveTab);
    }

    document.querySelectorAll('.tab-content').forEach(el => {
      el.style.display = 'none';
    });

    document.querySelectorAll('.tab-btn').forEach(btn => { 
      btn.classList.remove('active');
      if(btn.getAttribute('data-target') === tabName) {
        btn.classList.add('active');
      }
    });

    lastActiveTab = tabName;
    storageWrapper.set({ 'stb_last_active_tab': tabName });
    
    if (currentUser) {
      const urlParams = {
        user: (currentUser.name || '').toLowerCase().replace(/\s+/g, '-'),
        tab: tabName
      };
      updateBrowserUrl(urlParams);
    }

    // Ensure search box is always visible except for specific tabs like dashboard, stb, db, pelulus-view, pelulus-action
    const searchBoxEl = document.querySelector('.search-box');
    if (searchBoxEl) {
      const tabsWithSearch = ['drafts', 'submitted', 'inbox', 'history'];
      if (tabsWithSearch.includes(tabName)) {
        searchBoxEl.style.display = 'flex';
      } else {
        searchBoxEl.style.display = 'none';
      }
    }

    // Toggle visibility of specific search inputs based on tab
    const searchListInputContainer = document.getElementById('searchListInput')?.parentElement;
    const searchHistoryInputContainer = document.getElementById('searchHistoryInput')?.parentElement;
    
    if (searchListInputContainer) {
      searchListInputContainer.style.display = (tabName === 'history') ? 'none' : 'flex';
    }
    if (searchHistoryInputContainer) {
      searchHistoryInputContainer.style.display = (tabName === 'history') ? 'flex' : 'none';
    }

    if (submittedFiltersContainer) {
      submittedFiltersContainer.style.display = 'none';
    }
    if (draftFiltersContainer) {
      draftFiltersContainer.style.display = 'none';
    }
    if (historyFiltersContainer) {
      historyFiltersContainer.style.display = 'none';
    }
    if (filterSection) {
      filterSection.style.display = 'none';
    }
    if (pelulusFilterSection) {
      pelulusFilterSection.style.display = 'none';
    }

    if (tabName === 'pelulus-view') {
      if (!pelulusActiveItem) { 
        switchTab(currentUser.role === 'PENGESYOR' ? 'submitted' : 'inbox'); 
        return; 
      }
      const tabPelulusView = document.getElementById('tab-pelulus-view');
      if (tabPelulusView) {
        tabPelulusView.style.display = 'block';
        tabPelulusView.classList.add('active');
      }
      
      let isReadOnly = true;
      if (currentUser.role === 'PELULUS' && !pelulusActiveItem.tarikh_lulus) {
        isReadOnly = false; 
      }
      renderPelulusView(isReadOnly);
      
      setTimeout(() => {
        restoreActiveElement();
      }, 200);
      return;
    }

    if (tabName === 'dashboard') {
      const tabDashboard = document.getElementById('tab-dashboard');
      if (tabDashboard) {
        tabDashboard.style.display = 'block';
        tabDashboard.classList.add('active');
      }
      
      setTimeout(() => {
        initializeTickButtons();
        
        if (!cachedData || cachedData.length === 0) {
           console.log("V6.5.1 Dashboard: Cache kosong, memuat turun data...");
           const listType = (currentUser.role === 'PENGESYOR') ? 'drafts' : 'inbox';
           
           fetchAndRenderList(listType).then(() => {
             isDashboardFirstLoad = true; 
             initializeDashboard();
           }).catch(err => {
             showDashboardNoData();
           });
        } else {
           initializeDashboard();
        }
        
        restoreActiveElement();
      }, 200);
    }
    else if (tabName === 'admin-dashboard') {
      const tabAdminDashboard = document.getElementById('tab-admin-dashboard');
      if (tabAdminDashboard) {
        tabAdminDashboard.style.display = 'block';
        tabAdminDashboard.classList.add('active');
      }
      
      setTimeout(() => {
        loadAdminDashboard();
        restoreActiveElement();
      }, 200);
    }
    else if (tabName === 'profile') {
      const tabProfile = document.getElementById('tab-profile');
      if (tabProfile) {
        tabProfile.style.display = 'block';
        tabProfile.classList.add('active');
      }
      
      setTimeout(() => {
        restoreActiveElement();
      }, 200);
    }
    else if (currentUser.role === 'PENGESYOR' || currentUser.role === 'ADMIN' || currentUser.role === 'PENGARAH' || currentUser.role === 'KETUA SEKSYEN') {
      if (tabName === 'stb' && (currentUser.role === 'PENGESYOR' || currentUser.role === 'ADMIN')) {
        const tabChecker = document.getElementById('tab-checker');
        if (tabChecker) {
          tabChecker.style.display = 'block';
          tabChecker.classList.add('active');
        }
        
        setTimeout(() => {
          restoreFormState('stb');
          initializeTickButtons();
          restoreActiveElement();
        }, 200);
      }
      else if (tabName === 'db' && (currentUser.role === 'PENGESYOR' || currentUser.role === 'ADMIN')) {
        const tabDatabase = document.getElementById('tab-database');
        if (tabDatabase) {
          tabDatabase.style.display = 'block';
          tabDatabase.classList.add('active');
        }
        
        setTimeout(() => {
          restoreFormState('db');
          initializeTickButtons();
          restoreActiveElement();
        }, 200);
        
        if (driveSection) {
          driveSection.style.display = 'block';
          
          if (driveFolderInfo) {
            driveFolderInfo.style.display = 'block';
          }
          
          updateOpenDriveButton();
          
          if (driveFolderCreated && createdFolderUrl) {
            showDriveFolderLink(createdFolderUrl);
          }
        }
      }
      else if (tabName === 'drafts' && (currentUser.role === 'PENGESYOR' || currentUser.role === 'ADMIN')) {
        const tabList = document.getElementById('tab-list');
        if (tabList) {
          tabList.style.display = 'block';
          tabList.classList.add('active');
        }
        
        if (draftFiltersContainer) {
          draftFiltersContainer.style.display = 'flex';
        }
        
        fetchAndRenderList('drafts');
      }
      else if (tabName === 'submitted') {
        const tabList = document.getElementById('tab-list');
        if (tabList) {
          tabList.style.display = 'block';
          tabList.classList.add('active');
        }
        
        if (submittedFiltersContainer) {
          submittedFiltersContainer.style.display = 'flex';
        }
        
        // For KETUA SEKSYEN, also show pengesyor filter
        if (currentUser.role === 'KETUA SEKSYEN') {
          if (filterSection) {
            filterSection.style.display = 'flex';
            updatePengesyorFilter();
          }
        }
        
        fetchAndRenderList('submitted');
      }
      else if (tabName === 'inbox') {
        const tabList = document.getElementById('tab-list');
        if (tabList) {
          tabList.style.display = 'block';
          tabList.classList.add('active');
        }
        
        if (filterSection) {
          filterSection.style.display = 'flex';
          updatePengesyorFilter();
        }
        
        fetchAndRenderList('inbox');
      }
      else if (tabName === 'history') {
        const tabHistory = document.getElementById('tab-history');
        if (tabHistory) {
          tabHistory.style.display = 'block';
          tabHistory.classList.add('active');
        }
        
        if (historyFiltersContainer) {
          historyFiltersContainer.style.display = 'flex';
        }
        if (pelulusFilterSection) {
          pelulusFilterSection.style.display = 'flex';
          updatePelulusFilter();
        }
        
        fetchAndRenderList('history');
      }
    } 
    else if (currentUser.role === 'PELULUS') {
      if (tabName === 'inbox') {
        const tabList = document.getElementById('tab-list');
        if (tabList) {
          tabList.style.display = 'block';
          tabList.classList.add('active');
        }
        
        if (filterSection) {
          filterSection.style.display = 'flex';
          updatePengesyorFilter();
        }
        
        fetchAndRenderList('inbox');
      }
      else if (tabName === 'pelulus-action') {
        if(!pelulusActiveItem) { 
          switchTab('inbox'); 
          return; 
        } 
        const tabPelulusAction = document.getElementById('tab-pelulus-action');
        if (tabPelulusAction) {
          tabPelulusAction.style.display = 'block';
          tabPelulusAction.classList.add('active');
        }
        
        const actionSummary = document.getElementById('pelulus_action_summary');
        if (actionSummary) actionSummary.innerText = pelulusActiveItem.syarikat; 
        
        setTimeout(() => {
          restoreFormState('pelulus-action');
          restoreActiveElement();
        }, 200);
      }
      else if (tabName === 'history') {
        const tabHistory = document.getElementById('tab-history');
        if (tabHistory) {
          tabHistory.style.display = 'block';
          tabHistory.classList.add('active');
        }
        
        if (historyFiltersContainer) {
          historyFiltersContainer.style.display = 'flex';
        }
        
        fetchAndRenderList('history');
      }
    }

    updateValidationCheckboxDisplay();
  }

  async function createDriveFolder() {
    const syarikat = document.getElementById('db_syarikat')?.value.trim();
    const jenisPermohonan = document.getElementById('db_jenis')?.value;
    const tarikhMohon = document.getElementById('db_start_date')?.value || document.getElementById('borang_tarikh_mohon')?.value;
    const userName = currentUser.name;

    if (!syarikat) {
      alert("Sila isi Nama Syarikat terlebih dahulu.");
      return;
    }

    if (!jenisPermohonan) {
      alert("Sila pilih Jenis Permohonan terlebih dahulu.");
      return;
    }

    if (!tarikhMohon) {
      alert("Sila isi Tarikh Mohon atau Start Date terlebih dahulu.");
      return;
    }

    if (driveStatus) {
      driveStatus.style.display = 'inline-block';
      driveStatus.className = 'drive-status drive-creating';
      driveStatus.innerText = 'Mencipta...';
    }

    if (driveResult) {
      driveResult.innerHTML = '<div style="color: #92400e;">Sedang mencipta folder dalam User Folder...</div>';
    }

    const now = new Date();
    const currentMonth = now.toLocaleString('ms-MY', { month: 'long' });
    const currentYear = now.getFullYear();
    const monthYearFolder = `${currentMonth.toUpperCase()} ${currentYear}`;

    let formattedDate = '';
    try {
      const tarikhDate = new Date(tarikhMohon);
      formattedDate = tarikhDate.toLocaleDateString('ms-MY', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).replace(/\//g, '-');
    } catch (e) {
      formattedDate = tarikhMohon;
    }

    const companyFolderName = syarikat.toUpperCase();
    const subfolderName = `${jenisPermohonan.toUpperCase()} - ${formattedDate}`;

    const payload = {
      action: 'createDriveFolder',
      month_year: monthYearFolder,
      company_name: companyFolderName,
      application_type: subfolderName,
      user_name: userName,
      main_folder_id: mainFolderId
    };

    try {
      const response = await fetchWithRetry(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      }, 3, 1000);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        await playSuccessSound();
        
        driveFolderCreated = true;
        createdFolderUrl = result.folder_url;
        userFolderUrl = result.user_folder_url;
        
        await storageWrapper.set({ 
          'stb_drive_folder_url': createdFolderUrl,
          'stb_user_folder_url': userFolderUrl 
        });
        
        const dbPautan = document.getElementById('db_pautan');
        if (dbPautan) {
          dbPautan.value = createdFolderUrl;
        }
        
        if (driveStatus) {
          driveStatus.className = 'drive-status drive-success';
          driveStatus.innerText = 'Berjaya';
        }
        
        showDriveFolderLink(createdFolderUrl, userFolderUrl);
        
        if (cbCreateDriveFolder) {
          cbCreateDriveFolder.checked = true;
        }
        
        updateOpenDriveButton();
        
        await playSuccessSound();
        alert("Folder Drive berjaya dicipta dalam User Folder System! Pautan telah dimasukkan automatik.");
        
      } else {
        throw new Error(result.message || 'Gagal mencipta folder');
      }
      
    } catch (error) {
      console.error("V6.5.1 Error creating drive folder:", error);
      
      await playErrorSound();
      
      if (driveStatus) {
        driveStatus.className = 'drive-status drive-error';
        driveStatus.innerText = 'Gagal';
      }
      
      if (driveResult) {
        driveResult.innerHTML = `<div style="color: #991b1b;">Ralat: ${error.message}</div>`;
      }
      
      alert(`Gagal mencipta folder: ${error.message}`);
    }
  }

  function showDriveFolderLink(folderUrl, userFolderUrl) {
    if (!driveResult) return;

    const syarikat = document.getElementById('db_syarikat')?.value || '';
    const userName = currentUser.name;

    driveResult.innerHTML = `
      <div style="margin-top: 10px; padding: 10px; background: #dcfce7; border-radius: 8px; border: 1px solid #22c55e;">
        <div style="font-weight: bold; color: #166534; margin-bottom: 5px;">✓ Folder berjaya dicipta dalam User Folder System!</div>
        <div style="margin-bottom: 8px;">
          <a href="${folderUrl}" target="_blank" class="drive-link">
            📂 Klik untuk buka folder syarikat
          </a>
        </div>
        <div style="margin-bottom: 5px;">
          <a href="${userFolderUrl}" target="_blank" class="drive-link" style="background: #dbeafe;">
            👤 Klik untuk buka folder user: ${userName}
          </a>
        </div>
        <div style="font-size: 0.8rem; color: #4b5563; margin-top: 5px;">
          Folder: ${syarikat}
        </div>
        <div style="font-size: 0.7rem; color: #6b7280; margin-top: 3px;">
          Pautan telah dimasukkan ke dalam "Pautan Dokumen"
        </div>
      </div>
    `;
  }

  function updateOpenDriveButton() {
    const dbPautan = document.getElementById('db_pautan')?.value;
    const btnOpenDrive = document.getElementById('btnOpenDriveFolder');

    if (btnOpenDrive) {
      if (dbPautan && dbPautan.trim() !== '') {
        btnOpenDrive.disabled = false;
        btnOpenDrive.title = "Buka Folder Drive";
      } else {
        btnOpenDrive.disabled = true;
        btnOpenDrive.title = "Sila cipta folder terlebih dahulu";
      }
    }
  }

  function savePelulusState() {
    if (isRestoring) return;
    const state = {
      activeItem: pelulusActiveItem,
      keputusan: document.getElementById('pelulus_keputusan')?.value || '',
      alasan: document.getElementById('pelulus_alasan')?.value || ''
    };
    storageWrapper.set({ 'stb_pelulus_state': state });
  }

  async function loadPelulusState() {
    const stored = await storageWrapper.get(['stb_pelulus_state']);
    const state = stored.stb_pelulus_state;
    if(state && state.activeItem) {
      pelulusActiveItem = state.activeItem; 
      const elKeputusan = document.getElementById('pelulus_keputusan');
      if(elKeputusan) {
        elKeputusan.value = state.keputusan || '';
        
        const alasanEl = document.getElementById('pelulus_alasan');
        if (alasanEl) alasanEl.value = state.alasan || '';
        
        const evt = new Event('change');
        elKeputusan.dispatchEvent(evt);
      }
    }
    updateValidationCheckboxDisplay();
  }

  const pelKeputusan = document.getElementById('pelulus_keputusan');
  if(pelKeputusan) {
    pelKeputusan.addEventListener('change', (e) => {
      const val = e.target.value;
      const divAlasan = document.getElementById('div_alasan');
      const alasanSelect = document.getElementById('pelulus_alasan');
      
      if(divAlasan) {
        divAlasan.style.display = (val.includes('TOLAK') || val === 'SIASAT') ? 'block' : 'none';
      }
      
      if(alasanSelect && (val.includes('LULUS') || val === '')) {
        alasanSelect.value = '';
        savePelulusState();
      }

      if (labelPelulusSahLulus) {
        if (val !== '') {
          labelPelulusSahLulus.style.display = 'block';
        } else {
          labelPelulusSahLulus.style.display = 'none';
          if (pelulusSahLulus) pelulusSahLulus.checked = false;
        }
      }
    });
  }

  ['pelulus_keputusan', 'pelulus_alasan'].forEach(id => {
    const el = document.getElementById(id);
    if(el) {
      el.addEventListener('input', savePelulusState);
      el.addEventListener('change', savePelulusState);
    }
  });

  function savePengesyorState() {
    if (isRestoring || (currentUser && currentUser.role !== 'PENGESYOR' && currentUser.role !== 'ADMIN')) return;

    const formData = {};
    document.querySelectorAll('input, select, textarea').forEach(el => {
      if(el.id && !el.id.startsWith('pelulus_') && el.id !== 'searchListInput' && el.id !== 'searchHistoryInput' && !el.id.startsWith('login')) {
        if (el.type === 'text' || el.type === 'textarea') {
          if (el.id.includes('pautan') || el.id.includes('link')) {
            formData[el.id] = el.value;
          } else {
            formData[el.id] = el.value.toUpperCase();
          }
        } else {
          formData[el.id] = el.type === 'checkbox' ? el.checked : el.value;
        }
      }
    });

    const selectedRadio = document.querySelector('input[name="jenisApp"]:checked');
    if(selectedRadio) formData['jenisApp'] = selectedRadio.value;

    const personnel = [];
    document.querySelectorAll('.person-card').forEach(card => {
      const roles = [];
      card.querySelectorAll('.role-cb:checked').forEach(cb => roles.push(cb.value));
      personnel.push({
        name: card.querySelector('.p-name')?.value.toUpperCase() || '',
        isCompany: card.querySelector('.is-company')?.checked || false,
        roles: roles,
        s_ic: card.querySelector('.status-ic')?.value.toUpperCase() || '',
        s_sb: card.querySelector('.status-sb')?.value.toUpperCase() || '',
        s_epf: card.querySelector('.status-epf')?.value.toUpperCase() || ''
      });
    });
    formData.personnel = personnel;
    storageWrapper.set({ 'stb_form_data': formData });
  }

  async function loadPengesyorState() {
    isRestoring = true; 
    const stored = await storageWrapper.get(['stb_form_data']);
    const data = stored.stb_form_data;

    const personnelListEl = document.getElementById('personnelList');
    if (personnelListEl) personnelListEl.innerHTML = ''; 

    if(data) {
      for(const key in data) {
        if(key === 'personnel') continue;
        const el = document.getElementById(key);
        if(el) {
          if(el.type === 'checkbox') el.checked = data[key];
          else el.value = data[key];
        }
      }
      
      if(data.jenisApp) {
        const radio = document.querySelector(`input[name="jenisApp"][value="${data.jenisApp}"]`);
        if(radio) {
          radio.checked = true;
          radio.dispatchEvent(new Event('change'));
        }
      }

      if(data.personnel && data.personnel.length > 0) {
        data.personnel.forEach(p => addPerson(p));
      } else {
        addPerson();
      }
    } else {
      addPerson(); 
    }

    const syorVal = document.getElementById('db_syor')?.value;
    if (syorVal === 'YA' && dbPautanInput) {
      dbPautanInput.style.backgroundColor = '#fffbeb';
      dbPautanInput.style.borderColor = '#f59e0b';
      dbPautanInput.style.borderWidth = '2px';
    }

    updateOpenDriveButton();

    isRestoring = false;

    updateValidationCheckboxDisplay();
  }

  function updateValidationCheckboxDisplay() {
    const dbSyorStatusVal = document.getElementById('db_syor_status')?.value || '';
    if (labelDbSahSyor) {
      if (dbSyorStatusVal !== '') {
        labelDbSahSyor.style.display = 'block';
      } else {
        labelDbSahSyor.style.display = 'none';
        if (dbSahSyor) dbSahSyor.checked = false;
      }
    }

    const pelulusKeputusanVal = document.getElementById('pelulus_keputusan')?.value || '';
    if (labelPelulusSahLulus) {
      if (pelulusKeputusanVal !== '') {
        labelPelulusSahLulus.style.display = 'block';
      } else {
        labelPelulusSahLulus.style.display = 'none';
        if (pelulusSahLulus) pelulusSahLulus.checked = false;
      }
    }
  }

  if(btnSyncToDb) {
    btnSyncToDb.addEventListener('click', () => {
      const syarikat = document.getElementById('borang_syarikat')?.value || '';
      const cidb = document.getElementById('borang_cidb')?.value || '';
      const tMohon = document.getElementById('borang_tarikh_mohon')?.value || '';
      const tatatertib = document.getElementById('borang_tatatertib')?.value || '';
      const gred = document.getElementById('borang_gred')?.value || '';
      const justifikasi = document.getElementById('borang_justifikasi')?.value || '';
      
      const dbSyarikat = document.getElementById('db_syarikat');
      const dbCidb = document.getElementById('db_cidb');
      const dbStartDate = document.getElementById('db_start_date');
      const dbTatatertib = document.getElementById('db_tatatertib');
      const dbGred = document.getElementById('db_gred');
      const dbJustifikasi = document.getElementById('db_justifikasi');
      
      if (dbSyarikat) dbSyarikat.value = syarikat;
      if (dbCidb) dbCidb.value = cidb;
      if (dbStartDate) dbStartDate.value = tMohon; 
      if (dbTatatertib) dbTatatertib.value = tatatertib;
      if (dbGred) dbGred.value = gred;
      if (dbJustifikasi) dbJustifikasi.value = justifikasi;

      const selectedType = document.querySelector('input[name="jenisApp"]:checked')?.value;
      if(selectedType) {
        const dropdown = document.getElementById('db_jenis');
        let dbVal = "";

        if(selectedType === 'baru') dbVal = "BARU";
        if(selectedType === 'pembaharuan') dbVal = "PEMBAHARUAN";
        if(selectedType === 'ubah_maklumat') dbVal = "UBAH MAKLUMAT";
        if(selectedType === 'ubah_gred') dbVal = "UBAH GRED";
        if(dbVal && dropdown) dropdown.value = dbVal;
        
        const dbPerubahanInput = document.getElementById('db_perubahan_input');
        if (dbPerubahanInput) {
          if (selectedType === 'ubah_maklumat') {
            const ubahMaklumatValue = document.getElementById('input_ubah_maklumat')?.value || '';
            dbPerubahanInput.value = ubahMaklumatValue;
          } else if (selectedType === 'ubah_gred') {
            const ubahGredValue = document.getElementById('input_ubah_gred')?.value || '';
            dbPerubahanInput.value = ubahGredValue;
          }
        }
      }

      saveDatabaseFormData();
      switchTab('db');
    });
  }

  const btnBackToForm = document.getElementById('btnBackToForm');
  if(btnBackToForm) {
    btnBackToForm.addEventListener('click', () => {
      switchTab('stb');
    });
  }

  const btnViewBack = document.getElementById('btnViewBack');
  if(btnViewBack) {
    btnViewBack.addEventListener('click', () => {
      if (currentUser.role === 'PENGESYOR') {
        switchTab('submitted');
      } else if (currentUser.role === 'ADMIN' || currentUser.role === 'KETUA SEKSYEN' || currentUser.role === 'PENGARAH') {
        switchTab('inbox');
      } else {
        if (pelulusActiveItem && pelulusActiveItem.tarikh_lulus) {
          switchTab('history');
        } else {
          switchTab('inbox');
        }
      }
    });
  }

  const btnToForm = document.getElementById('btnToForm');
  if(btnToForm) btnToForm.addEventListener('click', () => switchTab('stb'));

  const btnToApproval = document.getElementById('btnToApproval');
  if(btnToApproval) btnToApproval.addEventListener('click', () => switchTab('pelulus-action'));

  const btnPelulusBack = document.getElementById('btnPelulusBack');
  if(btnPelulusBack) btnPelulusBack.addEventListener('click', () => switchTab('pelulus-view'));

  const btnRefreshList = document.getElementById('btnRefreshList');
  if(btnRefreshList) btnRefreshList.addEventListener('click', () => {
    if (currentUser.role === 'PENGESYOR') {
      fetchAndRenderList('drafts');
    } else {
      fetchAndRenderList('inbox');
    }
  });

  if(openFullBtn) {
    openFullBtn.addEventListener('click', () => { 
      saveFormData();
      if (lastActiveTab) {
        saveFormState(lastActiveTab);
      }
      
      const fullViewUrl = 'index.html?view=full';
      window.open(fullViewUrl, '_blank'); 
    });
  }
  if(openFullBtnPelulus) {
    openFullBtnPelulus.addEventListener('click', () => { 
      savePelulusState();
      
      const fullViewUrl = 'index.html?view=full';
      window.open(fullViewUrl, '_blank'); 
    });
  }
  
  if(btnAdminFullView) {
    btnAdminFullView.addEventListener('click', () => {
      const fullViewUrl = 'index.html?view=full';
      window.open(fullViewUrl, '_blank');
    });
  }
  
  if(btnTopFullView) {
    btnTopFullView.addEventListener('click', () => {
      if (currentUser) {
        saveFormData();
        saveDatabaseFormData();
        if (lastActiveTab) {
          saveFormState(lastActiveTab);
        }
        if (currentUser.role === 'PELULUS' && pelulusActiveItem) {
          savePelulusState();
        }
      }
      
      const fullViewUrl = 'index.html?view=full';
      window.open(fullViewUrl, '_blank');
    });
  }

  const btnResetTab1 = document.getElementById('btnResetTab1');
  if(btnResetTab1) btnResetTab1.addEventListener('click', async () => {
    if(!confirm("Set semula borang?")) return;
    await resetForm();
  });
  const btnResetTab2 = document.getElementById('btnResetTab2');
  if(btnResetTab2) btnResetTab2.addEventListener('click', async () => {
    if(!confirm("Set semula borang?")) return;
    await resetForm();
  });

  async function resetForm() {
    await storageWrapper.remove([
      'stb_form_data', 
      'stb_form_states', 
      'stb_has_printed', 
      'stb_drive_folder_url', 
      'stb_user_folder_url', 
      'stb_extracted_pdf_data',
      'stb_form_persistence',
      'stb_database_persistence'
    ]);

    document.querySelectorAll('input, select').forEach(el => {
      if (el.id !== 'db_pengesyor' && el.id !== 'pelulus_nama' && !el.id.startsWith('login')) {
        if(el.type === 'checkbox' || el.type === 'radio') el.checked = false;
        else el.value = '';
      }
    });

    if (dbPautanInput) {
      dbPautanInput.style.backgroundColor = '';
      dbPautanInput.style.borderColor = '';
      dbPautanInput.style.borderWidth = '';
    }

    if (btnSyncToDb) {
      btnSyncToDb.style.display = 'none';
    }

    hasPrinted = false;
    driveFolderCreated = false;
    createdFolderUrl = '';
    userFolderUrl = '';
    extractedPdfData = null;

    const ubahMaklumatInput = document.getElementById('input_ubah_maklumat');
    const ubahGredInput = document.getElementById('input_ubah_gred');
    if (ubahMaklumatInput) ubahMaklumatInput.style.display = 'none';
    if (ubahGredInput) ubahGredInput.style.display = 'none';

    const personnelListEl = document.getElementById('personnelList');
    if (personnelListEl) personnelListEl.innerHTML = '';

    if (driveResult) driveResult.innerHTML = '';
    if (driveStatus) {
      driveStatus.style.display = 'none';
    }

    clearPdfData();

    updateOpenDriveButton();

    addPerson();
    alert("Borang telah diset semula.");

    updateValidationCheckboxDisplay();
  }

  function checkUnsavedData() {
    const borangFields = [
      'borang_syarikat', 'borang_cidb', 'borang_gred', 'borang_tarikh_mohon',
      'borang_tatatertib', 'borang_justifikasi', 'spkkDuration', 'stbDuration'
    ];

    const dbFields = ['db_syarikat', 'db_cidb', 'db_gred'];

    let hasData = false;

    borangFields.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.value.trim() !== '') {
        hasData = true;
      }
    });

    dbFields.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.value.trim() !== '') {
        hasData = true;
      }
    });

    const personCards = document.querySelectorAll('.person-card');
    personCards.forEach(card => {
      const name = card.querySelector('.p-name')?.value;
      if (name && name.trim() !== '') {
        hasData = true;
      }
    });

    return hasData;
  }

  async function resetFormForEdit() {
    const fieldsToClear = [
      'borang_syarikat', 'borang_cidb', 'borang_gred', 'borang_tarikh_mohon',
      'borang_tatatertib', 'borang_justifikasi', 'spkkDuration', 'stbDuration', 'ssm_date_input',
      'ssm_status', 'bank_date_input', 'bank_sign_input', 'bank_status_input',
      'doc_carta_status', 'doc_peta_status', 'doc_gambar_status', 'doc_sewa_status',
      'kwsp_date_1', 'kwsp_s1', 'kwsp_date_2', 'kwsp_s2', 'kwsp_date_3', 'kwsp_s3',
      'input_ubah_maklumat', 'input_ubah_gred'
    ];

    fieldsToClear.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });

    document.querySelectorAll('input[name="jenisApp"]').forEach(radio => {
      radio.checked = false;
    });

    const ubahMaklumatInput = document.getElementById('input_ubah_maklumat');
    const ubahGredInput = document.getElementById('input_ubah_gred');
    if (ubahMaklumatInput) ubahMaklumatInput.style.display = 'none';
    if (ubahGredInput) ubahGredInput.style.display = 'none';

    const personnelListEl = document.getElementById('personnelList');
    if (personnelListEl) personnelListEl.innerHTML = '';

    addPerson();

    await storageWrapper.remove([
      'stb_form_data', 
      'stb_drive_folder_url', 
      'stb_user_folder_url', 
      'stb_extracted_pdf_data',
      'stb_form_persistence',
      'stb_database_persistence'
    ]);

    console.log("V6.5.1 Borang telah direset untuk edit.");
  }

  const searchInput = document.getElementById('searchListInput');
  if(searchInput) {
    searchInput.addEventListener('input', (e) => {
      const val = e.target.value;
      storageWrapper.set({ 'stb_search_state': val }); 
      if(activeListType) renderFilteredList(activeListType);
    });
  }

  const searchHistoryInput = document.getElementById('searchHistoryInput');
  if(searchHistoryInput) {
    searchHistoryInput.addEventListener('input', (e) => {
      const val = e.target.value;
      storageWrapper.set({ 'stb_search_history_state': val }); 
      if(activeListType) renderFilteredList(activeListType);
    });
  }

  function fetchAndRenderList(listType) {
    if (!listStatus) return;

    activeListType = listType; 

    simulateLoadingWithSteps(
      [
        'Menyambung ke pelayan...',
        'Memuat turun data terkini...',
        'Memproses rekod...',
        'Menyusun senarai...',
        'Menyiapkan paparan...'
      ],
      'Muat turun data'
    );

    if (cachedData.length > 0) {
      renderFilteredList(listType);
      listStatus.innerText = `Using cached data (${cachedData.length} records)`;
      hideLoading();
    }

    return fetchWithRetry(SCRIPT_URL + '?action=getData&t=' + Date.now(), {
      method: 'GET',
      redirect: 'follow'
    }, 3, 1000)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        cachedData = data;
        
        storageWrapper.set({ 
          'stb_data_cache': data,
          'stb_cache_timestamp': Date.now()
        });
        
        updateDynamicYears(data);
        
        if (currentUser.role === 'PELULUS' || currentUser.role === 'ADMIN' || currentUser.role === 'KETUA SEKSYEN' || currentUser.role === 'PENGARAH') {
          updatePengesyorFilter();
        }
        
        renderFilteredList(listType);
        listStatus.innerText = `Kemaskini: ${data.length} rekod`;
        
        setTimeout(() => {
          hideLoading();
        }, 500);
        
        return data;
      })
      .catch(err => {
        console.error("V6.5.1 Fetch list error:", err);
        if (cachedData.length > 0) {
          if (currentUser.role === 'PELULUS' || currentUser.role === 'ADMIN' || currentUser.role === 'KETUA SEKSYEN' || currentUser.role === 'PENGARAH') {
            updatePengesyorFilter();
          }
          
          renderFilteredList(listType);
          listStatus.innerText = `Using cached data (${cachedData.length} records) - Offline mode`;
        } else {
          listStatus.innerText = "Gagal memuat data.";
        }
        hideLoading();
        throw err;
      });
  }

  function renderFilteredList(type) {
    const listId = type === 'history' ? 'historyList' : 'applicationsList';
    const list = document.getElementById(listId);
    if (!list) return;

    list.innerHTML = '';

    if (!currentUser || !cachedData) {
      list.innerHTML = '<div style="padding:10px; text-align:center; color:#777;">Tiada data pengguna.</div>';
      return;
    }

    const user = currentUser.name.toUpperCase();
    let filtered = [];

    if (type === 'drafts') {
      filtered = cachedData.filter(i => (!i.tarikh_syor) && (!i.pengesyor || i.pengesyor.toUpperCase() === user));
    }
    else if (type === 'submitted') {
      if (currentUser.role === 'PENGESYOR') {
        filtered = cachedData.filter(i => i.tarikh_syor && i.pengesyor && i.pengesyor.toUpperCase() === user);
      } else if (currentUser.role === 'KETUA SEKSYEN') {
        // KETUA SEKSYEN: Telah disyor tetapi belum diluluskan (Inbox Pelulus)
        filtered = cachedData.filter(i => i.tarikh_syor && (!i.tarikh_lulus || i.tarikh_lulus === ''));
      } else {
        filtered = cachedData.filter(i => i.tarikh_syor && i.tarikh_lulus);
      }
    }
     else if (type === 'inbox') {
      	// Filter logic for inbox
      if (currentUser.role === 'KETUA SEKSYEN') {
        // Untuk Ketua Seksyen, "Belum Syor" bermaksud semua rekod yang belum ada tarikh_syor (dari SEMUA pengesyor)
        filtered = cachedData.filter(i => !i.tarikh_syor);
      } else {
        // Original logic for Pelulus, Pengarah: Has been syor but not yet lulus
        filtered = cachedData.filter(i => i.tarikh_syor && (!i.tarikh_lulus || i.tarikh_lulus === ''));
      }
    }    else if (type === 'history') {
      if (currentUser.role === 'PELULUS') {
        filtered = cachedData.filter(i => i.tarikh_lulus && i.pelulus && i.pelulus.toUpperCase() === user);
      } else {
        filtered = cachedData.filter(i => i.tarikh_lulus);
      }
    }

    filtered = filtered.filter(item => item.syarikat && item.syarikat.trim() !== "");
    
    if (type === 'submitted') {
      updateSubmittedBadges(filtered);
    }
    
    if (type === 'drafts' || type === 'inbox') {
      const countAll = filtered.length;
      const countBaru = filtered.filter(item => item.jenis === 'BARU').length;
      const countPembaharuan = filtered.filter(item => item.jenis === 'PEMBAHARUAN').length;
      const countUbahMaklumat = filtered.filter(item => item.jenis === 'UBAH MAKLUMAT').length;
      const countUbahGred = filtered.filter(item => item.jenis === 'UBAH GRED').length;
      const countSpi = filtered.filter(item => item.date_submit && item.date_submit.trim() !== '').length;
      
      if (badgeAll) badgeAll.textContent = countAll;
      if (badgeBaru) badgeBaru.textContent = countBaru;
      if (badgePembaharuan) badgePembaharuan.textContent = countPembaharuan;
      if (badgeUbahMaklumat) badgeUbahMaklumat.textContent = countUbahMaklumat;
      if (badgeUbahGred) badgeUbahGred.textContent = countUbahGred;
      if (badgeSpi) badgeSpi.textContent = countSpi;
    }

    if (type === 'history') {
      updateHistoryBadges(filtered);
    }

    if (type === 'history') {
      if (historyMonthFilter && historyYearFilter) {
        const selectedMonth = parseInt(historyMonthFilter.value);
        const selectedYear = parseInt(historyYearFilter.value);
        
        if (selectedMonth && selectedYear) {
          filtered = filtered.filter(item => {
            let dateToUse = null;
            if (item.start_date) dateToUse = new Date(item.start_date);
            else if (item.tarikh_lulus) dateToUse = new Date(item.tarikh_lulus);
            else if (item.date_submit) dateToUse = new Date(item.date_submit);
            
            if (!dateToUse || isNaN(dateToUse)) return true;
            return dateToUse.getMonth() + 1 === selectedMonth && dateToUse.getFullYear() === selectedYear;
          });
        } else if (selectedYear) {
          filtered = filtered.filter(item => {
            let dateToUse = null;
            if (item.start_date) dateToUse = new Date(item.start_date);
            else if (item.tarikh_lulus) dateToUse = new Date(item.tarikh_lulus);
            else if (item.date_submit) dateToUse = new Date(item.date_submit);
            
            if (!dateToUse || isNaN(dateToUse)) return true;
            return dateToUse.getFullYear() === selectedYear;
          });
        }
      }
    } else if (listFilterMonth && listFilterYear) {
      const selectedMonth = parseInt(listFilterMonth.value);
      const selectedYear = parseInt(listFilterYear.value);
      
      if (selectedMonth && selectedYear) {
        filtered = filtered.filter(item => {
          let dateToUse = null;
          if (item.start_date) dateToUse = new Date(item.start_date);
          else if (item.tarikh_lulus) dateToUse = new Date(item.tarikh_lulus);
          else if (item.date_submit) dateToUse = new Date(item.date_submit);
          
          if (!dateToUse || isNaN(dateToUse)) return true;
          return dateToUse.getMonth() + 1 === selectedMonth && dateToUse.getFullYear() === selectedYear;
        });
      } else if (selectedYear) {
        filtered = filtered.filter(item => {
          let dateToUse = null;
          if (item.start_date) dateToUse = new Date(item.start_date);
          else if (item.tarikh_lulus) dateToUse = new Date(item.tarikh_lulus);
          else if (item.date_submit) dateToUse = new Date(item.date_submit);
          
          if (!dateToUse || isNaN(dateToUse)) return true;
          return dateToUse.getFullYear() === selectedYear;
        });
      }
    }

    // Separate search logic for history and other tabs
    let searchVal = '';
    if (type === 'history') {
      const searchHistoryInput = document.getElementById('searchHistoryInput');
      searchVal = searchHistoryInput ? searchHistoryInput.value.trim().toUpperCase() : '';
    } else {
      const searchListInput = document.getElementById('searchListInput');
      searchVal = searchListInput ? searchListInput.value.trim().toUpperCase() : '';
    }
    
    if(searchVal) {
      filtered = filtered.filter(item => {
        const syarikat = item.syarikat ? item.syarikat.toUpperCase() : '';
        const cidb = item.cidb ? String(item.cidb).toUpperCase() : '';
        return syarikat.includes(searchVal) || cidb.includes(searchVal);
      });
    }
    
    if ((type === 'drafts' || type === 'inbox') && currentDraftFilter !== 'ALL') {
      if (currentDraftFilter === 'SPI') {
        filtered = filtered.filter(item => item.date_submit && item.date_submit.trim() !== '');
      } else {
        filtered = filtered.filter(item => item.jenis === currentDraftFilter);
      }
    }
    
    if (type === 'submitted') {
      if (currentSubmittedStatusFilter !== 'ALL') {
        if (currentSubmittedStatusFilter === 'LULUS') {
          filtered = filtered.filter(item => item.kelulusan && item.kelulusan.includes('LULUS'));
        } else if (currentSubmittedStatusFilter === 'TOLAK') {
          filtered = filtered.filter(item => item.kelulusan && (item.kelulusan.includes('TOLAK') || item.kelulusan.includes('SIASAT')));
        } else if (currentSubmittedStatusFilter === 'PENDING') {
          filtered = filtered.filter(item => !item.kelulusan || item.kelulusan === '');
        }
      }
      if (currentSubmittedJenisFilter !== 'ALL') {
        filtered = filtered.filter(item => item.jenis === currentSubmittedJenisFilter);
      }
    }
    
    if (type === 'history') {
      if (currentHistoryStatusFilter !== 'ALL') {
        if (currentHistoryStatusFilter === 'LULUS') {
          filtered = filtered.filter(item => item.kelulusan && item.kelulusan.includes('LULUS'));
        } else if (currentHistoryStatusFilter === 'TOLAK') {
          filtered = filtered.filter(item => item.kelulusan && (item.kelulusan.includes('TOLAK') || item.kelulusan.includes('SIASAT')));
        } else if (currentHistoryStatusFilter === 'PENDING') {
          filtered = filtered.filter(item => !item.kelulusan || item.kelulusan === '');
        }
      }
      if (currentHistoryJenisFilter !== 'ALL') {
        filtered = filtered.filter(item => item.jenis === currentHistoryJenisFilter);
      }
    }

    if ((type === 'inbox' || type === 'submitted' || type === 'history') && (currentUser.role === 'PELULUS' || currentUser.role === 'KETUA SEKSYEN' || currentUser.role === 'PENGARAH')) {
      storageWrapper.get(['stb_filter_pengesyor', 'stb_filter_pelulus']).then(result => {
        if (type !== 'history' && result.stb_filter_pengesyor) {
          filtered = filtered.filter(item => item.pengesyor && item.pengesyor.toUpperCase() === result.stb_filter_pengesyor.toUpperCase());
        }
        if (type === 'history' && result.stb_filter_pelulus) {
          filtered = filtered.filter(item => item.pelulus && item.pelulus.toUpperCase() === result.stb_filter_pelulus.toUpperCase());
        }
        displayFilteredItems(filtered, type);
      });
    } else {
      displayFilteredItems(filtered, type);
    }
    
    updateDraftFilterButtons();
    updateSubmittedFilterButtons();
    updateHistoryFilterButtons();
  }

  function deleteOrClearRecord(item, actionType) {
    if (!item || !item.row) {
      alert("Rekod tidak sah.");
      return;
    }
    
    let message = '';
    let action = '';
    
    if (actionType === 'padam_semua') {
      message = `Anda pasti mahu PADAM KESELURUHAN rekod untuk ${item.syarikat}? Tindakan ini TIDAK BOLEH dibatalkan.`;
      action = 'padam_semua';
    } else if (actionType === 'undo_syor') {
      message = `Anda pasti mahu UNDO syor untuk ${item.syarikat}? Rekod akan kembali ke "Belum Syor".`;
      action = 'undo_syor';
    } else if (actionType === 'undo_lulus') {
      message = `Anda pasti mahu UNDO kelulusan untuk ${item.syarikat}? Rekod akan kembali ke Inbox Pelulus.`;
      action = 'undo_lulus';
    } else {
      message = `Anda pasti mahu KOSONGKAN SYOR untuk ${item.syarikat}?`;
      action = 'padam_syor';
    }
    
    playSoundEffect('minimal alert.mp3');
    
    if (!confirm(message)) return;
    
    simulateLoadingWithSteps(
      ['Menghubungi pangkalan data...', 'Memadam rekod...', 'Menyusun semula senarai...'],
      'Memproses Permintaan'
    );
    
    let payload;
    if (action === 'undo_syor') {
      payload = {
        action: 'updateRecord',
        row: item.row,
        syor_status: '',
        tarikh_syor: '',
        ...item
      };
      payload.syor_status = '';
      payload.tarikh_syor = '';
      delete payload.kelulusan;
      delete payload.tarikh_lulus;
      
    } else if (action === 'undo_lulus') {
      payload = {
        action: 'updateRecord',
        row: item.row,
        kelulusan: '',
        alasan: '',
        tarikh_lulus: '',
        pelulus: '',
        ...item
      };
      payload.kelulusan = '';
      payload.alasan = '';
      payload.tarikh_lulus = '';
      payload.pelulus = '';
      
    } else {
      payload = {
        action: 'deleteRecord',
        row: item.row,
        deleteType: action,
        user: currentUser.name
      };
    }
    
    fetchWithRetry(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    }, 3, 1000)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    })
    .then(result => {
      hideLoading();
      
      if (result.status === 'success') {
        playSoundEffect('minimal alert.mp3');
        alert(result.message);
        
        if (cachedData && cachedData.length > 0) {
          const index = cachedData.findIndex(d => d.row === item.row);
          if (index !== -1) {
            if (action === 'padam_semua') {
              cachedData.splice(index, 1);
            } else if (action === 'undo_syor') {
              cachedData[index].syor_status = '';
              cachedData[index].tarikh_syor = '';
            } else if (action === 'undo_lulus') {
              cachedData[index].kelulusan = '';
              cachedData[index].alasan = '';
              cachedData[index].tarikh_lulus = '';
              cachedData[index].pelulus = '';
            } else if (action === 'padam_syor') {
              cachedData[index].syor_status = '';
              cachedData[index].tarikh_syor = '';
            }
          }
        }
        
        fetchAndRenderList(activeListType);
      } else {
        alert("Ralat: " + (result.message || 'Gagal memproses rekod'));
      }
    })
    .catch(err => {
      console.error("V6.5.1 Delete error:", err);
      hideLoading();
      alert("Gagal memproses rekod: " + err.message);
    });
  }

  function displayFilteredItems(filtered, type) {
    const listId = type === 'history' ? 'historyList' : 'applicationsList';
    const list = document.getElementById(listId);
    if (!list) return;

    if(filtered.length === 0) { 
      list.innerHTML = '<div style="padding:10px; text-align:center; color:#777;">Tiada rekod.</div>'; 
      return; 
    }

    filtered.forEach((item, index) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'app-item-wrapper';
      
      const numberDiv = document.createElement('div');
      numberDiv.className = 'app-item-number';
      numberDiv.textContent = generateUniqueId(item.row) || (index + 1).toString();
      wrapper.appendChild(numberDiv);
      
      const contentDiv = document.createElement('div');
      contentDiv.className = 'app-item-content';
      
      const div = document.createElement('div');
      div.className = 'app-item';
      
      if (item.lawatan_submit_sptb && item.lawatan_syor) {
        div.style.backgroundColor = '#d1fae5';
        div.style.borderLeft = '4px solid #10b981';
      } else if (item.date_submit && type === 'drafts') {
        div.classList.add('blue-bg');
      }
      
      const btnContainer = document.createElement('div');
      btnContainer.className = 'app-actions-btn';
      btnContainer.style.display = 'flex';
      btnContainer.style.gap = '8px';
      btnContainer.style.flexShrink = '0';

      if (type === 'drafts') {
        const btnEdit = document.createElement('button');
        btnEdit.className = 'btn-sm btn-edit';
        btnEdit.innerText = 'Edit';
        btnEdit.onclick = function() { loadRecordToDbOnly(item); }; 
        btnContainer.appendChild(btnEdit);
        
        const btnDelete = document.createElement('button');
        btnDelete.className = 'btn-sm btn-delete-sm';
        btnDelete.innerText = 'Padam';
        btnDelete.style.backgroundColor = '#ef4444';
        btnDelete.onclick = function() { 
          if (confirm("Adakah anda pasti mahu MEMADAM KESELURUHAN rekod permohonan ini dari Sheet? Tindakan ini tidak boleh dibatalkan.")) {
            deleteOrClearRecord(item, 'padam_semua');
          }
        };
        btnContainer.appendChild(btnDelete);
      } else if (type === 'inbox') {
        const btn = document.createElement('button');
        btn.className = 'btn-sm btn-view';
        btn.innerText = 'Proses';
        btn.onclick = function() { loadRecordToPelulus(item); }; 
        btnContainer.appendChild(btn);
      } else if (type === 'submitted') {
        const btnView = document.createElement('button');
        
        if (item.kelulusan) {
          if (item.kelulusan.includes('LULUS')) {
            btnView.className = 'btn-sm btn-view-approved';
          } else if (item.kelulusan.includes('TOLAK') || item.kelulusan.includes('SIASAT')) {
            btnView.className = 'btn-sm btn-view-rejected';
          } else {
            btnView.className = 'btn-sm btn-view-pending';
          }
        } else {
          btnView.className = 'btn-sm btn-view-pending';
        }
        
        btnView.innerText = 'Lihat';
        btnView.onclick = function() { viewRecordOnly(item); }; 
        btnContainer.appendChild(btnView);
        
        if (currentUser.role === 'PENGESYOR') {
          const btnUndo = document.createElement('button');
          btnUndo.className = 'btn-sm';
          btnUndo.innerText = 'Undo';
          btnUndo.style.backgroundColor = '#f59e0b';
          btnUndo.style.color = 'white';
          btnUndo.onclick = function() { 
            deleteOrClearRecord(item, 'undo_syor');
          };
          btnContainer.appendChild(btnUndo);
        }
      } else if (type === 'history') {
        const btn = document.createElement('button');
        
        if (item.kelulusan) {
          if (item.kelulusan.includes('LULUS')) {
            btn.className = 'btn-sm btn-view-approved';
          } else if (item.kelulusan.includes('TOLAK') || item.kelulusan.includes('SIASAT')) {
            btn.className = 'btn-sm btn-view-rejected';
          } else {
            btn.className = 'btn-sm btn-view-pending';
          }
        } else {
          btn.className = 'btn-sm btn-view-pending';
        }
        
        btn.innerText = 'Lihat';
        btn.onclick = function() { viewRecordOnly(item); }; 
        btnContainer.appendChild(btn);
        
        if (currentUser.role === 'PELULUS') {
          const btnUndo = document.createElement('button');
          btnUndo.className = 'btn-sm';
          btnUndo.innerText = 'Undo';
          btnUndo.style.backgroundColor = '#f59e0b';
          btnUndo.style.color = 'white';
          btnUndo.style.marginLeft = '5px';
          btnUndo.onclick = function() { 
            deleteOrClearRecord(item, 'undo_lulus');
          };
          btnContainer.appendChild(btnUndo);
        }
      }

      let jenisBadge = '';
      let perubahanRowHtml = '';
      
      const jenisUpper = item.jenis ? item.jenis.toUpperCase() : '';
      if (jenisUpper === 'BARU') {
        jenisBadge = `<span class="app-type-badge type-baru">BARU</span>`;
      } else if (jenisUpper === 'PEMBAHARUAN') {
        jenisBadge = `<span class="app-type-badge type-pembaharuan">PEMBAHARUAN</span>`;
      } else if (jenisUpper === 'UBAH MAKLUMAT') {
        jenisBadge = `<span class="app-type-badge type-ubah-maklumat">UBAH MAKLUMAT</span>`;
        if (item.ubah_maklumat) {
          perubahanRowHtml = `<div style="background-color:#fffbeb; border-left:3px solid #f59e0b; padding:4px 8px; margin-top:5px; font-size:0.8rem; font-weight:600; color:#d97706;">📝 Perubahan: ${item.ubah_maklumat}</div>`;
        }
      } else if (jenisUpper === 'UBAH GRED') {
        jenisBadge = `<span class="app-type-badge type-ubah-gred">UBAH GRED</span>`;
        if (item.ubah_gred) {
          perubahanRowHtml = `<div style="background-color:#fffbeb; border-left:3px solid #f59e0b; padding:4px 8px; margin-top:5px; font-size:0.8rem; font-weight:600; color:#d97706;">📝 Perubahan Gred: ${item.ubah_gred}</div>`;
        }
      } else {
        jenisBadge = `<span class="app-type-badge">${item.jenis || 'LAIN-LAIN'}</span>`;
      }

      let extraInfo = '';
      if ((currentUser.role === 'PELULUS' || currentUser.role === 'ADMIN' || currentUser.role === 'KETUA SEKSYEN' || currentUser.role === 'PENGARAH') && (type === 'inbox' || type === 'history')) {
        extraInfo = `<div style="font-size:0.75rem; color:#555; margin-top:2px;">Pengesyor: ${item.pengesyor || '-'}</div>`;
      }
      
      if (type === 'history' && item.pelulus) {
        extraInfo += `<div style="font-size:0.75rem; color:#555; margin-top:2px;">Pelulus: ${item.pelulus || '-'}</div>`;
      }

      let dateInfo = '';
      if (item.start_date) {
        const displayDate = formatDateDisplay(item.start_date);
        const dateLabel = 'TARIKH MULA (START DATE)';
        dateInfo = `<div style="font-size:0.75rem; color:#047857; font-weight:600; margin-top:2px;">📅 ${dateLabel}: ${displayDate}</div>`;
      }

      let spiDateInfo = '';
      if (item.date_submit) {
        const spiDate = formatDateDisplay(item.date_submit);
        spiDateInfo = `<div style="font-size:0.75rem; color:#1d4ed8; font-weight:600; margin-top:2px;">📤 Tarikh Hantar SPI: ${spiDate}</div>`;
      }

      let sptbDateInfo = '';
      if (item.lawatan_submit_sptb) {
        const sptbDate = formatDateDisplay(item.lawatan_submit_sptb);
        sptbDateInfo = `<div style="font-size:0.75rem; color:#059669; font-weight:600; margin-top:2px;">📋 Date Submit to SPTB: ${sptbDate}</div>`;
      }

      div.innerHTML = `
        <div class="app-info" style="flex: 1; padding-right: 15px; overflow: hidden;">
          <div class="app-title" style="font-weight:bold; font-size:1.1rem; word-break: break-word; white-space: normal;">${item.syarikat || '-'}</div>
          <div class="app-sub">${item.cidb || '-'} | ${item.gred || '-'} | ${jenisBadge}</div>
          ${dateInfo}
          ${spiDateInfo}
          ${sptbDateInfo}
          ${extraInfo}
          ${perubahanRowHtml}
        </div>
      `;
      
      div.appendChild(btnContainer);
      contentDiv.appendChild(div);
      wrapper.appendChild(contentDiv);
      list.appendChild(wrapper);
    });
  }

  function loadRecordToDbOnly(item) {
    const hasUnsaved = checkUnsavedData();
    if (hasUnsaved) {
      const confirmLoad = confirm("Anda mempunyai data yang belum disimpan. Muatkan rekod ini akan menulis semula borang. Teruskan?");
      if (!confirmLoad) return;
      
      resetFormForEdit();
    }

    if(!confirm("Adakah anda pasti mahu mengedit rekod ini?")) return;

    document.getElementById('db_row_index').value = item.row || '';
    document.getElementById('db_syarikat').value = item.syarikat || '';
    document.getElementById('db_cidb').value = item.cidb || '';
    document.getElementById('db_gred').value = item.gred || '';
    document.getElementById('db_jenis').value = item.jenis || '';
    document.getElementById('db_negeri').value = item.negeri || '';
    document.getElementById('db_tatatertib').value = item.tatatertib || '';
    document.getElementById('db_syor').value = item.syor_lawatan || '';
    document.getElementById('db_pautan').value = item.pautan || '';
    document.getElementById('db_justifikasi').value = item.justifikasi || '';
    document.getElementById('db_syor_status').value = item.syor_status || '';
    
    const ubahMakInput = document.getElementById('input_ubah_maklumat');
    if(ubahMakInput) ubahMakInput.value = item.ubah_maklumat || '';
    const ubahGredInput = document.getElementById('input_ubah_gred');
    if(ubahGredInput) ubahGredInput.value = item.ubah_gred || '';

    const dbPerubahanInput = document.getElementById('db_perubahan_input');
    const dbPerubahanContainer = document.getElementById('db_perubahan_container');
    const dbPerubahanLabel = document.getElementById('db_perubahan_label');
    if (dbPerubahanInput && dbPerubahanContainer && dbPerubahanLabel) {
      if (item.jenis === 'UBAH MAKLUMAT') {
        dbPerubahanContainer.style.display = 'block';
        dbPerubahanLabel.textContent = 'Nyatakan Perubahan Maklumat:';
        dbPerubahanInput.value = item.ubah_maklumat || '';
      } else if (item.jenis === 'UBAH GRED') {
        dbPerubahanContainer.style.display = 'block';
        dbPerubahanLabel.textContent = 'Nyatakan Perubahan Gred:';
        dbPerubahanInput.value = item.ubah_gred || '';
      } else {
        dbPerubahanContainer.style.display = 'none';
        dbPerubahanInput.value = '';
      }
    }
    
    if (item.alamat_perniagaan) {
      const el = document.getElementById('db_alamat_perniagaan');
      if (el) el.value = item.alamat_perniagaan;
    }

    if (item.jenis_konsultansi) {
      document.querySelectorAll('.konsultansi-checkbox').forEach(cb => { cb.checked = false; });
      document.querySelectorAll('.konsultansi-date').forEach(d => { d.value = ''; d.style.display = 'none'; });
      
      const pattern = /(Emel|WhatsApp|Whatsapp|Call),?\s*(\d{1,2}\/\d{1,2}\/\d{4})/gi;
      let match;
      while ((match = pattern.exec(item.jenis_konsultansi)) !== null) {
        let type = match[1].toLowerCase();
        if (type === 'whatsapp') type = 'whatsapp';
        const date = match[2];
        
        const cb = document.getElementById(`cb_konsultansi_${type}`);
        if (cb) {
          cb.checked = true;
          const dateInput = document.getElementById(`date_konsultansi_${type}`);
          if (dateInput) {
            const parts = date.split('/');
            dateInput.value = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            dateInput.style.display = 'block';
          }
        }
      }
    }

    const tarikhSyorInput = document.getElementById('db_tarikh_syor');
    if (tarikhSyorInput && item.tarikh_syor) {
      tarikhSyorInput.value = new Date(item.tarikh_syor).toISOString().split('T')[0];
    }

    if (item.syor_lawatan === 'YA' && dbPautanInput) {
      dbPautanInput.style.backgroundColor = '#fffbeb';
      dbPautanInput.style.borderColor = '#f59e0b';
      dbPautanInput.style.borderWidth = '2px';
    }

    const startDateInput = document.getElementById('db_start_date');
    if (startDateInput && item.start_date) {
      startDateInput.value = new Date(item.start_date).toISOString().split('T')[0];
    }

    const dateMap = {
      'db_tarikh_surat': item.tarikh_surat_terdahulu, 
      'db_submit_date': item.date_submit
    };

    for(let id in dateMap) { 
      const el = document.getElementById(id); 
      if(el && dateMap[id]) {
        try {
          el.value = new Date(dateMap[id]).toISOString().split('T')[0];
        } catch (e) {
          console.error("V6.5.1 Error parsing date:", e);
        }
      }
    }

    if (cbSelesaiLawatan) {
      const hasLawatan = item.lawatan_tarikh || item.lawatan_submit_sptb || item.lawatan_syor;
      cbSelesaiLawatan.checked = hasLawatan ? true : false;
      
      if (containerLawatan) {
        containerLawatan.style.display = hasLawatan ? 'block' : 'none';
      }
      
      if (dbLawatanTarikh && item.lawatan_tarikh) {
        dbLawatanTarikh.value = item.lawatan_tarikh;
      }
      if (dbLawatanSubmitSptb && item.lawatan_submit_sptb) {
        dbLawatanSubmitSptb.value = item.lawatan_submit_sptb;
      }
      if (dbLawatanSyor && item.lawatan_syor) {
        dbLawatanSyor.value = item.lawatan_syor;
      }
    }

    updateValidationCheckboxDisplay();

    switchTab('db');
    saveDatabaseFormData();
    updateOpenDriveButton();
  }

  function loadRecordToPelulus(item) {
    pelulusActiveItem = item;
    savePelulusState(); 
    renderPelulusView(false); 
    switchTab('pelulus-view');
  }

  function viewRecordOnly(item) {
    pelulusActiveItem = item;
    savePelulusState();
    
    renderPelulusView(true); 
    switchTab('pelulus-view');
  }

  function renderPelulusView(readOnly) {
    const c = document.getElementById('pelulus_view_content');
    if (!c) return;

    const i = pelulusActiveItem;
    if (!i) return;

    const safe = (val) => val || '-';
    const formatDate = (d) => d ? formatDateDisplay(d) : '-';

    let link = '-';
    if (i.pautan) {
      link = `<a href="${i.pautan}" target="_blank" style="color:#2563eb; font-weight:bold; text-decoration:none;">BUKA DOKUMEN</a>`;
    }

    let statusBadge = `<span class="status-badge bg-blue">${safe(i.syor_status)}</span>`;
    if(i.syor_status === 'SOKONG') statusBadge = `<span class="status-badge bg-green">SOKONG</span>`;
    else if(i.syor_status === 'TIDAK DISOKONG') statusBadge = `<span class="status-badge bg-red">TIDAK SOKONG</span>`;

    const rowStartDate = i.start_date ? `
      <div class="view-row">
        <span class="view-label">TARIKH MULA (START DATE)</span>
        <span class="view-value">${formatDate(i.start_date)}</span>
      </div>` : '';

    const rowPrevDate = i.tarikh_surat_terdahulu ? `
      <div class="view-row">
        <span class="view-label">TARIKH SURAT TERDAHULU</span>
        <span class="view-value">${formatDate(i.tarikh_surat_terdahulu)}</span>
      </div>` : '';

    c.innerHTML = `
      <div class="view-container">
        <div class="view-section">
          <div class="view-section-header">🏢 MAKLUMAT PERMOHONAN</div>
          <div class="view-grid">
            <div class="view-row full-width">
              <span class="view-label">NAMA SYARIKAT</span>
              <span class="view-value" style="font-size:1.1rem; font-weight:bold;">${safe(i.syarikat)}</span>
            </div>
            <div class="view-row">
              <span class="view-label">NO. CIDB</span>
              <span class="view-value">${safe(i.cidb)}</span>
            </div>
            <div class="view-row">
              <span class="view-label">GRED & JENIS</span>
              <span class="view-value">${safe(i.gred)} (${safe(i.jenis)})</span>
            </div>
            ${rowStartDate}
            ${rowPrevDate}
            <div class="view-row">
              <span class="view-label">NEGERI OPERASI</span>
              <span class="view-value">${safe(i.negeri)}</span>
            </div>
            <div class="view-row full-width">
              <span class="view-label">ALAMAT PERNIAGAAN</span>
              <span class="view-value">${safe(i.alamat_perniagaan)}</span>
            </div>
            <div class="view-row full-width">
              <span class="view-label">JENIS KONSULTANSI</span>
              <span class="view-value">${safe(i.jenis_konsultansi)}</span>
            </div>
            <div class="view-row">
              <span class="view-label">PAUTAN DOKUMEN</span>
              <span class="view-value">${link}</span>
            </div>
          </div>
        </div>

        <div class="view-section">
          <div class="view-section-header">🚧 MAKLUMAT LAWATAN & PEMATUHAN</div>
          <div class="view-grid">
            <div class="view-row">
              <span class="view-label">STATUS LAWATAN</span>
              <span class="view-value">${safe(i.lawatan_status)}</span>
            </div>
            <div class="view-row">
              <span class="view-label">PEGAWAI LAWATAN (PIC)</span>
              <span class="view-value">${safe(i.lawatan_pic)}</span>
            </div>
            <div class="view-row">
              <span class="view-label">TARIKH LAWATAN</span>
              <span class="view-value">${formatDate(i.lawatan_tarikh)}</span>
            </div>
            <div class="view-row">
              <span class="view-label">DATE SUBMIT TO SPTB</span>
              <span class="view-value">${formatDate(i.lawatan_submit_sptb)}</span>
            </div>
            <div class="view-row">
              <span class="view-label">SYOR LAWATAN</span>
              <span class="view-value">${safe(i.lawatan_syor)}</span>
            </div>
          </div>
        </div>

        <div class="view-section">
          <div class="view-section-header">👤 ULASAN PENGESYOR</div>
          <div class="view-grid">
            <div class="view-row full-width">
              <span class="view-label">NAMA PENGESYOR</span>
              <span class="view-value">${safe(i.pengesyor)}</span>
            </div>
            <div class="view-row">
              <span class="view-label">TARIKH SYOR</span>
              <span class="view-value">${formatDate(i.tarikh_syor)}</span>
            </div>
            <div class="view-row">
              <span class="view-label">KEPUTUSAN SYOR</span>
              <span class="view-value">${statusBadge}</span>
            </div>
            <div class="view-row full-width">
              <span class="view-label">JUSTIFIKASI</span>
              <span class="view-value">${safe(i.justifikasi)}</span>
            </div>
          </div>
        </div>

        ${i.tarikh_lulus ? `
        <div class="view-section" style="border-color:#22c55e;">
          <div class="view-section-header" style="background:#f0fdf4; color:#166534;">✅ KEPUTUSAN PELULUS</div>
          <div class="view-grid">
            <div class="view-row full-width">
              <span class="view-label">KEPUTUSAN AKHIR</span>
              <span class="view-value" style="font-weight:bold; color:#15803d;">${safe(i.kelulusan)}</span>
            </div>
            <div class="view-row full-width">
              <span class="view-label">NAMA PELULUS</span>
              <span class="view-value">${safe(i.pelulus)}</span>
            </div>
            <div class="view-row">
              <span class="view-label">TARIKH LULUS</span>
              <span class="view-value">${formatDate(i.tarikh_lulus)}</span>
            </div>
            <div class="view-row">
              <span class="view-label">ALASAN/CATATAN</span>
              <span class="view-value">${safe(i.alasan)}</span>
            </div>
          </div>
        </div>` : ''}
      </div>
    `;

    const btnToApproval = document.getElementById('btnToApproval');
    const btnViewBack = document.getElementById('btnViewBack');
    const btnOpenFull = document.getElementById('openFullBtnPelulus');

    if(readOnly) {
      if(btnToApproval) btnToApproval.style.display = 'none';
      if(btnViewBack) btnViewBack.style.display = 'inline-block';
    } else {
      if(btnToApproval) btnToApproval.style.display = 'inline-block';
      if(btnViewBack) btnViewBack.style.display = 'none';
    }

    if (btnOpenFull) {
        btnOpenFull.style.display = 'inline-block';
    }
  }

  function submitData(payload, successMsg, callback) {
    console.log("V6.5.1 submitData dipanggil dengan payload:", payload);
    
    const statusEl = document.getElementById('statusMsg');
    if(statusEl) statusEl.innerText = "Sedang menghantar...";
    
    if (loadingOverlay) {
      loadingOverlay.style.display = 'flex';
      loadingText.textContent = 'Menghantar data...';
      
      const progressBar = document.getElementById('loading-progress-bar');
      const progressPercent = document.getElementById('loading-progress-percent');
      const progressLabel = document.getElementById('loading-progress-label');
      
      if (progressBar) progressBar.style.width = '0%';
      if (progressPercent) progressPercent.textContent = '0%';
      if (progressLabel) progressLabel.textContent = 'Menyediakan data...';
      
      let currentProgress = 0;
      const progressInterval = setInterval(() => {
        if (currentProgress < 90) {
          currentProgress += 2;
          if (progressBar) progressBar.style.width = `${currentProgress}%`;
          if (progressPercent) progressPercent.textContent = `${currentProgress}%`;
          
          if (progressLabel) {
            if (currentProgress < 30) {
              progressLabel.textContent = 'Menyediakan data...';
            } else if (currentProgress < 60) {
              progressLabel.textContent = 'Menghantar ke pelayan...';
            } else {
              progressLabel.textContent = 'Memproses di pelayan...';
            }
          }
        }
      }, 100);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      fetchWithRetry(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        signal: controller.signal
      }, 3, 1000)
      .then(async response => {
        clearTimeout(timeoutId);
        clearInterval(progressInterval);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        let result;
        try {
          result = JSON.parse(text);
        } catch (e) {
          console.log("V6.5.1 Response is not JSON:", text);
          result = { status: 'success', message: 'Data dihantar (tiada respons JSON)' };
        }
        
        if (progressBar) progressBar.style.width = '100%';
        if (progressPercent) progressPercent.textContent = '100%';
        if (progressLabel) progressLabel.textContent = 'Selesai!';
        
        if(statusEl) { 
          statusEl.innerText = successMsg; 
          statusEl.style.color = "green"; 
          setTimeout(() => statusEl.innerText = "", 3000); 
        }
        
        setTimeout(() => {
          if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
          }
          
          if(callback) callback(result);
        }, 500);
      })
      .catch(err => { 
        clearTimeout(timeoutId);
        clearInterval(progressInterval);
        console.error("V6.5.1 Submit error:", err);
        
        if (progressBar) progressBar.style.width = '100%';
        if (progressPercent) progressPercent.textContent = '100%';
        if (progressLabel) progressLabel.textContent = 'Ralat!';
        if (progressBar) progressBar.style.backgroundColor = '#ef4444';
        
        let errorMsg = "Ralat penghantaran.";
        if (err.name === 'AbortError') {
          errorMsg = "Penghantaran dibatalkan atau timeout. Sila semak sambungan internet.";
        } else if (err.message) {
          errorMsg = err.message;
        }
        
        if(statusEl) statusEl.innerText = errorMsg; 
        
        setTimeout(() => {
          if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
          }
          alert("GAGAL menghantar data: " + errorMsg);
        }, 1000);
      });
    } else {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      fetchWithRetry(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        signal: controller.signal
      }, 3, 1000)
      .then(async response => {
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        let result;
        try {
          result = JSON.parse(text);
        } catch (e) {
          console.log("V6.5.1 Response is not JSON:", text);
          result = { status: 'success', message: 'Data dihantar (tiada respons JSON)' };
        }
        
        if(statusEl) { 
          statusEl.innerText = successMsg; 
          statusEl.style.color = "green"; 
          setTimeout(() => statusEl.innerText = "", 3000); 
        }
        if(callback) callback(result);
      })
      .catch(err => { 
        clearTimeout(timeoutId);
        console.error("V6.5.1 Submit error:", err);
        
        let errorMsg = "Ralat penghantaran.";
        if (err.name === 'AbortError') {
          errorMsg = "Penghantaran dibatalkan atau timeout. Sila semak sambungan internet.";
        } else if (err.message) {
          errorMsg = err.message;
        }
        
        if(statusEl) statusEl.innerText = errorMsg; 
        alert("GAGAL menghantar data: " + errorMsg);
      });
    }
  }

  function updateKonsultansiChart(data) {
    console.log("V6.5.1 updateKonsultansiChart dipanggil dengan data:", data.length);
    
    const canvasId = 'chartKonsultansi';
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    
    dashboardKonsultansiChart = safeDestroyChart(dashboardKonsultansiChart, canvasId);
    
    const counts = { 'Emel': 0, 'WhatsApp': 0, 'Call': 0 };
    
    data.forEach(item => {
      const konsultansi = (item.jenis_konsultansi || '').toLowerCase();
      if (konsultansi.includes('emel')) counts['Emel']++;
      if (konsultansi.includes('whatsapp')) counts['WhatsApp']++;
      if (konsultansi.includes('call') || konsultansi.includes('panggilan')) counts['Call']++;
    });
    
    const labels = Object.keys(counts);
    const values = Object.values(counts);
    
    dashboardKonsultansiChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Jumlah Konsultansi',
          data: values,
          backgroundColor: ['#3b82f6', '#10b981', '#f59e0b']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Statistik Jenis Konsultansi',
            font: {
              size: 14,
              weight: 'bold'
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Bilangan'
            },
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
    
    console.log("V6.5.1 Konsultansi chart updated successfully");
  }

  const btnSendDb = document.getElementById('btnSendToSheet');
  if (btnSendDb) {
    btnSendDb.addEventListener('click', async () => {
      if(!confirm("Adakah anda pasti mahu menghantar/menyimpan data ini?")) return;
      
      let targetRow = document.getElementById('db_row_index')?.value || '';
      let isGapFill = false;

      if (!targetRow && cachedData && cachedData.length > 0) {
        const gapItem = cachedData.find(item => (!item.syarikat || item.syarikat.toString().trim() === ""));
        if (gapItem && gapItem.row) {
          targetRow = gapItem.row;
          isGapFill = true;
        }
      }

      const isConfirmed = dbSahSyor ? dbSahSyor.checked : false;
      
      const isLawatanSelesai = cbSelesaiLawatan ? cbSelesaiLawatan.checked : false;
      const lawatanTarikh = isLawatanSelesai && dbLawatanTarikh ? dbLawatanTarikh.value : '';
      const lawatanSubmitSptb = isLawatanSelesai && dbLawatanSubmitSptb ? dbLawatanSubmitSptb.value : '';
      const lawatanSyor = isLawatanSelesai && dbLawatanSyor ? dbLawatanSyor.value : '';
      
      const dbSyorValue = document.getElementById('db_syor')?.value || '';
      const dbSubmitDateValue = document.getElementById('db_submit_date')?.value || '';
      const dbSyorStatusValue = document.getElementById('db_syor_status')?.value || '';
      const dbStartDateValue = document.getElementById('db_start_date')?.value || document.getElementById('borang_tarikh_mohon')?.value || '';
      
      let confirmHantarEmel = false;
      
      if (dbSyorValue === 'YA' && dbSubmitDateValue && dbSubmitDateValue.trim() !== '') {
        const hasSyorAndConfirmed = (dbSyorStatusValue.trim() !== '') && isConfirmed;
        
        // Buang sekatan isPernahHantarSpi supaya ia sentiasa keluar popup jika belum confirm
        if (!hasSyorAndConfirmed) {
          confirmHantarEmel = confirm("Adakah anda ingin hantar emel syarikat ini ke SPI?");
        }
      }
      
      let jenisKonsultansiParts = [];
      const konsultansiTypes = ['emel', 'whatsapp', 'call'];
      const namaLabel = { 'emel': 'Emel', 'whatsapp': 'WhatsApp', 'call': 'Call' };
      konsultansiTypes.forEach(type => {
        const cb = document.getElementById(`cb_konsultansi_${type}`);
        const dateInput = document.getElementById(`date_konsultansi_${type}`);
        if (cb && cb.checked && dateInput && dateInput.value) {
          const formattedDate = formatDateDisplay(dateInput.value);
          jenisKonsultansiParts.push(`${namaLabel[type]}, ${formattedDate}`);
        }
      });
      const jenisKonsultansiString = jenisKonsultansiParts.join(' - ');
      
      const dbJenisValue = document.getElementById('db_jenis')?.value || '';
      let ubahMaklumatVal = '';
      let ubahGredVal = '';
      const dbPerubahanInputVal = document.getElementById('db_perubahan_input')?.value || '';
      
      if (dbJenisValue === 'UBAH MAKLUMAT') {
        ubahMaklumatVal = dbPerubahanInputVal;
      } else if (dbJenisValue === 'UBAH GRED') {
        ubahGredVal = dbPerubahanInputVal;
      }
      
      const payload = {
        row: targetRow,
        syarikat: document.getElementById('db_syarikat')?.value || '',
        cidb: document.getElementById('db_cidb')?.value || '',
        gred: document.getElementById('db_gred')?.value || '',
        jenis: dbJenisValue,
        negeri: document.getElementById('db_negeri')?.value || '',
        tarikh_surat_terdahulu: document.getElementById('db_tarikh_surat')?.value || '',
        start_date: document.getElementById('db_start_date')?.value || '',
        tatatertib: document.getElementById('db_tatatertib')?.value || '',
        syor_lawatan: dbSyorValue,
        date_submit: dbSubmitDateValue,
        pautan: document.getElementById('db_pautan')?.value || '',
        justifikasi: document.getElementById('db_justifikasi')?.value || '',
        pengesyor: document.getElementById('db_pengesyor')?.value || '',
        createFolder: document.getElementById('cbCreateDriveFolder')?.checked || false,
        lawatan_tarikh: lawatanTarikh,
        lawatan_submit_sptb: lawatanSubmitSptb,
        lawatan_syor: lawatanSyor,
        alamat_perniagaan: document.getElementById('db_alamat_perniagaan')?.value || '',
        jenis_konsultansi: jenisKonsultansiString,
        hantar_emel_spi: confirmHantarEmel,
        ubah_maklumat: ubahMaklumatVal,
        ubah_gred: ubahGredVal
      };
      
      if (isConfirmed) {
        payload.syor_status = document.getElementById('db_syor_status')?.value || 'SOKONG';
        payload.tarikh_syor = new Date().toISOString().split('T')[0];
      } else {
        payload.syor_status = '';
        payload.tarikh_syor = '';
      }
      
      if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
        loadingText.textContent = 'Menghantar data...';
      }

      submitData(payload, "Rekod berjaya disimpan!", async (result) => {
        const message = isConfirmed ? 
          "Data BERJAYA dihantar ke pangkalan data dan telah dipindahkan ke 'Telah Syor'." : 
          "Data BERJAYA disimpan sebagai DRAFT (Belum Syor).";
        
        await playSuccessSound();
        
        const isNotifyWhatsapp = cbNotifyWhatsapp ? cbNotifyWhatsapp.checked : false;
        const selectedPelulus = document.getElementById('db_pelulus_whatsapp') ? document.getElementById('db_pelulus_whatsapp').value : '';
        
        let whatsappUrl = null;
        if (isConfirmed && isNotifyWhatsapp && selectedPelulus.trim() !== '') {
            whatsappUrl = sendWhatsAppNotification(payload.syarikat, payload.cidb, payload.jenis, payload.syor_status, payload.tarikh_syor, selectedPelulus);
        }
        
        if (whatsappUrl) {
            if (confirm(message + "\n\nKlik 'OK' untuk buka dan hantar notifikasi WhatsApp sekarang.")) {
                window.open(whatsappUrl, '_blank');
            }
        } else {
            alert(message);
        }
        
        await resetFormAfterSubmit();
        
        fetchAndRenderList('drafts');
        
        if (loadingOverlay) {
          loadingOverlay.style.display = 'none';
        }
      });
    });
  }

  async function resetFormAfterSubmit() {
    const fieldsToClear = [
      'db_syarikat', 'borang_syarikat', 'borang_cidb', 'db_row_index',
      'db_cidb', 'db_gred', 'db_jenis', 'db_negeri', 'db_tarikh_surat',
      'db_start_date', 'db_tatatertib', 'db_syor', 'db_submit_date',
      'db_pautan', 'db_justifikasi', 'db_syor_status', 'db_tarikh_syor',
      'borang_gred', 'borang_tarikh_mohon', 'borang_tatatertib', 'borang_justifikasi',
      'spkkDuration', 'stbDuration', 'ssm_date_input', 'ssm_status',
      'bank_date_input', 'bank_sign_input', 'bank_status_input',
      'doc_carta_status', 'doc_peta_status', 'doc_gambar_status', 'doc_sewa_status',
      'kwsp_date_1', 'kwsp_s1', 'kwsp_date_2', 'kwsp_s2', 'kwsp_date_3', 'kwsp_s3',
      'input_ubah_maklumat', 'input_ubah_gred',
      'db_lawatan_tarikh', 'db_lawatan_submit_sptb', 'db_lawatan_syor',
      'db_alamat_perniagaan', 'db_perubahan_input'
    ];

    fieldsToClear.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    
    document.querySelectorAll('.konsultansi-checkbox').forEach(cb => { cb.checked = false; });
    document.querySelectorAll('.konsultansi-date').forEach(d => { d.value = ''; d.style.display = 'none'; });
    
    if (cbSelesaiLawatan) cbSelesaiLawatan.checked = false;
    if (containerLawatan) containerLawatan.style.display = 'none';
    
    if (cbNotifyWhatsapp) cbNotifyWhatsapp.checked = false;
    if (pelulusWhatsappContainer) pelulusWhatsappContainer.style.display = 'none';
    if (dbPelulusWhatsapp) dbPelulusWhatsapp.value = '';

    const dbPerubahanContainer = document.getElementById('db_perubahan_container');
    if (dbPerubahanContainer) dbPerubahanContainer.style.display = 'none';

    document.querySelectorAll('input[name="jenisApp"]').forEach(radio => {
      radio.checked = false;
    });

    const ubahMaklumatInput = document.getElementById('input_ubah_maklumat');
    const ubahGredInput = document.getElementById('input_ubah_gred');
    if (ubahMaklumatInput) ubahMaklumatInput.style.display = 'none';
    if (ubahGredInput) ubahGredInput.style.display = 'none';

    const personnelListEl = document.getElementById('personnelList');
    if (personnelListEl) personnelListEl.innerHTML = '';

    addPerson();

    if (dbPautanInput) {
      dbPautanInput.style.backgroundColor = '';
      dbPautanInput.style.borderColor = '';
      dbPautanInput.style.borderWidth = '';
    }

    if (btnSyncToDb) {
      btnSyncToDb.style.display = 'none';
    }

    hasPrinted = false;
    driveFolderCreated = false;
    createdFolderUrl = '';
    userFolderUrl = '';

    if (cbCreateDriveFolder) {
      cbCreateDriveFolder.checked = true;
    }

    if (driveResult) driveResult.innerHTML = '';
    if (driveStatus) {
      driveStatus.style.display = 'none';
    }

    clearPdfData();

    updateOpenDriveButton();

    storageWrapper.set({ 
      'stb_has_printed': false,
      'stb_drive_folder_url': '',
      'stb_user_folder_url': ''
    });

    await storageWrapper.remove([
      'stb_form_data', 
      'stb_form_states',
      'stb_form_persistence',
      'stb_database_persistence'
    ]);

    console.log("V6.5.1 Borang telah direset selepas hantar data.");

    updateValidationCheckboxDisplay();
  }

  const btnPelulusSubmit = document.getElementById('btnPelulusSubmit');
  if (btnPelulusSubmit) {
    btnPelulusSubmit.addEventListener('click', async () => {
      if (pelulusSahLulus && !pelulusSahLulus.checked) {
        alert("Sila tandakan kotak pengesahan!");
        return;
      }
      
      if(!pelulusActiveItem) return;
      
      const tukarSyor = document.getElementById('pelulus_tukar_syor_lawatan')?.value || '';
      const justifikasiPelulus = document.getElementById('pelulus_justifikasi_lawatan')?.value || '';
      const dateSpiPelulus = document.getElementById('pelulus_date_submit_spi')?.value || '';
      
      if (tukarSyor === 'YA' && dateSpiPelulus === '') {
        alert("Sila masukkan Date Submit to SPI jika Syor Lawatan ditukar kepada YA.");
        return;
      }
      
      if(!confirm("Adakah anda pasti dengan keputusan ini?")) return;

      // --- FUNGSI PENGESAHAN EMEL PEMUTIHAN ---
      let confirmSpiPemutihan = false;
      const keputusan = document.getElementById('pelulus_keputusan')?.value || '';
      if (tukarSyor === 'PEMUTIHAN' || pelulusActiveItem.syor_lawatan === 'PEMUTIHAN') {
        if (keputusan) {
          confirmSpiPemutihan = confirm("Adakah anda pasti ingin hantar permohonan ini ke spi?");
        }
      }

      const payload = {
        row: pelulusActiveItem.row || '',
        kelulusan: keputusan,
        alasan: document.getElementById('pelulus_alasan')?.value || '',
        tarikh_lulus: new Date().toISOString().split('T')[0],
        pelulus: currentUser.name || '',
        syor_lawatan_baru: tukarSyor,
        justifikasi_baru: justifikasiPelulus,
        date_submit_baru: dateSpiPelulus,
        hantar_emel_spi_pemutihan: confirmSpiPemutihan // <-- New property
      };
      
      submitData(payload, "Keputusan berjaya dihantar!", async (result) => {
        await playSuccessSound();
        alert("Keputusan pelulus BERJAYA direkodkan.");
        
        if (result.status === 'success') {
          await playSuccessSound();
        }
        
        if (cachedData && cachedData.length > 0) {
          const index = cachedData.findIndex(d => d.row === pelulusActiveItem.row);
          if (index !== -1) {
            cachedData[index].kelulusan = payload.kelulusan;
            cachedData[index].alasan = payload.alasan;
            cachedData[index].tarikh_lulus = payload.tarikh_lulus;
            cachedData[index].pelulus = payload.pelulus;
          }
        }
        
        await storageWrapper.remove([
          'stb_pelulus_state', 
          'stb_drive_folder_url', 
          'stb_user_folder_url'
        ]);
        switchTab('inbox');
      });
    });
  }

  const personnelList = document.getElementById('personnelList');
  const addPersonBtn = document.getElementById('addPersonBtn');

  function addPerson(data=null) {
    if (!personnelList) return;

    const div = document.createElement('div');
    div.className = 'person-card';
    div.innerHTML = `
      <button class="delete-btn" type="button">✕</button>
      <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
        <label>Nama Personel</label>
        <label><input type="checkbox" class="is-company"> Syarikat?</label>
      </div>
      <input type="text" class="p-name" placeholder="NAMA PENUH">
      <div style="margin-top:5px;">
        <label>Jawatan:</label>
        <div style="display:flex; gap:8px;">
        <label><input type="checkbox" value="PENGARAH" class="role-cb"> PENGARAH</label>
        <label><input type="checkbox" value="P.EKUITI" class="role-cb"> P.EKUITI</label>
        <label><input type="checkbox" value="P.SPKK" class="role-cb"> P.SPKK</label>
        <label><input type="checkbox" value="T.T CEK" class="role-cb"> T.T CEK</label>
        </div>
      </div>
      <div style="margin-top:5px; border-top:1px dashed #ccc; padding-top:5px;">
        <div class="grid-equal">
          <div>
            <label>IC</label>
            <div class="status-input-container">
              <input type="text" class="status-ic status-input" maxlength="10" placeholder="-">
            </div>
          </div>
          <div>
            <label>SB</label>
            <div class="status-input-container">
              <input type="text" class="status-sb status-input" maxlength="10" placeholder="-">
            </div>
          </div>
        </div>
        <div class="grid-equal" style="margin-top:5px;">
          <div>
            <label>EPF</label>
            <div class="status-input-container">
              <input type="text" class="status-epf status-input" maxlength="10" placeholder="-">
            </div>
          </div>
        </div>
      </div>
    `;
    personnelList.appendChild(div);

    const docTypes = ['ic', 'sb', 'epf'];
    
    docTypes.forEach(type => {
      const input = div.querySelector(`.status-${type}`);
      if (input) {
        const tickContainer = document.createElement('div');
        tickContainer.className = 'tick-buttons';
        tickContainer.innerHTML = `
          <button type="button" class="tick-btn tick-right" title="Set OK">✓</button>
          <button type="button" class="tick-btn tick-wrong" title="Set X">✗</button>
        `;
        input.parentElement.style.position = 'relative';
        input.parentElement.appendChild(tickContainer);
        
        const tickRightBtn = tickContainer.querySelector('.tick-right');
        const tickWrongBtn = tickContainer.querySelector('.tick-wrong');
        
        if (tickRightBtn) {
          tickRightBtn.addEventListener('click', () => {
            input.value = '✓';
            input.style.backgroundColor = '#dcfce7';
            input.style.color = '#166534';
            input.dispatchEvent(new Event('input'));
            saveFormData();
          });
        }
        
        if (tickWrongBtn) {
          tickWrongBtn.addEventListener('click', () => {
            input.value = 'X';
            input.style.backgroundColor = '#fee2e2';
            input.style.color = '#991b1b';
            input.dispatchEvent(new Event('input'));
            saveFormData();
          });
        }
        
        input.addEventListener('input', saveFormData);
      }
    });

    div.querySelectorAll('.status-input').forEach(input => {
      input.addEventListener('input', (e) => { 
        e.target.value = e.target.value.toUpperCase(); 
        saveFormData();
      });
    });

    const nameInput = div.querySelector('.p-name');
    if (nameInput) {
      nameInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
        saveFormData();
      });
    }

    div.querySelectorAll('.role-cb, .is-company').forEach(cb => {
      cb.addEventListener('change', saveFormData);
    });

    if(data) {
      if (nameInput) nameInput.value = data.name || '';
      
      const isCompanyCheckbox = div.querySelector('.is-company');
      if (isCompanyCheckbox) isCompanyCheckbox.checked = data.isCompany || false;
      
      if(data.roles) {
        div.querySelectorAll('.role-cb').forEach(cb => {
          if(data.roles.includes(cb.value)) cb.checked = true;
        });
      }
      
      const statusIc = div.querySelector('.status-ic');
      const statusSb = div.querySelector('.status-sb');
      const statusEpf = div.querySelector('.status-epf');
      
      if (statusIc && data.s_ic) {
        statusIc.value = data.s_ic;
        if (data.s_ic === '✓') {
          statusIc.style.backgroundColor = '#dcfce7';
          statusIc.style.color = '#166534';
        } else if (data.s_ic === 'X') {
          statusIc.style.backgroundColor = '#fee2e2';
          statusIc.style.color = '#991b1b';
        }
      }
      if (statusSb && data.s_sb) {
        statusSb.value = data.s_sb;
        if (data.s_sb === '✓') {
          statusSb.style.backgroundColor = '#dcfce7';
          statusSb.style.color = '#166534';
        } else if (data.s_sb === 'X') {
          statusSb.style.backgroundColor = '#fee2e2';
          statusSb.style.color = '#991b1b';
        }
      }
      if (statusEpf && data.s_epf) {
        statusEpf.value = data.s_epf;
        if (data.s_epf === '✓') {
          statusEpf.style.backgroundColor = '#dcfce7';
          statusEpf.style.color = '#166534';
        } else if (data.s_epf === 'X') {
          statusEpf.style.backgroundColor = '#fee2e2';
          statusEpf.style.color = '#991b1b';
        }
      }
    }

    const deleteBtn = div.querySelector('.delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => { 
        div.remove(); 
        saveFormData();
      });
    }
  }

  if(addPersonBtn) {
    addPersonBtn.addEventListener('click', () => { 
      addPerson(); 
      saveFormData();
    });
  }

  document.querySelectorAll('.konsultansi-checkbox').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const dateInput = document.getElementById(e.target.id.replace('cb_', 'date_'));
      if (dateInput) {
        if (e.target.checked) {
          dateInput.style.display = 'block';
          if (!dateInput.value) {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            dateInput.value = `${year}-${month}-${day}`;
          }
        } else {
          dateInput.style.display = 'none';
          dateInput.value = '';
        }
      }
      saveDatabaseFormData();
    });
  });

  const btnToggleAlamat = document.getElementById('btnToggleAlamat');
  if (btnToggleAlamat) {
    btnToggleAlamat.addEventListener('click', () => {
      const dbAlamatPerniagaan = document.getElementById('db_alamat_perniagaan');
      if (dbAlamatPerniagaan) {
        if (dbAlamatPerniagaan.style.display === 'none') {
          dbAlamatPerniagaan.style.display = 'block';
          btnToggleAlamat.textContent = 'Sembunyi Alamat';
        } else {
          dbAlamatPerniagaan.style.display = 'none';
          btnToggleAlamat.textContent = 'Tunjuk Alamat';
        }
      }
    });
  }

  function formatKWSP(dateStr, status) {
    if (!dateStr && !status) return '';
    if (!dateStr && status) return `(${status})`;
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length === 2) {
        return `${parts[1]}/${parts[0].slice(-2)} (${status || ''})`;
      }
    }
    return dateStr;
  }

  function formatDateDisplay(isoStr) {
    if(!isoStr) return '';
    if (isoStr.includes('✓')) return isoStr;
    if (isoStr.includes('/')) return isoStr; 

    const d = new Date(isoStr);
    if(isNaN(d)) return isoStr;
    return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
  }

  if (btnPrintAdminStats) {
    btnPrintAdminStats.addEventListener('click', () => {
      showAdminStatsModal();
    });
  }
  
  if (adminStatsClose) {
    adminStatsClose.addEventListener('click', () => {
      adminStatsModal.classList.remove('active');
    });
  }
  
  if (btnPrintStatsModal) {
    btnPrintStatsModal.addEventListener('click', () => {
      window.print();
    });
  }
  
  if (btnAdminCsv) {
    btnAdminCsv.addEventListener('click', downloadAdminStatsCSV);
  }
  
  if (adminFilterMonth) {
    adminFilterMonth.addEventListener('change', () => {
      loadAdminDashboard();
    });
  }
  
  if (adminFilterYear) {
    adminFilterYear.addEventListener('change', () => {
      loadAdminDashboard();
    });
  }
  
  if (adminStatsModal) {
    adminStatsModal.addEventListener('click', (e) => {
      if (e.target === adminStatsModal) {
        adminStatsModal.classList.remove('active');
      }
    });
  }

  const dbSyorStatus = document.getElementById('db_syor_status');
  if (dbSyorStatus) {
    dbSyorStatus.addEventListener('change', (e) => {
      const val = e.target.value;
      if (labelDbSahSyor) {
        if (val !== '') {
          labelDbSahSyor.style.display = 'block';
        } else {
          labelDbSahSyor.style.display = 'none';
          if (dbSahSyor) dbSahSyor.checked = false;
        }
      }
    });
  }

  if (btnPergiCiptaProfile) {
    btnPergiCiptaProfile.addEventListener('click', () => {
      console.log("V6.5.1 btnPergiCiptaProfile clicked - Navigating to Profile tab and copying Drive link");
      
      const dbPautanValue = document.getElementById('db_pautan')?.value || '';
      
      switchTab('profile');
      
      if (dbPautanValue && dbPautanValue.trim() !== '') {
        const profilePautanDriveField = document.getElementById('profile_pautan_drive');
        if (profilePautanDriveField) {
          profilePautanDriveField.value = dbPautanValue;
          console.log("V6.5.1 Drive link copied to profile form:", dbPautanValue);
          
          const successMsg = document.createElement('div');
          successMsg.textContent = '✓ Pautan Drive telah disalin ke borang Profile';
          successMsg.style.cssText = 'position:fixed; bottom:20px; right:20px; background:#10b981; color:white; padding:8px 16px; border-radius:8px; z-index:10000; font-size:0.9rem;';
          document.body.appendChild(successMsg);
          setTimeout(() => successMsg.remove(), 2000);
        } else {
          console.warn("V6.5.1 Profile Drive link input field not found");
        }
      } else {
        console.log("V6.5.1 No Drive link found in Input Database tab");
        const warningMsg = document.createElement('div');
        warningMsg.textContent = '⚠ Tiada pautan Drive di Input Database untuk disalin';
        warningMsg.style.cssText = 'position:fixed; bottom:20px; right:20px; background:#f59e0b; color:white; padding:8px 16px; border-radius:8px; z-index:10000; font-size:0.9rem;';
        document.body.appendChild(warningMsg);
        setTimeout(() => warningMsg.remove(), 2000);
      }
    });
  }

  if (btnDownloadDashboardCsv) {
    btnDownloadDashboardCsv.addEventListener('click', downloadDashboardCSV);
  }

  setTimeout(() => {
    if (isAppReady) {
      initializeTickButtons();
      updateValidationCheckboxDisplay();
      updateDraftFilterButtons();
      updateSubmittedFilterButtons();
      updateHistoryFilterButtons();
      updateMusicButtonState(isMusicPlaying);
      if (bgmVolumeSlider) bgmVolumeSlider.value = bgmVolume;
      if (bgmVolumeValue) bgmVolumeValue.textContent = Math.round(bgmVolume * 100) + '%';
      if (sfxVolumeSlider) sfxVolumeSlider.value = sfxVolume;
      if (sfxVolumeValue) sfxVolumeValue.textContent = Math.round(sfxVolume * 100) + '%';
    }
  }, 1000);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && currentUser && !isRestoring) {
      console.log('V6.5.1 Web App visibility hidden - melakukan auto-save terakhir');
      saveFormData();
      saveDatabaseFormData();
    }
  });

  window.addEventListener('pagehide', () => {
    if (currentUser && !isRestoring) {
      console.log('V6.5.1 Web App pagehide - melakukan auto-save terakhir');
      saveFormData();
      saveDatabaseFormData();
    }
  });

  window.addEventListener('blur', () => {
    if (currentUser && !isRestoring) {
      console.log('V6.5.1 Web App blur - melakukan auto-save terakhir');
      saveFormData();
      saveDatabaseFormData();
    }
  });

});

console.log("STB System V6.5.1 - Web App JS loaded successfully dengan Separated History Search, Dynamic URL Routing, Mobile Menu, Audio Controls & Pemutihan Email Fix");