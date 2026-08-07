'use strict';

const crypto = require('crypto');

function parseCloudinaryUrl(cloudinaryUrl) {
  if (!cloudinaryUrl) {
    throw new Error('CLOUDINARY_URL is not configured');
  }

  const match = String(cloudinaryUrl).match(/^cloudinary:\/\/(.+?):(.+?)@([^/]+)$/);
  if (!match) {
    throw new Error('CLOUDINARY_URL is invalid');
  }

  const [, apiKey, apiSecret, cloudName] = match;
  return { apiKey, apiSecret, cloudName };
}

function signParams(params, apiSecret) {
  const filtered = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  return crypto.createHash('sha1').update(`${filtered}${apiSecret}`).digest('hex');
}

function extractPublicId(imageUrl) {
  if (!imageUrl || !String(imageUrl).includes('/upload/')) {
    return null;
  }

  const withoutQuery = String(imageUrl).split('?')[0];
  const uploadIndex = withoutQuery.indexOf('/upload/');
  if (uploadIndex === -1) {
    return null;
  }

  const pathAfterUpload = withoutQuery.slice(uploadIndex + '/upload/'.length);
  const pathSegments = pathAfterUpload.split('/');
  const fileName = pathSegments[pathSegments.length - 1] || '';
  const withoutExtension = fileName.replace(/\.[^.]+$/, '');
  const directory = pathSegments.slice(0, -1).filter(Boolean).join('/');
  return directory ? `${directory}/${withoutExtension}` : withoutExtension;
}

async function uploadDataUrl(dataUrl, options = {}) {
  if (!dataUrl) {
    throw new Error('Image payload is required');
  }

  const { apiKey, apiSecret, cloudName } = parseCloudinaryUrl(process.env.CLOUDINARY_URL);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = options.folder || 'vfabrica/products';
  const signature = signParams({ folder, timestamp }, apiSecret);

  const formData = new FormData();
  formData.append('file', dataUrl);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp);
  formData.append('folder', folder);
  formData.append('signature', signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || 'Cloudinary upload failed');
  }

  return {
    url: payload.secure_url,
    publicId: payload.public_id,
    raw: payload
  };
}

async function deleteImageByUrl(imageUrl) {
  const publicId = extractPublicId(imageUrl);
  if (!publicId) {
    return { skipped: true };
  }

  const { apiKey, apiSecret, cloudName } = parseCloudinaryUrl(process.env.CLOUDINARY_URL);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = signParams({ public_id: publicId, timestamp }, apiSecret);

  const formData = new FormData();
  formData.append('public_id', publicId);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
    method: 'POST',
    body: formData
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || 'Cloudinary delete failed');
  }

  return payload;
}

module.exports = {
  parseCloudinaryUrl,
  uploadDataUrl,
  deleteImageByUrl,
  extractPublicId
};
