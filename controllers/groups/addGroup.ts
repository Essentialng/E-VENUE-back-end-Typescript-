import express, { Request, Response } from "express";
import pool from "../../db/db";
import multer from "multer";
import { upload } from "../../multer/multer";
import cloudinary from "../../cloudinary/cloudinary";
import getUserIDAndToken from "../users/getUserIdFromToken";
import { ResultSetHeader } from "mysql2";
import { UploadApiResponse } from "cloudinary";

export const addGroup: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  const { user_id } = getUserIDAndToken(req);

  if (!user_id) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  upload.single("logo")(req, res, async (error) => {
    if (error instanceof multer.MulterError) {
      console.log(error);
    }

    // create uniqueIdentifier for the image
    const uniqueIdentifier = Date.now() + "-" + Math.round(Math.random() * 1e9);

    // create publicId for the image for cloudinary
    const publicId = `logo-${uniqueIdentifier}`;

    // console.log({ file: req.file });

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log({ file: req.file.path });

    const result = (await cloudinary.uploader
      .upload(req.file.path, {
        public_id: publicId,
      })
      .catch((err) => {
        console.log(err);
      })) as UploadApiResponse;

    const { name, about }: { name: string; about: string } = req.body;
    const imgUrl = result?.secure_url;

    pool.getConnection((err, connection) => {
      if (err) {
        // Handle connection error
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
        return;
      } else {
        connection.query("START TRANSACTION;", (err) => {
          if (err) {
            // Handle transaction error
            console.error(err);
            res.status(500).json({ error: "Internal server error" });
            return;
          } else {
            try {
              connection.query<ResultSetHeader>(
                `
                                INSERT INTO egroups (name, about, logo,
                                    fk_user_id) VALUES (?, ?, ?, ?);
                                `,
                [name, about, imgUrl, user_id],
                (err, result) => {
                  if (err) {
                    // Handle insert error
                    console.error(err);
                    res.status(500).json({ error: "Internal server error" });
                    return;
                  }

                  const fk_egroup_id = result.insertId;

                  connection.query(
                    `
                                        INSERT INTO egroup_members (fk_user_id, fk_egroup_id) VALUES (?, ?)
                                        `,
                    [user_id, fk_egroup_id],
                    (err) => {
                      if (err) {
                        // Handle insert error
                        console.error(err);
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
                            .json({ message: "Group created successfully" });
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
