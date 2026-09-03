const { google } = require('googleapis');
const { Readable } = require('stream');
const fs = require('fs');
const path = require('path');

// Target folder name in Google Drive
const TARGET_FOLDER_NAME = 'Event Banners';

/**
 * Helper to initialize Google Drive Client using Service Account Credentials
 */
function getDriveClient() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    return null; // Return null if credentials are not configured
  }

  // Sanitize private key string formatting
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  const auth = new google.auth.JWT(
    clientEmail,
    null,
    privateKey,
    ['https://www.googleapis.com/auth/drive']
  );

  return google.drive({ version: 'v3', auth });
}

/**
 * Ensures dedicated folder 'Event Banners' exists in Google Drive
 */
async function getOrCreateEventBannersFolder(drive) {
  if (process.env.GOOGLE_DRIVE_FOLDER_ID) {
    return process.env.GOOGLE_DRIVE_FOLDER_ID;
  }

  try {
    const res = await drive.files.list({
      q: `name = '${TARGET_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    if (res.data.files && res.data.files.length > 0) {
      return res.data.files[0].id;
    }

    // Create folder if not existing
    const folderMetadata = {
      name: TARGET_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder'
    };

    const folder = await drive.files.create({
      requestBody: folderMetadata,
      fields: 'id'
    });

    // Make folder publicly accessible
    await drive.permissions.create({
      fileId: folder.data.id,
      requestBody: { role: 'reader', type: 'anyone' }
    });

    return folder.data.id;
  } catch (err) {
    console.error('Error finding/creating Google Drive folder:', err.message);
    throw err;
  }
}

/**
 * Helper to extract Google Drive File ID from any Google Drive link format or raw ID
 */
exports.extractGoogleDriveFileId = function (input) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  // Pattern 1: /file/d/FILE_ID
  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]{15,60})/);
  if (fileDMatch) return fileDMatch[1];

  // Pattern 2: ?id=FILE_ID or &id=FILE_ID
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{15,60})/);
  if (idMatch) return idMatch[1];

  // Pattern 3: /d/FILE_ID
  const dMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]{15,60})/);
  if (dMatch) return dMatch[1];

  // Pattern 4: Raw File ID (15 to 60 characters without slashes or dots)
  if (/^[a-zA-Z0-9_-]{15,60}$/.test(trimmed) && !trimmed.includes('/') && !trimmed.includes('.')) {
    return trimmed;
  }

  return null;
};

/**
 * Converts a Google Drive link or ID into a direct, browser-embeddable image URL
 */
exports.formatGoogleDriveImageUrl = function (urlOrId, preferredFormat = 'lh3') {
  if (!urlOrId || typeof urlOrId !== 'string') return urlOrId;
  const fileId = exports.extractGoogleDriveFileId(urlOrId);
  if (!fileId) return urlOrId;

  if (preferredFormat === 'thumbnail') {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`;
  }
  return `https://lh3.googleusercontent.com/d/${fileId}`;
};

/**
 * Downloads a Google Drive image and caches it locally on the server for ultra-fast serving
 */
exports.downloadGoogleDriveImageLocally = async function (fileId) {
  if (!fileId) return null;

  const frontendDir = path.join(__dirname, '../../frontend/public/images/event-banners');
  const backendDir = path.join(__dirname, '../../images/event-banners');

  for (const dir of [frontendDir, backendDir]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const fileName = `banner_gdrive_${fileId}.jpg`;
  const targetFileFrontend = path.join(frontendDir, fileName);
  const targetFileBackend = path.join(backendDir, fileName);

  if (fs.existsSync(targetFileFrontend)) {
    return {
      success: true,
      bannerImage: `/images/event-banners/${fileName}`,
      fileId: fileId
    };
  }

  const downloadUrls = [
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`,
    `https://lh3.googleusercontent.com/d/${fileId}`,
    `https://drive.google.com/uc?export=download&id=${fileId}`
  ];

  for (const url of downloadUrls) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: AbortSignal.timeout(8000)
      });

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        if (buffer.length > 500) {
          fs.writeFileSync(targetFileFrontend, buffer);
          try { fs.writeFileSync(targetFileBackend, buffer); } catch (e) {}
          return {
            success: true,
            bannerImage: `/images/event-banners/${fileName}`,
            fileId: fileId
          };
        }
      }
    } catch (err) {
      // Try next endpoint
    }
  }

  return null;
};

/**
 * Uploads an event banner image buffer to Google Drive (with local fallback)
 */
exports.uploadBannerToDrive = async (fileBuffer, originalName, mimeType) => {
  const drive = getDriveClient();

  // Real Google Drive API execution path
  if (drive) {
    try {
      const folderId = await getOrCreateEventBannersFolder(drive);
      const stream = Readable.from(fileBuffer);

      const fileMetadata = {
        name: `event_banner_${Date.now()}_${path.extname(originalName) || '.jpg'}`,
        parents: folderId ? [folderId] : []
      };

      const media = {
        mimeType: mimeType || 'image/jpeg',
        body: stream
      };

      const file = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, name, webViewLink, webContentLink'
      });

      const fileId = file.data.id;

      // Set public permissions for the uploaded image
      await drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone'
        }
      });

      const bannerImage = `https://lh3.googleusercontent.com/d/${fileId}`;

      return {
        success: true,
        fileId: fileId,
        bannerImage: bannerImage,
        storageMode: 'GoogleDrive'
      };
    } catch (err) {
      console.error('Google Drive Upload Error:', err);
      throw new Error(`Google Drive API Upload failed: ${err.message}`);
    }
  }

  // Seamless local fallback mode if Google Drive credentials are not yet added in .env
  const frontendDir = path.join(__dirname, '../../frontend/public/images/event-banners');
  const rootUploadsDir = path.join(__dirname, '../../images/event-banners');

  for (const d of [frontendDir, rootUploadsDir]) {
    if (!fs.existsSync(d)) {
      fs.mkdirSync(d, { recursive: true });
    }
  }

  const ext = path.extname(originalName) || '.jpg';
  const fileName = `banner_${Date.now()}${ext}`;

  fs.writeFileSync(path.join(frontendDir, fileName), fileBuffer);
  try {
    fs.writeFileSync(path.join(rootUploadsDir, fileName), fileBuffer);
  } catch (e) {}

  const localFileId = `gdrive_file_${Date.now()}`;
  const directUrl = `/images/event-banners/${fileName}`;

  return {
    success: true,
    fileId: localFileId,
    bannerImage: directUrl,
    storageMode: 'LocalFallback'
  };
};

/**
 * Removes an image file from Google Drive when deleted or replaced
 */
exports.deleteFileFromDrive = async (fileId) => {
  if (!fileId) return;

  if (fileId.startsWith('gdrive_file_')) {
    return;
  }

  const drive = getDriveClient();
  if (drive) {
    try {
      await drive.files.delete({ fileId: fileId });
      console.log(`Successfully deleted file ${fileId} from Google Drive.`);
    } catch (err) {
      console.warn(`Failed to delete Google Drive file ${fileId}:`, err.message);
    }
  }
};

