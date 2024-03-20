import express, { Request, Response } from "express";
import pool from "../../db/db";
import multer from "multer";
import { upload } from "../../multer/multer";
import cloudinary from "../../cloudinary/cloudinary";
import getUserIDAndToken from "../users/getUserIdFromToken";
import { ResultSetHeader } from "mysql2";
import { validateInputLength } from "../../middleware/inputs/checkLength";

export const uploadEventService: express.RequestHandler = async (
  req: Request,
  res: Response
) => {
  const { user_id } = getUserIDAndToken(req);

  if (!user_id) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  upload.array("imgs", 5)(req, res, async (error) => {
    if (error) {
      // Handle error
      if (error.message === "Unexpected field") {
        console.log(error.message);

        res.status(400).json({ error: "Maximum of 5 images allowed" });
        return;
      }

      console.log(error.message);

      res.status(500).json({ error: error.message });
      return;
    }

    // Handle multer upload error
    if (error instanceof multer.MulterError) {
      // Handle Multer error
      console.log(error.message);

      res.status(500).json({ error: error.message });
      return;
    }

    // Handle no files uploaded
    if (!req.files || req.files.length === 0) {
      // No files uploaded
      console.log(error.message);
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

    const {
      name,
      location,
      profession,
      category,
      email,
      phone_number,
      experience_duration,
      bio,
      MONDAY_OPEN,
      MONDAY_CLOSE,
      TUESDAY_OPEN,
      TUESDAY_CLOSE,
      WEDNESDAY_OPEN,
      WEDNESDAY_CLOSE,
      THURSDAY_OPEN,
      THURSDAY_CLOSE,
      FRIDAY_OPEN,
      FRIDAY_CLOSE,
      SATURDAY_OPEN,
      SATURDAY_CLOSE,
      SUNDAY_OPEN,
      SUNDAY_CLOSE,
    }: {
      name: string;
      location: string;
      profession: string;
      category: string;
      email: string;
      phone_number: string;
      experience_duration: string;
      bio: string;
      MONDAY_OPEN: string;
      MONDAY_CLOSE: string;
      TUESDAY_OPEN: string;
      TUESDAY_CLOSE: string;
      WEDNESDAY_OPEN: string;
      WEDNESDAY_CLOSE: string;
      THURSDAY_OPEN: string;
      THURSDAY_CLOSE: string;
      FRIDAY_OPEN: string;
      FRIDAY_CLOSE: string;
      SATURDAY_OPEN: string;
      SATURDAY_CLOSE: string;
      SUNDAY_OPEN: string;
      SUNDAY_CLOSE: string;
    } = req.body;
    console.log(req.body);

    // Validate the length of the inputs
    const validationFields = [
      { name: "name", maxLength: 300 },
      { name: "location", maxLength: 300 },
      { name: "profession", maxLength: 100 },
      { name: "category", maxLength: 100 },
      { name: "email", maxLength: 60 },
      { name: "phone_number", maxLength: 11 },
      { name: "experience_duration", maxLength: 19 },
      { name: "bio", maxLength: 1000 },
    ];

    const validationErrors = validateInputLength(req.body, validationFields);

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
      const publicId = `${user_id}_Eservice_img_${uniqueIdentifier}`;

      const result = await cloudinary.uploader.upload(file.path, {
        public_id: publicId,
      });

      console.log({ result });

      pictureUrls.unshift(result.secure_url);
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
              // Insert Event service data
              connection.query<ResultSetHeader>(
                `INSERT INTO event_services
                (
                name,
                location,
                profession,
                category,
                email,
                phone_number,
                experience_duration,
                bio,
                fk_user_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
                [
                  name,
                  location,
                  profession,
                  category,
                  email,
                  phone_number,
                  experience_duration,
                  bio,
                  user_id,
                ],
                (error, results) => {
                  if (error) {
                    // Handle Event service insert error
                    console.error(error);
                    res.status(500).json({ error: "Internal server error" });
                    return;
                  }

                  const fk_event_services_id = results.insertId;

                  // Insert image URLs
                  const values = pictureUrls.map((imageUrl) => [
                    fk_event_services_id,
                    imageUrl,
                  ]);
                  connection.query(
                    "INSERT INTO event_services_imgs (fk_event_services_id, imgs) VALUES ?",
                    [values],
                    (error) => {
                      if (error) {
                        // Handle image insert error
                        console.error(error);
                        res
                          .status(500)
                          .json({ error: "Internal server error" });
                        return;
                      } else {
                        try {
                          connection.query(
                            `
INSERT INTO event_service_hours
(MONDAY_OPEN,
MONDAY_CLOSE,
TUESDAY_OPEN,
TUESDAY_CLOSE,
WEDNESDAY_OPEN,
WEDNESDAY_CLOSE,
THURSDAY_OPEN,
THURSDAY_CLOSE,
FRIDAY_OPEN,
FRIDAY_CLOSE,
SATURDAY_OPEN,
SATURDAY_CLOSE,
SUNDAY_OPEN,
SUNDAY_CLOSE,
fk_event_service_id)
VALUES
(
?,
?,
?,
?,
?,
?,
?,
?,
?,
?,
?,
?,
?,
?,
?
);
 
                            `,
                            [
                              MONDAY_OPEN,
                              MONDAY_CLOSE,
                              TUESDAY_OPEN,
                              TUESDAY_CLOSE,
                              WEDNESDAY_OPEN,
                              WEDNESDAY_CLOSE,
                              THURSDAY_OPEN,
                              THURSDAY_CLOSE,
                              FRIDAY_OPEN,
                              FRIDAY_CLOSE,
                              SATURDAY_OPEN,
                              SATURDAY_CLOSE,
                              SUNDAY_OPEN,
                              SUNDAY_CLOSE,
                              fk_event_services_id,
                            ],
                            (err) => {
                              if (err) {
                                console.error(err);
                                res
                                  .status(500)
                                  .json({ error: "Internal sever error" });
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
                                  res.status(200).json({
                                    message:
                                      "Event service created successfully",
                                  });
                                }
                              });
                            }
                          );
                        } catch (error) {
                          console.error(error);
                          res
                            .status(500)
                            .json({ error: "Internal server error" });
                        }
                      }
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
