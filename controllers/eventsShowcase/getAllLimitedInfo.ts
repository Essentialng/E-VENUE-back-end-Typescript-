import express, { Request, Response } from "express";
import pool from "../../db/db";
import { RowDataPacket } from "mysql2";

export const getAllLimitedInfo: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  try {
    const finalResult: RowDataPacket[][] = [];
    pool.execute<RowDataPacket[]>(
      `
        SELECT
          evs.id, evs.name, evs.intro,
          SUBSTRING_INDEX(GROUP_CONCAT(evsimg.imgs), ',', 1) AS first_img
        FROM events_showcase evs
        JOIN events_showcase_imgs evsimg ON evs.id = evsimg.fk_events_showcase_id
        GROUP BY evs.id
        ORDER BY evs.id DESC;
        `,
      (err, result) => {
        if (err) {
          console.error(err);
        }
        if (result.length === 0) {
          res.status(404).json({ error: "Events showcase not found" });
        }

        finalResult.push(result);

        pool.execute<RowDataPacket[]>(
          "SELECT COUNT(*) AS total FROM events_showcase;",
          (err, result) => {
            if (err) {
              console.error(err);
            }
            if (result.length === 0) {
              res.status(404).json({ error: "Events showcase not found" });
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
