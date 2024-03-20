import { Request } from "express";
import multer, { FileFilterCallback } from "multer";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "dev"); // change dev to tmp in production
  },
  filename: (req, file, cb) => {
    const uniqueIdentifier = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueIdentifier + "-" + file.originalname);
  },
});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (!file.originalname.match(/\.(mp4|mov|avi)$/i)) {
    return cb(null, false);
  }
  cb(null, true);
};

export const upload = multer({ storage, fileFilter });
