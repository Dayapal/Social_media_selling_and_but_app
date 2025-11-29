import multer from "multer";

const storage = multer.memoryStorage(); // ⭐ best for ImageKit

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

export default upload;
