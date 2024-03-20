import express, { Request, Response } from "express";
import pool from "../../db/db";
import { RowDataPacket } from "mysql2";

export const getReviews: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  const { sProvider_id } = req.params;
  console.log(sProvider_id ?? "no sProvider_id");

  if (!sProvider_id) {
    res.status(400).json({ error: "Missing service provider id" });
    return;
  }

  try {
    const finalResult: RowDataPacket[][] = [];

    pool.execute<RowDataPacket[]>(
      `
      SELECT rv.id, rv.review, u.first_name AS reviewer_first_name, u.last_name AS reviewer_last_name, u.img AS reviewer_img
FROM e_service_reviews rv
JOIN users u ON u.user_id = rv.fk_user_id
WHERE rv.fk_event_services_id = ?;
                `,
      [sProvider_id],
      (err, result) => {
        if (err) {
          console.error(err);
          res.status(500).json({ error: "Internal server error" });
          return;
        }
        if (result.length === 0) {
          res.status(404).json({ error: "No reviews yet" });
          return;
        }

        finalResult.push(result);

        pool.execute<RowDataPacket[]>(
          "SELECT COUNT(*) AS total FROM e_service_reviews WHERE fk_event_services_id = ?;",
          [sProvider_id],
          (err, result) => {
            if (err) {
              console.error(err);
            }
            if (result.length === 0) {
              res.status(404).json({ error: "No reviews yet" });
            }

            finalResult.push(result);

            res.status(200).json({ finalResult });
          }
        );
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
