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
 * Uploads an event banner image buffer to Google Drive
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

      const bannerImage = `https://drive.google.com/uc?export=view&id=${fileId}`;

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
  const uploadsDir = path.join(__dirname, '../../images/event-banners');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const ext = path.extname(originalName) || '.jpg';
  const fileName = `banner_${Date.now()}${ext}`;
  const filePath = path.join(uploadsDir, fileName);
  fs.writeFileSync(filePath, fileBuffer);

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

  // If local fallback file ID
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
