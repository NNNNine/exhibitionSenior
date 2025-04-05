import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

/**
 * Process uploaded artwork image - creates thumbnail and optimizes original
 * @param file Uploaded file from multer
 * @returns Object containing paths to original and thumbnail files
 */
export const processArtworkImage = async (file: Express.Multer.File) => {
  const uploadDir = path.join(__dirname, '../../uploads');
  
  // Ensure upload directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  // Generate paths
  const filename = path.basename(file.path);
  const thumbnailFilename = `thumb_${filename}`;
  const optimizedFilename = `opt_${filename}`;
  
  const originalPath = file.path;
  const thumbnailPath = path.join(uploadDir, thumbnailFilename);
  const optimizedPath = path.join(uploadDir, optimizedFilename);
  
  // Create thumbnail (300x300, maintaining aspect ratio)
  await sharp(originalPath)
    .resize(300, 300, { 
      fit: 'inside',
      withoutEnlargement: true
    })
    .jpeg({ quality: 80 })
    .toFile(thumbnailPath);
  
  // Create optimized version of original
  await sharp(originalPath)
    .jpeg({ quality: 85 })
    .toFile(optimizedPath);
  
  // Replace original with optimized version
  fs.unlinkSync(originalPath);
  fs.renameSync(optimizedPath, originalPath);
  
  return {
    originalPath,
    thumbnailPath
  };
};

/**
 * Delete file if it exists
 * @param filePath Path to file
 */
export const deleteFileIfExists = (filePath: string) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

/**
 * Generate a properly formatted URL for file path
 * @param filePath Local file path
 * @returns URL path for client access
 */
export const generateFileUrl = (filePath: string) => {
  // Convert absolute path to relative URL
  const relativePath = filePath.replace(path.join(__dirname, '../../'), '');
  return relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
};