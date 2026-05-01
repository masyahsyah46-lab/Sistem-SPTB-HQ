// Tentukan nama Tab Sheet anda
const SHEET_NAME = "Sheet1";
const USERS_SHEET_NAME = "Users";
const LOGS_SHEET_NAME = "Logs";

// FOLDER INDUK ID (Folder utama yang mengandungi folder-folder user)
const MAIN_FOLDER_ID = "1-IszGRdSjoJz2oOjUs_KO7HRz7oE2Hzn";
const MAIN_FOLDER_NAME = "STB MAIN FOLDER";

// =========================================================================
// V6.4.8: API KEYS - DIPINDAHKAN KE BACKEND UNTUK KESELAMATAN
// =========================================================================
const DEEPSEEK_API_KEY = "sk-afac9888701c4678a58dfef2d49feb7d";
const GEMINI_API_KEY = "AIzaSyDuwh_qFiE-WeQnJiB1VCXj5mpf7fi96K0";
const OPENROUTER_API_KEY = "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";

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = "openai/gpt-5-mini";

// Role definitions
const ROLE_PENGESYOR = "PENGESYOR";
const ROLE_PELULUS = "PELULUS";
const ROLE_PENGARAH = "PENGARAH";
const ROLE_KETUA_SEKSYEN = "KETUA_SEKSYEN";
const ROLE_ADMIN = "ADMIN";

// Jumlah lajur dalam sheet (A hingga AB = 28 lajur)
const TOTAL_COLUMNS = 28;

// Email recipients for SPI notifications
const EMAIL_TO_SPI = "suhaizal@kuskop.gov.my,hairul.ab@kuskop.gov.my";
const EMAIL_CC_SPTB = "sptb.pkk@kuskop.gov.my";

// Nama penghantar emel
const EMAIL_SENDER_NAME = "Sistem Bersepadu SPTB";

/**
 * Fungsi doGet: Mengendalikan permintaan GET (Membaca Data)
 * DITAMBAH: LockService untuk mengelakkan konflik baca semasa tulis serentak
 */
function doGet(e) {
  const lock = LockService.getScriptLock();
  let locked = false;
  
  try {
    // Tunggu sehingga 15 saat untuk mendapatkan kunci
    lock.waitLock(15000);
    locked = true;
    
    const action = e.parameter ? e.parameter.action : "";
    const role = e.parameter ? e.parameter.role : "";
    const userName = e.parameter ? e.parameter.userName : "";

    let result;
    if (action === "getUsers") {
      result = getUsersData();
    } else if (action === "getStats") {
      result = getStatisticsData(role, userName);
    } else if (action === "getRepeatedApplications") {
      result = getRepeatedApplicationsData();
    } else {
      result = getApplicationsData(role, userName);
    }
    
    return result;
    
  } catch (error) {
    // Jika timeout lock, kembalikan error 503
    if (error.toString().includes('timed out')) {
      return createJSONOutput({ 
        status: "error", 
        code: 503,
        message: "Server sibuk, sila cuba sebentar lagi. (Lock timeout)" 
      });
    }
    return createJSONOutput({ 
      status: "error", 
      message: error.toString() 
    });
  } finally {
    if (locked) {
      lock.releaseLock();
    }
  }
}

/**
 * Fungsi doPost: Mengendalikan permintaan POST (Simpan Data / Cipta Folder / Padam Rekod / Cetak PDF / AI Processing)
 * DITAMBAH: LockService untuk mengelakkan konflik tulis serentak (menyebabkan API 503)
 * DITAMBAH: Handler processAI untuk pemprosesan AI di backend
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  let locked = false;
  
  try {
    // Tunggu sehingga 15 saat untuk mendapatkan kunci
    lock.waitLock(15000);
    locked = true;
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      return createJSONOutput({ status: "error", message: "Sheet not found" });
    }
    
    const data = JSON.parse(e.postData.contents);
    
    // =====================================================================
    // V6.4.8: HANDLER BAHARU UNTUK AI PROCESSING (BACKEND)
    // =====================================================================
    if (data.action === 'processAI') {
      return handleProcessAI(data);
    }
    
    // Handler untuk padam rekod
    if (data.action === 'deleteRecord') {
      return handleDeleteRecord(data, sheet);
    }
    
    // Handler khas: Butang Cipta Folder (Dari Popup)
    if (data.action === 'createDriveFolder') {
      return handleCreateDriveFolderAction(data);
    }
    
    // Handler khas: Log Aktiviti
    if (data.action === 'logActivity') {
      logActivity(data.user, data.actionType, data.description, data.folderId);
      return createJSONOutput({ status: "success", message: "Activity logged" });
    }
    
    // Handler baharu: Cetak dan simpan PDF
    if (data.action === 'cetak_dan_simpan_pdf') {
      return handleCetakDanSimpanPDF(data);
    }
    
    const shouldCreateFolder = data.createFolder === true;
    
    // ============================================================
    // LOGIK UTAMA: EDIT / KEMASKINI ROW (BERDASARKAN PARAMETER row)
    // ============================================================
    if (data.row && parseInt(data.row) > 1) {
      return handleUpdateRecord(data, sheet);
    } 
    // ============================================================
    // LOGIK UTAMA: TAMBAH REKOD BARU (JIKA TIADA data.row)
    // ============================================================
    else {
      return handleInsertNewRecord(data, sheet, shouldCreateFolder);
    }
    
  } catch (error) {
    // Jika timeout lock, kembalikan error 503
    if (error.toString().includes('timed out')) {
      return createJSONOutput({ 
        status: "error", 
        code: 503,
        message: "Server sibuk, sila cuba sebentar lagi. (Lock timeout)" 
      });
    }
    logActivity("System", 'ERROR', `Ralat: ${error.toString()}`, '');
    return createJSONOutput({ status: "error", message: error.toString() });
  } finally {
    if (locked) {
      lock.releaseLock();
    }
  }
}

// =========================================================================
// V6.4.8: FUNGSI HANDLER AI PROCESSING (BACKEND)
// =========================================================================

/**
 * Fungsi handleProcessAI: Mengendalikan permintaan AI processing dari frontend
 * Menerima teks PDF dan jenis prompt (borang/profile), menghantar ke API AI
 * dengan 3-Tier Fallback (DeepSeek -> Gemini -> OpenRouter)
 * @param {Object} data - Data dari frontend { action: 'processAI', type: 'borang'|'profile', text: '...' }
 * @returns {ContentService.TextOutput} - Respons JSON dengan data yang diekstrak
 */
function handleProcessAI(data) {
  try {
    const promptType = data.type || 'borang';
    const pdfText = data.text || '';
    
    if (!pdfText || pdfText.trim() === '') {
      return createJSONOutput({
        success: false,
        error: "Teks PDF kosong. Tiada data untuk diproses."
      });
    }
    
    Logger.log(`[V6.4.8] AI Processing diminta untuk jenis: ${promptType}, panjang teks: ${pdfText.length}`);
    
    // Panggil fungsi processWithAI dengan 3-Tier Fallback
    const result = processWithAI(pdfText, promptType);
    
    if (result.success && result.data) {
      Logger.log(`[V6.4.8] AI Processing berjaya untuk ${promptType}`);
      return createJSONOutput({
        success: true,
        data: result.data,
        provider: result.provider,
        message: `Data berjaya diekstrak menggunakan ${result.provider}`
      });
    } else {
      Logger.log(`[V6.4.8] AI Processing gagal: ${result.error}`);
      return createJSONOutput({
        success: false,
        error: result.error || "Gagal mengekstrak data dari AI",
        provider: result.provider || 'none'
      });
    }
    
  } catch (error) {
    Logger.log(`[V6.4.8] Ralat dalam handleProcessAI: ${error.toString()}`);
    return createJSONOutput({
      success: false,
      error: error.toString()
    });
  }
}

/**
 * Fungsi processWithAI: Memproses teks dengan AI menggunakan 3-Tier Fallback
 * @param {string} pdfText - Teks yang diekstrak dari PDF
 * @param {string} promptType - Jenis prompt: 'borang' atau 'profile'
 * @returns {Object} - { success: boolean, data: Object|null, provider: string, error: string|null }
 */
function processWithAI(pdfText, promptType) {
  const maxTextLength = 30000;
  const truncatedText = pdfText.length > maxTextLength 
    ? pdfText.substring(0, maxTextLength) + "... [text truncated]"
    : pdfText;
  
  // Bina prompt berdasarkan jenis
  let prompt;
  let processResponseFn;
  
  if (promptType === 'profile') {
    prompt = buildProfilePrompt(truncatedText);
    processResponseFn = processProfileResponse;
  } else {
    prompt = buildBorangPrompt(truncatedText);
    processResponseFn = processBorangResponse;
  }
  
  Logger.log(`[V6.4.8] 3-Tier Fallback: Mencuba DeepSeek...`);
  
  // Tier 1: DeepSeek
  try {
    const deepseekResult = callDeepSeekAPI(prompt);
    if (deepseekResult) {
      const processedData = processResponseFn(deepseekResult);
      return { success: true, data: processedData, provider: 'DeepSeek', error: null };
    }
  } catch (error) {
    Logger.log(`[V6.4.8] DeepSeek gagal: ${error.toString()}. Mencuba Gemini...`);
  }
  
  // Tier 2: Gemini (Backup 1)
  try {
    const geminiResult = callGeminiAPI(prompt);
    if (geminiResult) {
      const processedData = processResponseFn(geminiResult);
      return { success: true, data: processedData, provider: 'Gemini', error: null };
    }
  } catch (error) {
    Logger.log(`[V6.4.8] Gemini gagal: ${error.toString()}. Mencuba OpenRouter...`);
  }
  
  // Tier 3: OpenRouter (Backup 2)
  try {
    const openRouterResult = callOpenRouterAPI(prompt);
    if (openRouterResult) {
      const processedData = processResponseFn(openRouterResult);
      return { success: true, data: processedData, provider: 'OpenRouter', error: null };
    }
  } catch (error) {
    Logger.log(`[V6.4.8] OpenRouter gagal: ${error.toString()}. Semua API gagal.`);
  }
  
  // Jika semua gagal
  return { 
    success: false, 
    data: null, 
    provider: 'none', 
    error: "Ketiga-tiga API AI (DeepSeek, Gemini, OpenRouter) gagal memproses teks." 
  };
}

// =========================================================================
// V6.4.8: FUNGSI PEMBINA PROMPT UNTUK AI
// =========================================================================

/**
 * Membina prompt untuk ekstrak data borang dari PDF
 */
function buildBorangPrompt(truncatedText) {
  return `Ekstrak data syarikat dari teks PDF ini ke format JSON SAHAJA. 
    PENTING: 
    1. spkkDuration dan stbDuration MESTI string format "DD/MM/YYYY - DD/MM/YYYY" atau string kosong "" jika tiada.
    2. directors, shareholders, checkSignatories, spkkNominees, phoneNumbers MESTI "Array of Strings" (Senarai Nama/No Telefon Sahaja, BUKAN Object).
    3. phoneNumbers: Ekstrak nombor telefon. PASTIKAN SANGAT KETAT hanya ekstrak nombor telefon pemohon (individu) dan nombor telefon pejabat sahaja. ABAIKAN sebarang nombor faksimili (Fax) atau nombor lain.
    4. grade: Ekstrak Gred syarikat seperti G1, G2, G3, G4, G5, G6, G7. Cari corak seperti "Gred:", "Grade:", "G1", "G2", dsb. JIKA TERDAPAT LEBIH DARIPADA SATU GRED, AMBIL HANYA SATU GRED PERTAMA YANG DIJUMPAI.
    5. alamatPerniagaan: Ekstrak "Alamat Perniagaan Syarikat" atau "Alamat Surat-Menyurat" secara penuh. Jika tidak dijumpai, gunakan string kosong "".
    6. PASTIKAN No. Pendaftaran/CIDB diekstrak dengan 100% TEPAT mengikut format rasmi dari dokumen. Contoh format yang betul: '0120201118-KD061300'. JANGAN mengubah suai, meramal, atau mencipta nombor ini. Cari format yang mempunyai gabungan nombor dan huruf seperti contoh.
    
    Keys: companyName, cidbNumber, grade, spkkDuration (string), stbDuration (string), directors (array of strings), shareholders (array of strings), checkSignatories (array of strings), spkkNominees (array of strings), phoneNumbers (array of strings), alamatPerniagaan (string). 
    Teks PDF: ${truncatedText}`;
}

/**
 * Membina prompt untuk ekstrak data profile dari PDF
 */
function buildProfilePrompt(truncatedText) {
  return `Ekstrak maklumat syarikat dari teks PDF ini ke format JSON SAHAJA. 
    
    PENTING UNTUK ALAMAT: 
    Cari dan ekstrak maklumat alamat. AI PERLU mengenalpasti label alamat utama yang digunakan dalam dokumen. Label alamat utama mungkin berupa 'Alamat Berdaftar', 'Registered Address', 'Alamat Perniagaan', 'Business Address', 'Alamat Surat-menyurat', atau 'Correspondence Address'.
    
    Jika label alamat utama mengandungi perkataan "Perniagaan" atau "Business", maka ia adalah Alamat Perniagaan. Jika label tersebut mengandungi perkataan "Surat-menyurat" atau "Correspondence", maka ia adalah Alamat Surat-menyurat. Jika tidak, ia adalah Alamat Berdaftar.
    
    Ekstrak juga alamat kedua (jika ada) yang mungkin dilabel sebagai 'Alamat Surat-menyurat', 'Correspondence Address', 'Alamat Kiriman'.
    
    PASTIKAN No. Pendaftaran/CIDB diekstrak dengan 100% TEPAT mengikut format rasmi dari dokumen. Contoh format yang betul: '0120201118-KD061300'. JANGAN mengubah suai, meramal, atau mencipta nombor ini. Cari format yang mempunyai gabungan nombor dan huruf seperti contoh.
    
    Keys yang diperlukan:
    - applicantName: Nama pemohon/individu (jika ada)
    - jawatan: Jawatan pemohon (jika ada)
    - icNumber: No Kad Pengenalan pemohon (contoh: 123456-78-9012)
    - phoneNumber: No Telefon pemohon (contoh: 012-3456789)
    - email: Alamat Emel pemohon (contoh: nama@email.com)
    - companyName: Nama Syarikat
    - registrationNumber: No Pendaftaran/CIDB
    - grade: Gred Syarikat (G1, G2, G3, G4, G5, G6, G7)
    - registrationDate: Tarikh Daftar (format: DD/MM/YYYY)
    - jenisPendaftaran: Jenis Pendaftaran (ROC/ROB)
    - alamatUtama: Alamat utama yang diekstrak dari label alamat utama
    - labelAlamatUtama: Label asal alamat utama yang ditemui (contoh: 'Alamat Berdaftar', 'Registered Address', 'Alamat Perniagaan', 'Business Address')
    - alamatSuratMenyurat: Alamat surat-menyurat (jika ada, label seperti 'Alamat Surat-menyurat', 'Correspondence Address', 'Alamat Kiriman')
    - noTelefonSyarikat: No Telefon Syarikat
    - noFax: No Fax Syarikat
    - emailSyarikat: Alamat Emel Syarikat
    - webAddress: Web Address / Laman Web
    
    Jika sesuatu maklumat tidak ditemui, gunakan string kosong "".
    
    Teks PDF: ${truncatedText}`;
}

// =========================================================================
// V6.4.8: FUNGSI PANGGILAN API AI
// =========================================================================

/**
 * Memanggil API DeepSeek
 */
function callDeepSeekAPI(prompt) {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + DEEPSEEK_API_KEY
    },
    payload: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }]
    }),
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(DEEPSEEK_API_URL, options);
  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();
  
  if (responseCode !== 200) {
    throw new Error(`DeepSeek API returned ${responseCode}: ${responseText}`);
  }
  
  const data = JSON.parse(responseText);
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Invalid response from DeepSeek');
  }
  
  return data.choices[0].message.content;
}

/**
 * Memanggil API Gemini
 */
function callGeminiAPI(prompt) {
  const url = `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`;
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    }),
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();
  
  if (responseCode !== 200) {
    throw new Error(`Gemini API returned ${responseCode}: ${responseText}`);
  }
  
  const data = JSON.parse(responseText);
  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || 
      !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
    throw new Error('Invalid response from Gemini');
  }
  
  return data.candidates[0].content.parts[0].text;
}

/**
 * Memanggil API OpenRouter
 */
function callOpenRouterAPI(prompt) {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + OPENROUTER_API_KEY
    },
    payload: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [{ role: 'user', content: prompt }]
    }),
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(OPENROUTER_API_URL, options);
  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();
  
  if (responseCode !== 200) {
    throw new Error(`OpenRouter API returned ${responseCode}: ${responseText}`);
  }
  
  const data = JSON.parse(responseText);
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Invalid response from OpenRouter');
  }
  
  return data.choices[0].message.content;
}

// =========================================================================
// V6.4.8: FUNGSI PEMPROSESAN RESPONS AI
// =========================================================================

/**
 * Memproses respons AI untuk data borang
 */
function processBorangResponse(aiResponse) {
  let cleanedText = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  let jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
  if (jsonMatch) cleanedText = jsonMatch[0];
  
  const aiData = JSON.parse(cleanedText);
  
  const cleanList = (arr) => {
    if (!Array.isArray(arr)) return [];
    return arr.map(item => {
      if (typeof item === 'string') return item.trim();
      if (typeof item === 'object' && item !== null) {
         return item.name || item.nama || Object.values(item)[0] || ""; 
      }
      return String(item);
    }).filter(item => item !== "");
  };
  
  let phoneNumbers = [];
  if (aiData.phoneNumbers && Array.isArray(aiData.phoneNumbers)) {
    phoneNumbers = aiData.phoneNumbers.map(p => String(p).trim()).filter(p => p !== "");
  }
  
  let grade = '';
  if (aiData.grade) {
    let gradeStr = aiData.grade.toString();
    if (gradeStr.includes(',')) {
      grade = gradeStr.split(',')[0].trim();
    } else if (gradeStr.includes(' ')) {
      grade = gradeStr.split(' ')[0].trim();
    } else {
      grade = gradeStr.trim();
    }
    const gradeMatch = grade.match(/\b(G[1-7])\b/i);
    if (gradeMatch) grade = gradeMatch[1].toUpperCase();
  }
  
  const transformedData = {
    companyName: aiData.companyName || '',
    cidbNumber: aiData.cidbNumber || '',
    grade: grade,
    spkkStartDate: '',
    spkkEndDate: '',
    stbStartDate: '',
    stbEndDate: '',
    directors: cleanList(aiData.directors),
    shareholders: cleanList(aiData.shareholders),
    spkkPersons: cleanList(aiData.spkkNominees),
    chequeSignatories: cleanList(aiData.checkSignatories),
    phoneNumbers: phoneNumbers,
    alamatPerniagaan: aiData.alamatPerniagaan || ''
  };
  
  if (aiData.spkkDuration && typeof aiData.spkkDuration === 'string' && aiData.spkkDuration.includes('-')) {
    const parts = aiData.spkkDuration.split('-');
    if (parts.length >= 2) {
      transformedData.spkkStartDate = parts[0].trim();
      transformedData.spkkEndDate = parts[1].trim();
    }
  }
  
  if (aiData.stbDuration && typeof aiData.stbDuration === 'string' && aiData.stbDuration.includes('-')) {
    const parts = aiData.stbDuration.split('-');
    if (parts.length >= 2) {
      transformedData.stbStartDate = parts[0].trim();
      transformedData.stbEndDate = parts[1].trim();
    }
  }
  
  return transformedData;
}

/**
 * Memproses respons AI untuk data profile
 */
function processProfileResponse(aiResponse) {
  let cleanedText = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  let jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
  if (jsonMatch) cleanedText = jsonMatch[0];
  
  const aiData = JSON.parse(cleanedText);
  
  return {
    applicantName: aiData.applicantName || '',
    jawatan: aiData.jawatan || '',
    icNumber: aiData.icNumber || '',
    phoneNumber: aiData.phoneNumber || '',
    email: aiData.email || '',
    companyName: aiData.companyName || '',
    registrationNumber: aiData.registrationNumber || '',
    grade: aiData.grade || '',
    registrationDate: aiData.registrationDate || '',
    jenisPendaftaran: aiData.jenisPendaftaran || '',
    alamatUtama: aiData.alamatUtama || '',
    labelAlamatUtama: aiData.labelAlamatUtama || '',
    alamatSuratMenyurat: aiData.alamatSuratMenyurat || '',
    noTelefonSyarikat: aiData.noTelefonSyarikat || '',
    noFax: aiData.noFax || '',
    emailSyarikat: aiData.emailSyarikat || '',
    webAddress: aiData.webAddress || ''
  };
}

// =========================================================================
// FUNGSI SEDIA ADA (TIDAK BERUBAH)
// =========================================================================

/**
 * FUNGSI BAHARU: sendAutoEmailSPI - Menghantar emel automatik kepada SPI
 * V6.4.1 - Fungsi helper untuk menghantar notifikasi emel dengan UI yang kemas
 * DITAMBAH: Nama penghantar emel ditetapkan sebagai "Sistem STB Bersepadu SPTB"
 * DITAMBAH: Paparan Alamat Perniagaan Syarikat menggantikan Negeri Alamat Operasi
 * DIUBAH: Tarikh Serah SPI digantikan dengan Jenis Permohonan
 * KEMASKINI: Sokongan untuk Pemutihan (subjek dan badan emel akan menunjukkan PEMUTIHAN)
 * @param {Object} data - Objek data yang mengandungi maklumat syarikat
 */
function sendAutoEmailSPI(data) {
  try {
    // Validasi data yang diperlukan
    const syarikat = data.syarikat || 'Tiada';
    const cidb = data.cidb || 'Tiada';
    const gred = data.gred || 'Tiada';
    const alamatPerniagaan = data.alamat_perniagaan || 'Tiada';
    const pengesyor = data.pengesyor || 'Tiada';
    
    // V6.4.1: Gantikan date_submit dengan jenis permohonan
    const jenisPermohonan = data.jenis || 'Tiada';
    
    // Dapatkan justifikasi (utamakan justifikasi_baru, kemudian justifikasi)
    const justifikasi = data.justifikasi_baru || data.justifikasi || 'Tiada justifikasi disediakan';
    
    // Dapatkan pautan dokumen
    const pautan = data.pautan || 'Tiada pautan';
    
    // Semak jika ini adalah permohonan pemutihan
    const isPemutihan = data.syor_lawatan && data.syor_lawatan.toString().toUpperCase() === 'PEMUTIHAN';
    
    // Bina subjek emel
    const subject = isPemutihan 
      ? `Makluman Permohonan Lawatan Premis (PEMUTIHAN) - ${syarikat}`
      : `Makluman Permohonan Lawatan Premis - ${syarikat}`;
    
    // Label tambahan untuk pemutihan dalam badan emel
    const pemutihanLabelHTML = isPemutihan ? '<span class="badge" style="background: #e74c3c; margin-left: 10px;">⚠️ PEMUTIHAN</span>' : '';
    const pemutihanText = isPemutihan ? ' (PEMUTIHAN)' : '';
    const pemutihanNoteHTML = isPemutihan ? '<div style="background: #fdf2f2; border-left: 4px solid #e74c3c; padding: 15px; margin: 15px 0;"><strong>⚠️ NOTIS PENTING:</strong> Permohonan ini adalah <strong>PEMUTIHAN</strong>. Sila beri perhatian sewajarnya.</div>' : '';
    const pemutihanNoteText = isPemutihan ? '\n⚠️ NOTIS PENTING: Permohonan ini adalah PEMUTIHAN. Sila beri perhatian sewajarnya.\n' : '';
    
    // Bina kandungan emel dalam format HTML yang kemas
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a73e8; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; }
    .info-row { display: flex; margin-bottom: 12px; padding: 8px; border-bottom: 1px solid #eee; }
    .info-label { width: 180px; font-weight: bold; color: #555; }
    .info-value { flex: 1; color: #333; }
    .justification-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
    .link-box { background: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 15px 0; }
    .footer { margin-top: 20px; padding-top: 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #ddd; }
    .badge { background: #28a745; color: white; padding: 3px 10px; border-radius: 20px; font-size: 12px; display: inline-block; }
    .gred-badge { background: #6c757d; color: white; padding: 3px 10px; border-radius: 20px; font-size: 12px; display: inline-block; margin-left: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">🔔 MAKLUMAN LAWATAN PREMIS${pemutihanText}</h1>
      <p style="margin: 5px 0 0 0;">Sistem Bersepadu SPTB</p>
    </div>
    
    <div class="content">
      <p>Tuan/Puan,</p>
      
      <p>Dimaklumkan bahawa satu permohonan lawatan telah <strong>DISYORKAN</strong> dan tarikh serahan kepada SPI telah ditetapkan. Butiran adalah seperti berikut:</p>
      
      ${pemutihanNoteHTML}
      
      <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <div class="info-row">
          <div class="info-label">Nama Syarikat:</div>
          <div class="info-value"><strong>${syarikat}</strong>${pemutihanLabelHTML}</div>
        </div>
        
        <div class="info-row">
          <div class="info-label">No. CIDB:</div>
          <div class="info-value"><strong>${cidb}</strong></div>
        </div>
        
        <div class="info-row">
          <div class="info-label">Gred:</div>
          <div class="info-value"><span class="gred-badge">🏗️ ${gred}</span></div>
        </div>
        
        <div class="info-row">
          <div class="info-label">Alamat Perniagaan Syarikat:</div>
          <div class="info-value">📍 ${alamatPerniagaan}</div>
        </div>
        
        <div class="info-row">
          <div class="info-label">Pengesyor:</div>
          <div class="info-value">👤 ${pengesyor}</div>
        </div>
        
        <div class="info-row">
          <div class="info-label">Jenis Permohonan:</div>
          <div class="info-value"><span class="badge">📋 ${jenisPermohonan}</span></div>
        </div>
      </div>
      
      <div class="justification-box">
        <strong>📋 Justifikasi Lawatan:</strong><br>
        ${justifikasi}
      </div>
      
      <div class="link-box">
        <strong>🔗 Pautan Google Drive:</strong><br>
        <a href="${pautan}" style="color: #0056b3; word-break: break-all;">${pautan}</a>
      </div>
      
      <p style="margin-top: 20px;">Sila ambil tindakan sewajarnya. Untuk maklumat lanjut, sila rujuk pautan Google Drive di atas.</p>
      
      <p>Terima kasih.</p>
      
      <p style="margin-top: 20px;">
        <em>*** Emel ini dijana secara automatik oleh Sistem STB. Sila jangan balas emel ini. ***</em>
      </p>
    </div>
    
    <div class="footer">
      <p>Sistem Bersepadu SPTB<br>
      © ${new Date().getFullYear()} PKK. Hak Cipta Terpelihara.</p>
      <p>Dijana pada: ${new Date().toLocaleString('ms-MY')}</p>
    </div>
  </div>
</body>
</html>
    `;
    
    // Versi plain text sebagai fallback
    const plainBody = `
NOTIS LAWATAN SPI - SISTEM STB${pemutihanText}
================================

Dimaklumkan bahawa satu permohonan lawatan telah DISYORKAN dan tarikh serahan kepada SPI telah ditetapkan.
${pemutihanNoteText}
BUTIRAN PERMOHONAN:
-------------------
Nama Syarikat       : ${syarikat}${isPemutihan ? ' [PEMUTIHAN]' : ''}
No. CIDB            : ${cidb}
Gred                : ${gred}
Alamat Perniagaan Syarikat: ${alamatPerniagaan}
Pengesyor           : ${pengesyor}
Jenis Permohonan    : ${jenisPermohonan}${isPemutihan ? ' (PEMUTIHAN)' : ''}

JUSTIFIKASI LAWATAN:
-------------------
${justifikasi}

PAUTAN GOOGLE DRIVE:
-------------------
${pautan}

Sila ambil tindakan sewajarnya.

*** Emel ini dijana secara automatik oleh Sistem STB. Sila jangan balas emel ini. ***
    `;
    
    // Hantar emel dengan nama penghantar yang ditetapkan
    MailApp.sendEmail({
      to: EMAIL_TO_SPI,
      cc: EMAIL_CC_SPTB,
      subject: subject,
      htmlBody: htmlBody,
      body: plainBody,
      name: EMAIL_SENDER_NAME
    });
    
    // Log kejayaan
    logActivity(
      "System", 
      'EMAIL_SENT_SPI', 
      `Emel notifikasi SPI${isPemutihan ? ' (PEMUTIHAN)' : ''} berjaya dihantar untuk ${syarikat} (CIDB: ${cidb}, Pengesyor: ${pengesyor}) dari ${EMAIL_SENDER_NAME}`, 
      ''
    );
    
    console.log(`[V6.4.5] Email SPI${isPemutihan ? ' (PEMUTIHAN)' : ''} berjaya dihantar untuk ${syarikat} dari ${EMAIL_SENDER_NAME}`);
    
    return { success: true, message: "Emel berjaya dihantar" };
    
  } catch (error) {
    // Log ralat
    logActivity(
      "System", 
      'ERROR_EMAIL_SPI', 
      `Gagal menghantar emel SPI: ${error.toString()}`, 
      ''
    );
    
    console.error(`[V6.4.5] Error sending SPI email: ${error.toString()}`);
    
    return { success: false, message: error.toString() };
  }
}

/**
 * FUNGSI BAHARU: Mengendalikan cetakan HTML ke PDF dan simpan ke Drive
 * VERSI V6.4.5 - KEMASKINI STRUKTUR FOLDER: User -> Syarikat -> Jenis-Tarikh
 * DITAMBAH: Warna dinamik dari data.user_color disuntik ke CSS
 * Menerima data.htmlContent sebagai kandungan <body> sahaja (tanpa tag html/body dari frontend)
 */
function handleCetakDanSimpanPDF(data) {
  try {
    // Semak parameter yang diperlukan
    if (!data.htmlContent) {
      return createJSONOutput({
        success: false,
        message: "Kandungan HTML tidak disediakan"
      });
    }
    
    if (!data.company_name) {
      return createJSONOutput({
        success: false,
        message: "Nama syarikat tidak disediakan"
      });
    }
    
    if (!data.user_name) {
      return createJSONOutput({
        success: false,
        message: "Nama pengguna tidak disediakan"
      });
    }
    
    // V6.4.5: appType kini dalam format "JENIS - DD-MM-YYYY"
    const appType = data.application_type || data.subfolder_name;
    if (!appType) {
      return createJSONOutput({
        success: false,
        message: "Jenis permohonan tidak disediakan"
      });
    }
    
    // 1. Dapatkan atau cipta folder syarikat menggunakan logik sedia ada
    let mainFolder;
    try {
      mainFolder = DriveApp.getFolderById(MAIN_FOLDER_ID);
    } catch (e) {
      const folders = DriveApp.getFoldersByName(MAIN_FOLDER_NAME);
      if (folders.hasNext()) {
        mainFolder = folders.next();
      } else {
        mainFolder = DriveApp.createFolder(MAIN_FOLDER_NAME);
      }
    }
    
    // Dapatkan/cipta folder user
    let userFolder = findFolderInParent(mainFolder, data.user_name);
    if (!userFolder) {
      userFolder = mainFolder.createFolder(data.user_name);
    }
    
    // V6.4.5: Cipta/cari companyFolder TERUS di dalam userFolder (TIADA monthYearFolder)
    let companyFolder = findFolderInParent(userFolder, data.company_name);
    if (!companyFolder) {
      companyFolder = userFolder.createFolder(data.company_name);
    }
    
    // V6.4.5: Cipta/cari typeFolder di dalam companyFolder
    // appType sudah dalam format "JENIS - DD-MM-YYYY"
    let typeFolder = findFolderInParent(companyFolder, appType.toUpperCase());
    if (!typeFolder) {
      typeFolder = companyFolder.createFolder(appType.toUpperCase());
    }
    
    // Dapatkan warna dari data.user_color atau gunakan warna lalai
    const themeColor = data.user_color && data.user_color.trim() !== "" 
      ? data.user_color 
      : "#1a73e8"; // Warna lalai biru Google
    
    // 2. Bina struktur HTML yang VALID dan LENGKAP
    const validHtmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    /* Reset dan style asas */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Arial', 'Helvetica', sans-serif;
      background: #fff;
      padding: 20px;
    }
    
    .print-container {
      max-width: 1000px;
      margin: 0 auto;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      overflow: hidden;
    }
    
    /* Warna tema dinamik - Header strip */
    .print-header-strip {
      background: ${themeColor};
      height: 8px;
      width: 100%;
    }
    
    /* Kotak bertema */
    .themed-box {
      background: ${themeColor}15;
      border-left: 4px solid ${themeColor};
      padding: 15px;
      margin: 15px 0;
      border-radius: 4px;
    }
    
    /* Header bertema */
    .themed-header {
      color: ${themeColor};
      border-bottom: 2px solid ${themeColor};
      padding-bottom: 8px;
      margin-bottom: 15px;
    }
    
    /* Style untuk jadual dengan warna tema */
    th {
      background: ${themeColor}20;
      color: #333;
      padding: 10px;
      border: 1px solid #ddd;
      font-weight: bold;
    }
    
    td {
      padding: 8px;
      border: 1px solid #ddd;
    }
    
    /* Header utama */
    .print-header {
      padding: 20px;
      background: #f8f9fa;
      border-bottom: 2px solid ${themeColor};
    }
    
    .print-header h1 {
      color: ${themeColor};
      font-size: 24px;
      margin-bottom: 5px;
    }
    
    .print-header h2 {
      color: ${themeColor};
      font-size: 18px;
      margin-bottom: 5px;
    }
    
    .print-header h3 {
      color: ${themeColor};
      font-size: 16px;
    }
    
    /* Style untuk maklumat */
    .print-content {
      padding: 20px;
    }
    
    .info-row {
      display: flex;
      margin-bottom: 12px;
      padding: 8px;
      border-bottom: 1px solid #eee;
    }
    
    .info-label {
      width: 180px;
      font-weight: bold;
      color: #555;
    }
    
    .info-value {
      flex: 1;
      color: #333;
    }
    
    /* Status badges */
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
    }
    
    .status-sokong {
      background: #d4edda;
      color: #155724;
    }
    
    .status-tidak-sokong {
      background: #f8d7da;
      color: #721c24;
    }
    
    .status-lulus {
      background: #d4edda;
      color: #155724;
    }
    
    .status-tolak {
      background: #f8d7da;
      color: #721c24;
    }
    
    /* Footer */
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      text-align: center;
      font-size: 11px;
      color: #999;
      border-top: 1px solid #eee;
    }
    
    /* Print optimization */
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .print-container {
        border: none;
      }
      .print-header-strip {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      .themed-box {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      th {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="print-container">
    <div class="print-header-strip"></div>
    ${data.htmlContent}
    <div class="footer">
      <p>Dokumen ini telah disahkan dan dicetak pada ${new Date().toLocaleString('ms-MY')}</p>
    </div>
  </div>
</body>
</html>
    `;
    
    const blob = Utilities.newBlob(validHtmlContent, MimeType.HTML).getAs(MimeType.PDF);
    
    // 3. Namakan fail dengan format yang kemas
    const fileName = `Borang_Semakan_${data.company_name}.pdf`;
    blob.setName(fileName);
    
    // 4. V6.4.5: Simpan fail PDF ke dalam typeFolder (bukan companyFolder)
    const pdfFile = typeFolder.createFile(blob);
    
    // 5. Log aktiviti
    logActivity(
      data.user_name, 
      'CETAK_PDF', 
      `PDF Borang Semakan disimpan untuk ${data.company_name} (Warna: ${themeColor})`, 
      typeFolder.getId()
    );
    
    // 6. V6.4.5: Pulangkan respons berjaya dengan folder_url dan folder_id dari typeFolder
    return createJSONOutput({
      success: true,
      folder_url: typeFolder.getUrl(),
      folder_id: typeFolder.getId(),
      file_url: pdfFile.getUrl(),
      file_id: pdfFile.getId(),
      file_name: fileName,
      folder_path: `${MAIN_FOLDER_NAME} > ${data.user_name} > ${data.company_name} > ${appType}`,
      message: "PDF berjaya disimpan dan folder disiapkan"
    });
    
  } catch (error) {
    logActivity("System", 'ERROR_CETAK_PDF', `Ralat mencetak PDF: ${error.toString()}`, '');
    return createJSONOutput({
      success: false,
      message: `Gagal mencetak dan menyimpan PDF: ${error.toString()}`
    });
  }
}

/**
 * FUNGSI BARU: Mengendalikan kemaskini rekod sedia ada
 * Menyokong logik "Undo Syor" dengan mengosongkan field syor_status dan tarikh_syor
 * KEMASKINI V6.4.1: Pastikan alamat_perniagaan (Col U), jenis_konsultansi (Col V) dipetakan dengan betul
 * V6.4.1: Tambah auto-emel untuk kemaskini syor lawatan YA dengan tarikh submit SPI DAN hantar_emel_spi === true
 * DITAMBAH: Hantar property 'jenis' ke fungsi sendAutoEmailSPI
 * V6.4.5: Tambah sokongan untuk ubah_maklumat (index 26) dan ubah_gred (index 27)
 * KEMASKINI: Tambah logik auto-emel untuk PEMUTIHAN
 */
function handleUpdateRecord(data, sheet) {
  try {
    const userName = data.pengesyor || data.pelulus || data.user || "System";
    
    const rowNum = parseInt(data.row);
    
    // Validasi row number
    if (rowNum < 2) {
      return createJSONOutput({ 
        status: "error", 
        message: "Nombor baris tidak sah" 
      });
    }
    
    // Dapatkan data sedia ada untuk baris ini (sebagai rujukan jika diperlukan)
    const existingDataRange = sheet.getRange(rowNum, 1, 1, TOTAL_COLUMNS);
    const existingData = existingDataRange.getValues()[0];
    
    // ============================================================
    // BLOK 1: KEMASKINI DATA PENGESYOR (Lajur A - O)
    // ============================================================
    const rangePengesyor = sheet.getRange(rowNum, 1, 1, 15);
    
    const updatedPengesyor = [
      data.syarikat !== undefined ? data.syarikat : existingData[0],
      data.cidb !== undefined ? data.cidb : existingData[1],
      data.gred !== undefined ? data.gred : existingData[2],
      data.jenis !== undefined ? data.jenis : existingData[3],
      data.negeri !== undefined ? data.negeri : existingData[4],
      data.tarikh_surat_terdahulu !== undefined ? data.tarikh_surat_terdahulu : existingData[5],
      data.tatatertib !== undefined ? data.tatatertib : existingData[6],
      data.start_date !== undefined ? data.start_date : existingData[7],
      data.syor_lawatan_baru !== undefined ? data.syor_lawatan_baru : 
        (data.syor_lawatan !== undefined ? data.syor_lawatan : existingData[8]),
      data.date_submit !== undefined ? data.date_submit : existingData[9],
      (data.pautan && data.pautan.toString().trim() !== "") ? data.pautan : existingData[10],
      data.justifikasi_baru !== undefined ? data.justifikasi_baru : 
        (data.justifikasi !== undefined ? data.justifikasi : existingData[11]),
      data.pengesyor !== undefined ? data.pengesyor : existingData[12],
      data.syor_status !== undefined ? data.syor_status : existingData[13],
      data.tarikh_syor !== undefined ? data.tarikh_syor : existingData[14]
    ];
    
    rangePengesyor.setValues([updatedPengesyor]);
    
    // ============================================================
    // BLOK 2: KEMASKINI DATA LAWATAN (Lajur P - V)
    // V6.4.1: Index 20 (Col U) = alamat_perniagaan, Index 21 (Col V) = jenis_konsultansi
    // ============================================================
    if (data.lawatan_status !== undefined || data.lawatan_pic !== undefined || 
        data.lawatan_tarikh !== undefined || data.lawatan_submit_sptb !== undefined ||
        data.lawatan_syor !== undefined || data.alamat_perniagaan !== undefined ||
        data.jenis_konsultansi !== undefined) {
      
      const rangeLawatan = sheet.getRange(rowNum, 16, 1, 7);
      const currentLawatan = rangeLawatan.getValues()[0];
      
      const updatedLawatan = [
        data.lawatan_status !== undefined ? data.lawatan_status : currentLawatan[0],
        data.lawatan_pic !== undefined ? data.lawatan_pic : currentLawatan[1],
        data.lawatan_tarikh !== undefined ? data.lawatan_tarikh : currentLawatan[2],
        data.lawatan_submit_sptb !== undefined ? data.lawatan_submit_sptb : currentLawatan[3],
        data.lawatan_syor !== undefined ? data.lawatan_syor : currentLawatan[4],
        data.alamat_perniagaan !== undefined ? data.alamat_perniagaan : currentLawatan[5],
        data.jenis_konsultansi !== undefined ? data.jenis_konsultansi : currentLawatan[6]
      ];
      
      rangeLawatan.setValues([updatedLawatan]);
    }
    
    // ============================================================
    // BLOK 3: KEMASKINI DATA PELULUS (Lajur W - Z)
    // ============================================================
    if (data.alasan !== undefined || data.kelulusan !== undefined || 
        data.tarikh_lulus !== undefined || data.pelulus !== undefined) {
      
      const rangePelulus = sheet.getRange(rowNum, 23, 1, 4);
      const currentPelulus = rangePelulus.getValues()[0];
      
      const updatedPelulus = [
        data.alasan !== undefined ? data.alasan : currentPelulus[0],
        data.kelulusan !== undefined ? data.kelulusan : currentPelulus[1],
        data.tarikh_lulus !== undefined ? data.tarikh_lulus : currentPelulus[2],
        data.pelulus !== undefined ? data.pelulus : currentPelulus[3]
      ];
      
      rangePelulus.setValues([updatedPelulus]);
    }
    
    // ============================================================
    // BLOK 4: KEMASKINI DATA UBAH MAKLUMAT & UBAH GRED (Lajur AA - AB) - V6.4.5
    // Memastikan pengisian data dari Tab Input Database adalah konsisten
    // ============================================================
    if (data.ubah_maklumat !== undefined || data.ubah_gred !== undefined) {
      const rangeUbah = sheet.getRange(rowNum, 27, 1, 2);
      const currentUbah = rangeUbah.getValues()[0];
      
      const updatedUbah = [
        data.ubah_maklumat !== undefined ? data.ubah_maklumat : currentUbah[0],
        data.ubah_gred !== undefined ? data.ubah_gred : currentUbah[1]
      ];
      
      rangeUbah.setValues([updatedUbah]);
    }
    
    // V6.4.1: Semak untuk auto-emel SPI dengan syarat hantar_emel_spi === true
    // Tentukan nilai syor_lawatan (gunakan nilai baru jika ada, atau existing)
    let syorLawatanValue;
    if (data.syor_lawatan_baru !== undefined) {
      syorLawatanValue = data.syor_lawatan_baru;
    } else if (data.syor_lawatan !== undefined) {
      syorLawatanValue = data.syor_lawatan;
    } else {
      syorLawatanValue = existingData[8];
    }
    
    // Tentukan nilai date_submit (gunakan nilai baru jika ada, atau existing)
    let dateSubmitValue;
    if (data.date_submit !== undefined) {
      dateSubmitValue = data.date_submit;
    } else {
      dateSubmitValue = existingData[9];
    }
    
    // Semak syarat untuk hantar emel SPI biasa (YA)
    const syorLawatanYA = syorLawatanValue && syorLawatanValue.toString().toUpperCase() === 'YA';
    const dateSubmitExists = dateSubmitValue && dateSubmitValue.toString().trim() !== '';
    const hantarEmelSPI = data.hantar_emel_spi === true;
    
    if (syorLawatanYA && dateSubmitExists && hantarEmelSPI) {
      // Dapatkan alamat perniagaan (gunakan nilai baru jika ada, atau existing)
      let alamatPerniagaanValue;
      if (data.alamat_perniagaan !== undefined) {
        alamatPerniagaanValue = data.alamat_perniagaan;
      } else {
        // Index 20 adalah alamat_perniagaan (lajur U) dalam existingData
        alamatPerniagaanValue = existingData[20];
      }
      
      // Bina objek data lengkap untuk emel
      const emailData = {
        syarikat: data.syarikat !== undefined ? data.syarikat : existingData[0],
        cidb: data.cidb !== undefined ? data.cidb : existingData[1],
        gred: data.gred !== undefined ? data.gred : existingData[2],
        jenis: data.jenis !== undefined ? data.jenis : existingData[3], // V6.4.1: Tambah jenis
        alamat_perniagaan: alamatPerniagaanValue || 'Tiada',
        pengesyor: data.pengesyor !== undefined ? data.pengesyor : existingData[12],
        justifikasi: data.justifikasi_baru !== undefined ? data.justifikasi_baru : 
          (data.justifikasi !== undefined ? data.justifikasi : existingData[11]),
        pautan: (data.pautan && data.pautan.toString().trim() !== "") ? data.pautan : existingData[10],
        date_submit: dateSubmitValue,
        syor_lawatan: syorLawatanValue
      };
      
      // Hantar emel secara asinkron (tidak mengganggu response utama)
      try {
        sendAutoEmailSPI(emailData);
        console.log(`[V6.4.5] SPI email triggered on update for row ${rowNum}: ${emailData.syarikat}`);
      } catch (emailError) {
        console.error(`[V6.4.5] Failed to send SPI email on update: ${emailError.toString()}`);
        // Tidak mengganggu flow utama - teruskan
      }
    }
    
    // KEMASKINI: Logik auto-emel untuk PEMUTIHAN
    // Semak syarat untuk Pemutihan: syor_lawatan === 'PEMUTIHAN' DAN tarikh_lulus wujud DAN hantar_emel_spi_pemutihan === true
    const syorLawatanPemutihan = syorLawatanValue && syorLawatanValue.toString().toUpperCase() === 'PEMUTIHAN';
    const tarikhLulusValue = data.tarikh_lulus !== undefined ? data.tarikh_lulus : existingData[24];
    const tarikhLulusExists = tarikhLulusValue && tarikhLulusValue.toString().trim() !== '';
    const hantarEmelSPIPemutihan = data.hantar_emel_spi_pemutihan === true;
    
    if (syorLawatanPemutihan && tarikhLulusExists && hantarEmelSPIPemutihan) {
      // Dapatkan alamat perniagaan (gunakan nilai baru jika ada, atau existing)
      let alamatPerniagaanValue;
      if (data.alamat_perniagaan !== undefined) {
        alamatPerniagaanValue = data.alamat_perniagaan;
      } else {
        alamatPerniagaanValue = existingData[20];
      }
      
      // Bina objek data lengkap untuk emel Pemutihan
      const emailDataPemutihan = {
        syarikat: data.syarikat !== undefined ? data.syarikat : existingData[0],
        cidb: data.cidb !== undefined ? data.cidb : existingData[1],
        gred: data.gred !== undefined ? data.gred : existingData[2],
        jenis: data.jenis !== undefined ? data.jenis : existingData[3],
        alamat_perniagaan: alamatPerniagaanValue || 'Tiada',
        pengesyor: data.pengesyor !== undefined ? data.pengesyor : existingData[12],
        justifikasi: data.justifikasi_baru !== undefined ? data.justifikasi_baru : 
          (data.justifikasi !== undefined ? data.justifikasi : existingData[11]),
        pautan: (data.pautan && data.pautan.toString().trim() !== "") ? data.pautan : existingData[10],
        date_submit: dateSubmitValue,
        syor_lawatan: syorLawatanValue
      };
      
      // Hantar emel Pemutihan secara asinkron
      try {
        sendAutoEmailSPI(emailDataPemutihan);
        console.log(`[V6.4.5] SPI PEMUTIHAN email triggered on update for row ${rowNum}: ${emailDataPemutihan.syarikat}`);
      } catch (emailError) {
        console.error(`[V6.4.5] Failed to send SPI PEMUTIHAN email on update: ${emailError.toString()}`);
        // Tidak mengganggu flow utama - teruskan
      }
    }
    
    const actionType = (data.syor_status === "" && existingData[13] !== "") ? 'UNDO_RECOMMENDATION' : 'UPDATE_RECORD';
    const actionDesc = actionType === 'UNDO_RECOMMENDATION' 
      ? `Undo syor di baris ${rowNum} untuk ${data.syarikat || existingData[0] || 'syarikat'}`
      : `Rekod dikemaskini di baris ${rowNum} untuk ${data.syarikat || existingData[0] || 'syarikat'}`;
    
    logActivity(userName, actionType, actionDesc, '');

    return createJSONOutput({ 
      status: "success", 
      action: "updated", 
      row: rowNum,
      message: actionType === 'UNDO_RECOMMENDATION' ? "Syor berjaya dibatalkan" : "Rekod berjaya dikemaskini"
    });
    
  } catch (error) {
    logActivity("System", 'ERROR', `Ralat kemaskini rekod: ${error.toString()}`, '');
    return createJSONOutput({ status: "error", message: error.toString() });
  }
}

/**
 * FUNGSI BARU: Mengendalikan penambahan rekod baru
 * V6.4.1: Tambah auto-emel untuk syor lawatan YA dengan tarikh submit SPI DAN hantar_emel_spi === true
 * V6.4.1: Kemaskini pemetaan alamat_perniagaan dan jenis_konsultansi
 * DITAMBAH: Hantar property 'jenis' ke fungsi sendAutoEmailSPI
 * V6.4.5: Tambah sokongan untuk ubah_maklumat (index 26) dan ubah_gred (index 27)
 */
function handleInsertNewRecord(data, sheet, shouldCreateFolder) {
  try {
    const userName = data.pengesyor || data.pelulus || data.user || "System";
    
    const cache = CacheService.getScriptCache();
    let targetRow = cache.get("firstEmptyRow_" + SHEET_NAME);
    
    if (!targetRow) {
      const lastRow = sheet.getLastRow();
      targetRow = 2;
      
      if (lastRow > 1) {
        const columnA = sheet.getRange("A2:A" + lastRow).getValues();
        for (let i = 0; i < columnA.length; i++) {
          if (!columnA[i][0] || columnA[i][0].toString().trim() === "") {
            targetRow = i + 2;
            break;
          }
        }
        if (targetRow === 2) targetRow = lastRow + 1;
      }
    } else {
      targetRow = parseInt(targetRow);
    }
    
    let folderUrl = "";
    let folderId = "";
    
    if (shouldCreateFolder && data.syarikat && data.start_date && data.jenis && data.pengesyor) {
      const folderResult = createUserFolderStructure(
        data.syarikat,
        data.start_date,
        data.jenis,
        data.pengesyor
      );
      
      if (folderResult.success) {
        folderUrl = folderResult.folderUrl;
        folderId = folderResult.folderId;
      }
    }
    
    // V6.4.5: Memastikan pemetaan lajur adalah konsisten
    // Lajur AA (index 26) = ubah_maklumat, Lajur AB (index 27) = ubah_gred
    // Pemetaan ini mengambil kira input yang dihantar dari Tab Input Database
    const newRow = [
      data.syarikat||"", data.cidb||"", data.gred||"", data.jenis||"", 
      data.negeri||"", data.tarikh_surat_terdahulu||"", data.tatatertib||"", 
      data.start_date||"", data.syor_lawatan||"", data.date_submit||"", 
      folderUrl || data.pautan||"", 
      data.justifikasi||"", data.pengesyor||"", 
      data.syor_status||"", data.tarikh_syor||"",
      data.lawatan_status||"", data.lawatan_pic||"", 
      data.lawatan_tarikh||"",        // Lajur R (Index 17)
      data.lawatan_submit_sptb||"",   // Lajur S (Index 18)
      data.lawatan_syor||"",          // Lajur T (Index 19)
      data.alamat_perniagaan||"",     // Lajur U (Index 20) - V6.4.1: Ditukar dari lawatan_tatatertib
      data.jenis_konsultansi||"",     // Lajur V (Index 21) - V6.4.1: Ditukar dari lawatan_ketidakpatuhan
      data.alasan||"", data.kelulusan||"", data.tarikh_lulus||"", data.pelulus||"",
      data.ubah_maklumat||"",         // Lajur AA (Index 26) - V6.4.5: Konsisten dengan Input Database
      data.ubah_gred||""              // Lajur AB (Index 27) - V6.4.5: Konsisten dengan Input Database
    ];
    
    const targetRange = sheet.getRange(targetRow, 1, 1, newRow.length);
    targetRange.setValues([newRow]);
    
    cache.put("firstEmptyRow_" + SHEET_NAME, (targetRow + 1).toString(), 300);
    
    logActivity(
      data.pengesyor || "System", 
      'INSERT_RECORD', 
      `Rekod baharu dimasukkan di baris ${targetRow} untuk ${data.syarikat || 'syarikat'}`, 
      folderId
    );
    
    // V6.4.1: Semak untuk auto-emel SPI dengan syarat hantar_emel_spi === true
    const syorLawatanYA = data.syor_lawatan && data.syor_lawatan.toString().toUpperCase() === 'YA';
    const dateSubmitExists = data.date_submit && data.date_submit.toString().trim() !== '';
    const hantarEmelSPI = data.hantar_emel_spi === true;
    
    if (syorLawatanYA && dateSubmitExists && hantarEmelSPI) {
      // Bina objek data untuk emel
      const emailData = {
        syarikat: data.syarikat || "",
        cidb: data.cidb || "",
        gred: data.gred || "",
        jenis: data.jenis || "", // V6.4.1: Tambah jenis
        alamat_perniagaan: data.alamat_perniagaan || "Tiada",
        pengesyor: data.pengesyor || "",
        justifikasi: data.justifikasi || "",
        pautan: folderUrl || data.pautan || "",
        date_submit: data.date_submit || "",
        syor_lawatan: data.syor_lawatan || ""
      };
      
      // Hantar emel secara asinkron
      try {
        sendAutoEmailSPI(emailData);
        console.log(`[V6.4.5] SPI email triggered on insert for row ${targetRow}: ${emailData.syarikat}`);
      } catch (emailError) {
        console.error(`[V6.4.5] Failed to send SPI email on insert: ${emailError.toString()}`);
      }
    }
    
    const response = {
      status: "success", 
      action: "inserted", 
      row: targetRow,
      message: "Data dimasukkan di baris " + targetRow
    };
    
    if (folderUrl) {
      response.pautan = folderUrl;
      response.folderId = folderId;
    }
    
    return createJSONOutput(response);
    
  } catch (error) {
    logActivity("System", 'ERROR', `Ralat tambah rekod: ${error.toString()}`, '');
    return createJSONOutput({ status: "error", message: error.toString() });
  }
}

/**
 * Fungsi untuk mengendalikan padam rekod
 */
function handleDeleteRecord(data, sheet) {
  try {
    const userName = data.user || "System";
    
    const rowNum = parseInt(data.row);
    const deleteType = data.deleteType;
    
    if (!rowNum || rowNum < 2) {
      return createJSONOutput({ 
        status: "error", 
        message: "Baris tidak sah" 
      });
    }
    
    if (deleteType === 'padam_semua') {
      sheet.deleteRow(rowNum);
      
      logActivity(
        userName, 
        'DELETE_RECORD', 
        `Rekod dipadam sepenuhnya di baris ${rowNum}`, 
        ''
      );
      
      return createJSONOutput({ 
        status: "success", 
        message: "Rekod berjaya dipadam sepenuhnya",
        action: "deleted_full"
      });
      
    } else if (deleteType === 'padam_syor') {
      const rangeToClear = sheet.getRange(rowNum, 13, 1, 3);
      rangeToClear.clearContent();
      
      logActivity(
        userName, 
        'CLEAR_RECOMMENDATION', 
        `Syor dikosongkan di baris ${rowNum}`, 
        ''
      );
      
      return createJSONOutput({ 
        status: "success", 
        message: "Syor berjaya dikosongkan",
        action: "cleared_syor"
      });
    } else {
      return createJSONOutput({ 
        status: "error", 
        message: "Jenis padam tidak sah" 
      });
    }
    
  } catch (error) {
    logActivity("System", 'ERROR', `Ralat padam rekod: ${error.toString()}`, '');
    return createJSONOutput({ 
      status: "error", 
      message: error.toString() 
    });
  }
}

/**
 * Fungsi Khas: Ambil Senarai Users dari Tab 'Users'
 * KEMASKINI V2.2.9: Tambah field imageUrl dari lajur G (index 6)
 */
function getUsersData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(USERS_SHEET_NAME);
  
  if (!sheet) {
    return createJSONOutput([]);
  }

  const data = sheet.getDataRange().getDisplayValues();
  
  if (!data || data.length < 2) {
    return createJSONOutput([]);
  }
  
  const headers = data.shift();
  
  const nameColIndex = headers.findIndex(h => h && h.toString().toUpperCase().includes('NAMA'));
  const pinColIndex = headers.findIndex(h => h && h.toString().toUpperCase().includes('PIN'));
  const roleColIndex = headers.findIndex(h => h && h.toString().toUpperCase().includes('ROLE'));
  const colorColIndex = headers.findIndex(h => h && (h.toString().toUpperCase().includes('WARNA') || h.toString().toUpperCase().includes('COLOR')));
  const phoneColIndex = headers.findIndex(h => h && (h.toString().toUpperCase().includes('TELEFON') || h.toString().toUpperCase().includes('PHONE') || h.toString().toUpperCase().includes('NO TEL')));
  
  const finalNameIndex = nameColIndex !== -1 ? nameColIndex : 0;
  const finalPinIndex = pinColIndex !== -1 ? pinColIndex : 1;
  const finalRoleIndex = roleColIndex !== -1 ? roleColIndex : 2;
  const finalColorIndex = colorColIndex !== -1 ? colorColIndex : 3;
  const finalPhoneIndex = phoneColIndex !== -1 ? phoneColIndex : 5;
  const finalImageIndex = 6;

  const users = data.map(row => {
    const safeGet = (index, defaultValue = '') => {
      return row && row[index] !== undefined && row[index] !== null ? String(row[index]).trim() : defaultValue;
    };
    
    return {
      name: safeGet(finalNameIndex),
      pin: safeGet(finalPinIndex),
      role: safeGet(finalRoleIndex).toUpperCase(),
      color: safeGet(finalColorIndex),
      phone: safeGet(finalPhoneIndex),
      imageUrl: safeGet(finalImageIndex)
    };
  }).filter(user => user.name !== "");

  return createJSONOutput(users);
}

/**
 * Fungsi untuk mendapatkan statistik berdasarkan role
 */
function getStatisticsData(role, userName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) return createJSONOutput({ error: "Sheet not found" });
  
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return createJSONOutput({ total: 0 });
  
  const dataRange = sheet.getRange(2, 1, lastRow - 1, TOTAL_COLUMNS);
  const data = dataRange.getDisplayValues();
  
  let filteredData = data.filter(row => row[0] && row[0].toString().trim() !== "");
  
  if (role === ROLE_PENGESYOR && userName) {
    filteredData = filteredData.filter(row => row[12] && row[12].toString().toUpperCase() === userName.toUpperCase());
  } else if (role === ROLE_PELULUS && userName) {
    filteredData = filteredData.filter(row => row[25] && row[25].toString().toUpperCase() === userName.toUpperCase());
  }
  
  const total = filteredData.length;
  const lulus = filteredData.filter(row => row[23] && row[23].toString().includes('LULUS')).length;
  const tolak = filteredData.filter(row => row[23] && (row[23].toString().includes('TOLAK') || row[23].toString().includes('SIASAT'))).length;
  const proses = total - (lulus + tolak);
  
  const monthlyStats = {};
  const yearStats = {};
  
  filteredData.forEach(row => {
    const startDate = row[7];
    if (startDate) {
      const date = new Date(startDate);
      if (!isNaN(date)) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
        const yearKey = year.toString();
        
        if (!monthlyStats[monthKey]) {
          monthlyStats[monthKey] = { total: 0, lulus: 0, tolak: 0, proses: 0 };
        }
        monthlyStats[monthKey].total++;
        
        if (row[23] && row[23].toString().includes('LULUS')) {
          monthlyStats[monthKey].lulus++;
        } else if (row[23] && (row[23].toString().includes('TOLAK') || row[23].toString().includes('SIASAT'))) {
          monthlyStats[monthKey].tolak++;
        } else {
          monthlyStats[monthKey].proses++;
        }
        
        if (!yearStats[yearKey]) {
          yearStats[yearKey] = { total: 0, lulus: 0, tolak: 0, proses: 0 };
        }
        yearStats[yearKey].total++;
        
        if (row[23] && row[23].toString().includes('LULUS')) {
          yearStats[yearKey].lulus++;
        } else if (row[23] && (row[23].toString().includes('TOLAK') || row[23].toString().includes('SIASAT'))) {
          yearStats[yearKey].tolak++;
        } else {
          yearStats[yearKey].proses++;
        }
      }
    }
  });
  
  let pengesyorStats = {};
  let pelulusStats = {};
  
  if (role === ROLE_ADMIN) {
    filteredData.forEach(row => {
      const pengesyor = row[12] || 'Tiada Pengesyor';
      if (!pengesyorStats[pengesyor]) {
        pengesyorStats[pengesyor] = { total: 0, sokong: 0, tidak_sokong: 0 };
      }
      pengesyorStats[pengesyor].total++;
      
      if (row[13] && row[13].toString().includes('SOKONG') && !row[13].toString().includes('TIDAK')) {
        pengesyorStats[pengesyor].sokong++;
      } else if (row[13] && row[13].toString().includes('TIDAK DISOKONG')) {
        pengesyorStats[pengesyor].tidak_sokong++;
      }
      
      const pelulus = row[25] || 'Tiada Pelulus';
      if (!pelulusStats[pelulus]) {
        pelulusStats[pelulus] = { total: 0, lulus: 0, tolak: 0 };
      }
      pelulusStats[pelulus].total++;
      
      if (row[23] && row[23].toString().includes('LULUS')) {
        pelulusStats[pelulus].lulus++;
      } else if (row[23] && (row[23].toString().includes('TOLAK') || row[23].toString().includes('SIASAT'))) {
        pelulusStats[pelulus].tolak++;
      }
    });
  }
  
  return createJSONOutput({
    total: total,
    lulus: lulus,
    tolak: tolak,
    proses: proses,
    monthlyStats: monthlyStats,
    yearStats: yearStats,
    pengesyorStats: pengesyorStats,
    pelulusStats: pelulusStats
  });
}

/**
 * Fungsi untuk mendapatkan data permohonan berulang (repeated applications)
 */
function getRepeatedApplicationsData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) return createJSONOutput([]);
  
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return createJSONOutput([]);
  
  const dataRange = sheet.getRange(2, 1, lastRow - 1, TOTAL_COLUMNS);
  const data = dataRange.getDisplayValues();
  
  const groupedByCIDB = {};
  
  data.forEach((row, index) => {
    if (!row[0] || row[0].toString().trim() === "") return;
    
    const cidb = row[1] ? row[1].toString().trim() : '';
    if (!cidb) return;
    
    if (!groupedByCIDB[cidb]) {
      groupedByCIDB[cidb] = {
        cidb: cidb,
        syarikat: row[0] || '-',
        rekod: []
      };
    }
    
    groupedByCIDB[cidb].rekod.push({
      row: index + 2,
      syarikat: row[0],
      cidb: row[1],
      gred: row[2],
      jenis: row[3],
      start_date: row[7],
      kelulusan: row[23],
      tarikh_lulus: row[24],
      pelulus: row[25]
    });
  });
  
  const repeatedCompanies = [];
  
  Object.keys(groupedByCIDB).forEach(cidb => {
    const company = groupedByCIDB[cidb];
    if (company.rekod.length > 1) {
      repeatedCompanies.push(company);
    }
  });
  
  repeatedCompanies.sort((a, b) => b.rekod.length - a.rekod.length);
  
  return createJSONOutput(repeatedCompanies);
}

/**
 * FUNGSI UTAMA: Ambil Senarai Permohonan dari 'Sheet1' dengan filter role
 * V6.4.1: Kemaskini pemetaan alamat_perniagaan (index 20) dan jenis_konsultansi (index 21)
 * V6.4.5: Kemaskini filter PELULUS - semua permohonan dengan syor_status tidak kosong (telah disyorkan)
 * V6.4.5: Tambah pemetaan ubah_maklumat (index 26) dan ubah_gred (index 27)
 * KEMASKINI: ROLE_KETUA_SEKSYEN memulangkan SEMUA data (tiada penapisan backend)
 */
function getApplicationsData(role, userName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) return createJSONOutput([]);
  
  const lastRow = sheet.getLastRow();
  
  let firstEmptyRow = 2; 
  
  if (lastRow > 1) {
    const columnA = sheet.getRange("A2:A" + lastRow).getValues();
    for (let i = 0; i < columnA.length; i++) {
      if (!columnA[i][0] || columnA[i][0].toString().trim() === "") {
        firstEmptyRow = i + 2; 
        break;
      }
    }
    if (firstEmptyRow === 2) {
      firstEmptyRow = lastRow + 1;
    }
  }
  
  const cache = CacheService.getScriptCache();
  cache.put("firstEmptyRow_" + SHEET_NAME, firstEmptyRow.toString(), 300);
  
  const dataRange = sheet.getRange(1, 1, lastRow, sheet.getLastColumn());
  const data = dataRange.getDisplayValues();
  const headers = data.shift();
  
  let filteredData = data.filter((row, index) => {
    return row[0] && row[0].toString().trim() !== "";
  });

  if (role === ROLE_PENGESYOR && userName) {
    filteredData = filteredData.filter(row => 
      row[12] && row[12].toString().toUpperCase() === userName.toUpperCase()
    );
  } else if (role === ROLE_PELULUS && userName) {
    // V6.4.5: Pelulus dapat melihat SEMUA permohonan yang telah disyorkan
    // (syor_status tidak kosong) tanpa perlu memeriksa lajur pelulus
    filteredData = filteredData.filter(row => {
      const syorStatus = row[13];
      // Hanya tapis berdasarkan syor_status tidak kosong
      return syorStatus && syorStatus.toString().trim() !== "";
    });
  } else if (role === ROLE_KETUA_SEKSYEN) {
    // ROLE_KETUA_SEKSYEN: Tiada penapisan backend - pulangkan SEMUA data
    // Frontend akan menapis mengikut tab yang diperlukan
  }

  const jsonData = filteredData.map((row, index) => {
    return {
      row: index + 2,
      syarikat: row[0], 
      cidb: row[1], 
      gred: row[2], 
      jenis: row[3],
      negeri: row[4], 
      tarikh_surat_terdahulu: row[5], 
      tatatertib: row[6],
      start_date: row[7], 
      syor_lawatan: row[8], 
      date_submit: row[9],
      pautan: row[10], 
      justifikasi: row[11], 
      pengesyor: row[12],
      syor_status: row[13], 
      tarikh_syor: row[14],
      lawatan_status: row[15], 
      lawatan_pic: row[16], 
      lawatan_tarikh: row[17],
      lawatan_submit_sptb: row[18],
      lawatan_syor: row[19],
      alamat_perniagaan: row[20],
      jenis_konsultansi: row[21],
      alasan: row[22], 
      kelulusan: row[23],
      tarikh_lulus: row[24], 
      pelulus: row[25],
      ubah_maklumat: row[26],
      ubah_gred: row[27]
    };
  });
  
  return createJSONOutput(jsonData);
}

// === HELPER FUNCTIONS ===

function findFolderInParent(parentFolder, folderName) {
  try {
    const folders = parentFolder.getFolders();
    while (folders.hasNext()) {
      const folder = folders.next();
      if (folder.getName() === folderName) {
        return folder;
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

function getMonthName(monthNumber) {
  const monthNames = [
    'JANUARI', 'FEBRUARI', 'MAC', 'APRIL', 'MEI', 'JUN',
    'JULAI', 'OGOS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DISEMBER'
  ];
  return monthNames[monthNumber - 1];
}

function formatDateForFolder(dateString) {
  try {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (error) {
    return new Date().toISOString().split('T')[0].replace(/-/g, '-');
  }
}

function logActivity(user, action, description, folderId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let logSheet = ss.getSheetByName(LOGS_SHEET_NAME);
    if (!logSheet) {
      logSheet = ss.insertSheet(LOGS_SHEET_NAME);
      const headers = [['Timestamp', 'User', 'Action', 'Description', 'Folder ID', 'URL']];
      logSheet.getRange(1, 1, 1, headers[0].length).setValues(headers);
      logSheet.getRange(1, 1, 1, 6).setFontWeight('bold');
      logSheet.setFrozenRows(1);
    }
    const timestamp = new Date();
    const url = folderId ? `https://drive.google.com/drive/folders/${folderId}` : '';
    const newRow = [timestamp, user, action, description, folderId || '', url];
    logSheet.appendRow(newRow);
    
    const lastRow = logSheet.getLastRow();
    if (lastRow > 1001) {
      logSheet.deleteRows(2, lastRow - 1001);
    }
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

function createJSONOutput(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Fungsi untuk cipta folder dalam USER FOLDER SYSTEM
 * V6.4.5 - KEMASKINI STRUKTUR: User -> Syarikat -> Jenis-Tarikh (TIADA bulan/tahun)
 */
function handleCreateDriveFolderAction(data) {
  try {
    // V6.4.5: month_year tidak lagi digunakan
    const companyName = data.company_name;
    const userName = data.user_name;
    const mainFolderId = data.main_folder_id || MAIN_FOLDER_ID;
    
    // V6.4.5: appType dalam format "JENIS - DD-MM-YYYY"
    const appType = data.application_type || data.subfolder_name;
    
    Logger.log(`[V6.4.5] Creating folder for user: ${userName}, company: ${companyName}, type: ${appType}`);
    
    let mainFolder;
    try {
      mainFolder = DriveApp.getFolderById(mainFolderId);
    } catch (e) {
      const folders = DriveApp.getFoldersByName(MAIN_FOLDER_NAME);
      if (folders.hasNext()) {
        mainFolder = folders.next();
      } else {
        mainFolder = DriveApp.createFolder(MAIN_FOLDER_NAME);
        Logger.log(`Created main folder: ${MAIN_FOLDER_NAME}`);
      }
    }
    
    // 1. Cari/cipta folder user
    let userFolder = findFolderInParent(mainFolder, userName);
    if (!userFolder) {
      userFolder = mainFolder.createFolder(userName);
      Logger.log(`Created user folder: ${userName}`);
    }
    
    // 2. V6.4.5: Cari/cipta folder syarikat TERUS di dalam userFolder
    let companyFolder = findFolderInParent(userFolder, companyName);
    if (!companyFolder) {
      companyFolder = userFolder.createFolder(companyName);
      Logger.log(`Created company folder: ${companyName} inside ${userName}`);
    }
    
    // 3. V6.4.5: Cari/cipta folder jenis-tarikh di dalam companyFolder
    let typeFolder = findFolderInParent(companyFolder, appType);
    if (!typeFolder) {
      typeFolder = companyFolder.createFolder(appType);
      Logger.log(`Created type folder: ${appType} inside ${companyName}`);
    }
    
    logActivity(userName, 'CREATE_FOLDER_USER', 
                `Folder dicipta (V6.4.5): ${companyName} > ${appType}`, 
                typeFolder.getId());
    
    // V6.4.5: Pulangkan URL typeFolder (bukan companyFolder)
    return createJSONOutput({
      success: true,
      folder_url: typeFolder.getUrl(),
      folder_id: typeFolder.getId(),
      folder_path: `${MAIN_FOLDER_NAME} > ${userName} > ${companyName} > ${appType}`,
      user_folder_url: userFolder.getUrl(),
      message: `Folder berjaya dicipta dalam sistem Folder User (V6.4.5)`
    });
    
  } catch (err) {
    Logger.error(`Error creating user folder: ${err.toString()}`);
    return createJSONOutput({
      success: false,
      message: `Gagal mencipta folder: ${err.toString()}`
    });
  }
}

/**
 * Fungsi untuk cipta folder structure dalam User Folder (untuk auto-create semasa save)
 * V6.4.5 - KEMASKINI STRUKTUR: User -> Syarikat -> Jenis-Tarikh (TIADA bulan/tahun)
 */
function createUserFolderStructure(syarikat, startDate, jenisPermohonan, pengesyor) {
  try {
    const dateObj = new Date(startDate);
    const formattedDate = formatDateForFolder(startDate);
    
    // V6.4.5: Nama folder jenis permohonan = "JENIS - DD-MM-YYYY"
    const typeFolderName = `${jenisPermohonan.toUpperCase()} - ${formattedDate}`;
    
    // V6.4.5: Nama folder syarikat = nama syarikat SAHAJA (tanpa tarikh)
    const companyFolderName = syarikat.toUpperCase();
    
    let mainFolder;
    try {
      mainFolder = DriveApp.getFolderById(MAIN_FOLDER_ID);
    } catch (e) {
      const folders = DriveApp.getFoldersByName(MAIN_FOLDER_NAME);
      if (folders.hasNext()) {
        mainFolder = folders.next();
      } else {
        mainFolder = DriveApp.createFolder(MAIN_FOLDER_NAME);
      }
    }
    
    // 1. Cari/cipta folder user
    let userFolder = findFolderInParent(mainFolder, pengesyor);
    if (!userFolder) {
      userFolder = mainFolder.createFolder(pengesyor);
    }
    
    // 2. V6.4.5: Cari/cipta folder syarikat TERUS di dalam userFolder
    let companyFolder = findFolderInParent(userFolder, companyFolderName);
    if (!companyFolder) {
      companyFolder = userFolder.createFolder(companyFolderName);
    }
    
    // 3. V6.4.5: Cari/cipta folder jenis-tarikh di dalam companyFolder
    let typeFolder = findFolderInParent(companyFolder, typeFolderName);
    if (!typeFolder) {
      typeFolder = companyFolder.createFolder(typeFolderName);
    }
    
    logActivity(pengesyor, 'AUTO_CREATE_USER_FOLDER', 
                `Folder auto-dicipta (V6.4.5): ${companyFolderName} > ${typeFolderName}`, 
                typeFolder.getId());
    
    // V6.4.5: Pulangkan URL typeFolder
    return {
      success: true,
      folderUrl: typeFolder.getUrl(),
      userFolderUrl: userFolder.getUrl(),
      folderId: typeFolder.getId(),
      folderName: typeFolderName
    };
    
  } catch (error) {
    Logger.error(`Error in createUserFolderStructure: ${error.toString()}`);
    return {
      success: false,
      error: error.toString()
    };
  }
}

// Fungsi-fungsi test
function testUserFolder() {
  const result = handleCreateDriveFolderAction({
    application_type: "BARU - 21-04-2026",
    company_name: "SYARIKAT TEST",
    user_name: "Zariff Fahmi",
    main_folder_id: MAIN_FOLDER_ID
  });
  
  console.log(JSON.stringify(result));
  return result;
}

function testGetRepeatedApplications() {
  const result = getRepeatedApplicationsData();
  const parsed = JSON.parse(result.getContent());
  console.log(`Found ${parsed.length} companies with repeated applications`);
  return result;
}

function testGetStatistics() {
  const result = getStatisticsData(ROLE_PENGARAH, "");
  console.log(JSON.stringify(result));
  return result;
}

function testDeleteRecord() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  const testData = {
    action: 'deleteRecord',
    row: 2,
    deleteType: 'padam_syor',
    user: 'Test User'
  };
  
  const result = handleDeleteRecord(testData, sheet);
  console.log(JSON.stringify(result));
  return result;
}

function testCetakDanSimpanPDF() {
  const testData = {
    action: 'cetak_dan_simpan_pdf',
    htmlContent: '<div class="print-header"><h1>Borang Semakan</h1><p>Ini adalah kandungan ujian.</p></div>',
    company_name: 'SYARIKAT TEST',
    user_name: 'Zariff Fahmi',
    application_type: 'BARU - 21-04-2026',
    user_color: '#ff6b35'
  };
  
  const result = handleCetakDanSimpanPDF(testData);
  console.log(JSON.stringify(result));
  return result;
}

// =========================================================================
// V6.4.8: FUNGSI UJIAN UNTUK AI PROCESSING
// =========================================================================

/**
 * Fungsi untuk menguji AI Processing dengan teks ujian
 */
function testProcessAI() {
  const testText = "SYARIKAT ABC SDN BHD (0120201118-KD061300)\nGred: G7\nAlamat: No. 123, Jalan Test, Kuala Lumpur";
  
  const testData = {
    action: 'processAI',
    type: 'borang',
    text: testText
  };
  
  const result = handleProcessAI(testData);
  console.log("Test AI Processing Result:");
  console.log(result.getContent());
  return result;
}

/**
 * Fungsi UJIAN PERMISI (V6.4.5)
 * Fungsi untuk menguji dan membenarkan skop penghantaran emel
 * Jalankan fungsi ini sekali di Apps Script editor untuk mendapatkan kebenaran MailApp
 */
function testSendEmailPermission() {
  try {
    const userEmail = Session.getActiveUser().getEmail();
    MailApp.sendEmail({
      to: userEmail,
      subject: "Test Permission V6.4.5",
      body: "Test sahaja.",
      name: EMAIL_SENDER_NAME
    });
    
    console.log(`[V6.4.5] Test email sent successfully to: ${userEmail} from ${EMAIL_SENDER_NAME}`);
    logActivity("System", "TEST_EMAIL_PERMISSION", `Ujian kebenaran emel berjaya - dihantar ke ${userEmail} dari ${EMAIL_SENDER_NAME}`, "");
    
    return createJSONOutput({
      success: true,
      message: `Emel ujian berjaya dihantar ke ${userEmail} dari ${EMAIL_SENDER_NAME}. Kebenaran MailApp telah diberikan.`
    });
  } catch (error) {
    console.error(`[V6.4.5] Test email failed: ${error.toString()}`);
    logActivity("System", "ERROR_TEST_EMAIL", `Ujian kebenaran emel gagal: ${error.toString()}`, "");
    
    return createJSONOutput({
      success: false,
      message: `Gagal menghantar emel ujian: ${error.toString()}. Sila pastikan skop MailApp dibenarkan.`
    });
  }
}

/**
 * FUNGSI UJIAN SPI EMAIL (V6.4.5)
 * Fungsi untuk menguji penghantaran emel SPI secara manual
 */
function testSendSPIEmail() {
  const testData = {
    syarikat: "SYARIKAT UJIAN SDN BHD",
    cidb: "CIDB12345678",
    gred: "G7",
    jenis: "BARU",
    alamat_perniagaan: "No. 123, Jalan Test, Taman Ujian, 50000 Kuala Lumpur",
    pengesyor: "Ahmad bin Abdullah",
    justifikasi: "Ini adalah justifikasi ujian untuk lawatan tapak. Pemeriksaan tapak diperlukan untuk pengesahan status projek.",
    pautan: "https://drive.google.com/drive/folders/test123",
    date_submit: "25-04-2026"
  };
  
  const result = sendAutoEmailSPI(testData);
  console.log(JSON.stringify(result));
  return result;
}