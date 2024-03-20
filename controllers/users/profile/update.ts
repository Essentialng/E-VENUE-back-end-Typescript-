import express, { Request, Response } from "express";
import pool from "../../../db/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import getUserIDAndToken from "../getUserIdFromToken";
import { upload } from "../../../multer/multer";
import cloudinary from "../../../cloudinary/cloudinary";
import DOMPurify from "isomorphic-dompurify";

// interface UserData {
//   // user_id: string;
//   // first_name: string;
//   // last_name: string;
//   business_name: string;
//   business_img: string | null;
//   country_code: string;
//   phone_number: string | null;
//   whatsapp_number: string | null;
//   state: string;
//   axis: string;
//   about_your_organisation: string | null;
//   services_your_organization_provides: string | null;
//   business_state: string | null;
//   business_axis: string | null;
//   business_category: string | null;
//   facebook: string | null;
//   twitter: string | null;
//   linkedin: string | null;
//   instagram: string | null;
// }

export const updateProfile: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  const { user_id } = getUserIDAndToken(req);
  if (!user_id) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  upload.single("business_img")(req, res, async (err) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
    // create uniqueIdentifier for the image
    const uniqueIdentifier = Date.now() + "-" + Math.round(Math.random() * 1e9);

    // create publicId for the image for cloudinary
    const publicId = `business_img-${uniqueIdentifier}`;

    let imgURL = req.body.business_img || null;

    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          public_id: publicId,
        });
        imgURL = result.secure_url;
      } catch (error) {
        console.error(error);
        // Handle cloudinary upload errors gracefully (e.g., log, send generic error response)
        // Consider using a cloudinary error handling library
        console.error("Error uploading image:", error);
        res.status(500).json({ error });
      }
    }

    // To prevent unpassed values from req to be NULL in the db.
    const [user] = await pool
      .promise()
      .execute<RowDataPacket[]>("SELECT * FROM users WHERE user_id = ?", [
        user_id,
      ]);

    if (!Array.isArray(user) || user.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const userData = user[0];
    console.log("userData", userData);

    // seems redundant. Use is Untested
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // create post object
    const post = {
      first_name: req.body.first_name ?? userData.first_name,
      last_name: req.body.last_name ?? userData.last_name,
      business_name: req.body.business_name ?? userData.business_name ?? null,
      business_img: imgURL ?? userData.business_img,
      country_code: req.body.country_code ?? userData.country_code,
      phone_number: req.body.phone_number ?? userData.phone_number,
      whatsapp_number: req.body.whatsapp_number ?? userData.whatsapp_number,
      state: req.body.state ?? userData.state,
      axis: req.body.axis ?? userData.axis,
      about_your_organisation:
        DOMPurify.sanitize(req.body.about_your_organisation) ??
        userData.about_your_organisation,
      services_your_organization_provides:
        DOMPurify.sanitize(req.body.services_your_organization_provides) ??
        userData.services_your_organization_provides,
      business_state: req.body.business_state ?? userData.business_state,
      business_axis: req.body.business_axis ?? userData.business_axis,
      business_category:
        req.body.business_category ?? userData.business_category,
      facebook: req.body.facebook ?? userData.facebook,
      twitter: req.body.twitter ?? userData.twitter,
      linkedin: req.body.linkedin ?? userData.linkedin,
      instagram: req.body.instagram ?? userData.instagram,
    };

    // send post to mySQL database
    pool.execute<ResultSetHeader>(
      `
          UPDATE users
          SET
          first_name = ?,
          last_name = ?,
          business_name = ?,
          business_img = ?,
          country_code = ?,
          phone_number = ?,
          whatsapp_number = ?,
          state = ?,
          axis = ?,
          about_your_organisation = ?,
          services_your_organization_provides = ?,
          business_state = ?,
          business_axis = ?,
          business_category = ?,
          facebook = ?,
          twitter = ?,
          linkedin = ?,
          instagram = ?
          WHERE user_id = ?;
        `,
      [
        post.first_name,
        post.last_name,
        post.business_name,
        post.business_img,
        post.country_code,
        post.phone_number,
        post.whatsapp_number,
        post.state,
        post.axis,
        post.about_your_organisation,
        post.services_your_organization_provides,
        post.business_state,
        post.business_axis,
        post.business_category,
        post.facebook,
        post.twitter,
        post.linkedin,
        post.instagram,
        user_id,
      ],
      (err) => {
        if (err) {
          console.error(err);
          res.status(500).json({ error: err.message });
          return;
        }
        res.status(500).json({ error: "Internal server error" });
      }
    );
  });
};
