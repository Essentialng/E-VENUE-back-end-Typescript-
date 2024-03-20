import express, { Request, Response } from "express";
import pool from "../../db/db";
import multer from "multer";
import { upload } from "../../multer/multer";
import cloudinary from "../../cloudinary/cloudinary";
import getUserIDAndToken from "../users/getUserIdFromToken";
import { ResultSetHeader } from "mysql2";
import { validateInputLength } from "../../middleware/inputs/checkLength";

export const uploadEventShowcase: express.RequestHandler = async (
  req: Request,
  res: Response
) => {
  const { user_id: fk_user_id } = getUserIDAndToken(req);

  if (!fk_user_id) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  upload.array("imgs", 5)(req, res, async (error) => {
    if (error) {
      // Handle error
      if (error.message === "Unexpected field") {
        // console.log(error.message);

        res.status(400).json({ error: "Maximum of 5 images allowed" });
        return;
      }

      // console.log(error.message);

      res.status(500).json({ error: "Internal server error" });
      return;
    }

    // Handle multer upload error
    if (error instanceof multer.MulterError) {
      // Handle Multer error
      // console.log(error.message);

      res.status(500).json({ error: "Internal server error" });
      return;
    }

    // Handle no files uploaded
    if (!req.files || req.files.length === 0) {
      // No files uploaded
      // console.log(error.message);
      console.error("No files uploaded");

      res.status(400).json({ error: "No files uploaded" });
      return;
    }

    // Handle the case where req.files is not an array
    if (!Array.isArray(req.files)) {
      console.error("req.files is not an array");

      res.status(500).json({ error: "Internal server error" });
      return;
    }

    const { name, intro }: { name: string; intro: string } = req.body;

    // Validate the length of the inputs
    const validationFields = [
      { name: "name", maxLength: 100 },
      { name: "intro", maxLength: 300 },
    ];

    const validationErrors = validateInputLength(
      { name, intro },
      validationFields
    );

    if (validationErrors.length > 0) {
      res
        .status(400)
        .json({ error: "Input(s) too long", fields: validationErrors });
      return;
    }

    // Upload pictures to Cloudinary
    const pictureUrls = Array<string>();

    // Upload each picture to Cloudinary and store the secure URLs
    for (const file of req.files) {
      const uniqueIdentifier =
        Date.now() + "-" + Math.round(Math.random() * 1e9);
      const publicId = `${fk_user_id}_events_showcase_img_${uniqueIdentifier}`;

      const result = await cloudinary.uploader.upload(file.path, {
        public_id: publicId,
      });

      pictureUrls.push(result.secure_url);
    }

    pool.getConnection((error, connection) => {
      if (error) {
        // Handle connection error
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
        return;
      } else {
        connection.query("START TRANSACTION;", (error) => {
          if (error) {
            // Handle transaction start error
            res.status(500).json({ error: "Internal server error" });
            return;
          } else {
            try {
              // Insert event data
              connection.query<ResultSetHeader>(
                "INSERT INTO events_showcase (fk_user_id, name, intro) VALUES (?, ?, ?)",
                [fk_user_id, name, intro],
                (error, results) => {
                  if (error) {
                    // Handle event insert error
                    console.error(error);
                    res.status(500).json({ error: "Internal server error" });
                    return;
                  }

                  const fk_events_showcase_id = results.insertId;

                  // Insert image URLs
                  const values = pictureUrls.map((imageUrl) => [
                    fk_events_showcase_id,
                    imageUrl,
                  ]);
                  connection.query(
                    "INSERT INTO events_showcase_imgs (fk_events_showcase_id, imgs) VALUES ?",
                    [values],
                    (error) => {
                      if (error) {
                        // Handle image insert error
                        console.error(error);
                        res
                          .status(500)
                          .json({ error: "Internal server error" });
                        return;
                      }

                      connection.query("COMMIT;", (error) => {
                        if (error) {
                          try {
                            connection.query("ROLLBACK;");
                          } catch (rollbackError) {
                            // Handle rollback error
                            console.error(rollbackError);
                          }
                          res
                            .status(500)
                            .json({ error: "Internal server error" });
                        } else {
                          res
                            .status(200)
                            .json({ message: "Event created successfully" });
                        }
                      });
                    }
                  );
                }
              );
            } catch (error) {
              connection.query("ROLLBACK;", (rollbackError) => {
                // Handle rollback error
                console.error(rollbackError);
              });
              res.status(500).json({ error: "Internal server error" });
            } finally {
              connection.release(); // Return connection to pool
            }
          }
        });
      }
    });
  });
};
