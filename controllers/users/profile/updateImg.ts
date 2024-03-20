import express, { Request, Response } from "express";
import pool from "../../../db/db";
import { ResultSetHeader } from "mysql2";
import getUserIDAndToken from "../getUserIdFromToken";
import { upload } from "../../../multer/multer";
import cloudinary from "../../../cloudinary/cloudinary";
import multer from "multer";

export const updateImg: express.RequestHandler = async (
  req: Request,
  res: Response
) => {
  const { user_id } = getUserIDAndToken(req);

  if (!user_id) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  upload.single("img")(req, res, async (err) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
      return;
    }

    // Handle multer upload error
    if (err instanceof multer.MulterError) {
      // Handle Multer error
      console.log(err.message);

      res.status(500).json({ error: err.message });
      return;
    }

    // create uniqueIdentifier for the image
    const uniqueIdentifier = Date.now() + "-" + Math.round(Math.random() * 1e9);

    // create publicId for the image for cloudinary
    const publicId = `business_img-${uniqueIdentifier}`;

    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      public_id: publicId,
    });

    try {
      pool.execute<ResultSetHeader>(
        "UPDATE users SET img = ? WHERE user_id = ?",
        [result.secure_url, user_id],
        (error) => {
          if (error) {
            console.error(error);
            res
              .status(500)
              .json({ error: "Internal server error. Please try again later" });
            return;
          }
          res.status(200).json({ message: "Image uploaded successfully" });
        }
      );
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "Internal server error. Please try again later" });
    }
  });
};
