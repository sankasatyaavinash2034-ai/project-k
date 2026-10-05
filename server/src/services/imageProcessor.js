import cloudinary from '../config/cloudinary.js';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Validate image file parameters before processing or uploading
 */
export const validateImagePayload = (mimeType, sizeBytes) => {
  if (mimeType && !ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
    return {
      isValid: false,
      message: `Invalid file type '${mimeType}'. Allowed formats: JPG, PNG, WEBP, GIF.`,
    };
  }

  if (sizeBytes && sizeBytes > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (sizeBytes / (1024 * 1024)).toFixed(2);
    return {
      isValid: false,
      message: `File size (${sizeMb} MB) exceeds maximum limit of 5 MB.`,
    };
  }

  return { isValid: true };
};

/**
 * Deterministically process an original image into grid sections.
 * Uses rule-based coordinate calculations and Cloudinary transformation parameters.
 */
export const processGridSections = (imageUrl, gridRows = 3, gridCols = 3) => {
  const sections = [];
  const totalSections = gridRows * gridCols;

  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      const sectionIndex = r * gridCols + c;
      const xPercent = (c / gridCols).toFixed(3);
      const yPercent = (r / gridRows).toFixed(3);
      const wPercent = (1 / gridCols).toFixed(3);
      const hPercent = (1 / gridRows).toFixed(3);

      let sectionUrl = imageUrl;

      // If URL is a Cloudinary asset URL, generate deterministic Cloudinary crop transformation
      if (imageUrl && imageUrl.includes('/upload/')) {
        const cropTransformation = `c_crop,w_${wPercent},h_${hPercent},x_${xPercent},y_${yPercent},fl_relative/`;
        sectionUrl = imageUrl.replace('/upload/', `/upload/${cropTransformation}`);
      } else if (imageUrl) {
        // Fallback for external URLs or Unsplash placeholders
        sectionUrl = `${imageUrl}&slice=${sectionIndex}&r=${r}&c=${c}`;
      }

      sections.push({
        sectionIndex,
        row: r,
        col: c,
        imageUrl: sectionUrl,
      });
    }
  }

  return sections;
};

/**
 * Upload original image to Cloudinary and return asset metadata + generated grid sections
 */
export const uploadAndProcessPuzzleImage = async (imagePayload, gridRows = 3, gridCols = 3) => {
  if (!imagePayload) {
    throw new Error('Image data (base64 string or image URL) is required.');
  }

  const uploadOptions = {
    folder: 'aarohan_puzzles_original',
    resource_type: 'image',
    quality: 'auto',
  };

  const uploadResult = await cloudinary.uploader.upload(imagePayload, uploadOptions);

  const originalUrl = uploadResult.secure_url;
  const sections = processGridSections(originalUrl, gridRows, gridCols);

  return {
    originalUrl,
    publicId: uploadResult.public_id,
    width: uploadResult.width,
    height: uploadResult.height,
    format: uploadResult.format,
    sections,
  };
};
