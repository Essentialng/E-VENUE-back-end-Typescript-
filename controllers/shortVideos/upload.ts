import express, { Request, Response } from "express";
import pool from "../../db/db";
import { upload } from "../../multer/multerVideos";
import cloudinary from "../../cloudinary/cloudinary";
import multer from "multer";
import getUserIDAndToken from "../users/getUserIdFromToken";
import { UploadApiResponse } from "cloudinary";
import { ResultSetHeader } from "mysql2";

export const uploadShortVideo: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  const { user_id } = getUserIDAndToken(req);

  if (!user_id) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  upload.single("video")(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      console.log(err);
    }
    // create uniqueIdentifier for the image
    const uniqueIdentifier = Date.now() + "-" + Math.round(Math.random() * 1e9);

    // create publicId for the image for cloudinary
    const publicId = `shortVideo-${uniqueIdentifier}`;

    // handle if no req.file
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // upload to cloudinary
    const result = (await cloudinary.uploader
      .upload(req.file.path, {
        public_id: publicId,
        resource_type: "video",
      })
      .catch((err) => {
        console.log(err);
      })) as UploadApiResponse;

    // create post object
    //likes shouldn't be passed at upload time
    const post = {
      video: result.secure_url,
      description: req.body.description,
      fk_user_id: user_id,
    };

    // send post to mySQL database
    pool.execute<ResultSetHeader>(
      `INSERT INTO short_videos (video, description, fk_user_id) VALUES (?, ?, ?)`,
      [post.video, post.description, post.fk_user_id],
      (err) => {
        if (err) {
          console.log(err);
          res.status(500).json({ error: err.message });
          return;
        }
        res.status(200).json({ message: "Short video uploaded successfully" });
      }
    );
  });
};
