import express, { Request, Response } from "express";
import pool from "../../db/db";
import { RowDataPacket } from "mysql2";

export const getCategoryCount: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  try {
    // check if the Venue exists in the database. Avoid race condition
    pool.execute<RowDataPacket[]>(
      `
      SELECT
SUM(category = 'meetings') AS Meetings,
SUM(category = 'shows') AS Shows,
SUM(category = 'brand_promotion') AS Brand_promotion,
SUM(category = 'class_reunion') AS Class_reunion,
SUM(category = 'boardrooms') AS Boardrooms,
SUM(category = 'pool_party') AS Pool_party,
SUM(category = 'award_show') AS Award_show,
SUM(category = 'exhibition') AS Exhibition,
SUM(category = 'bachelor_party') AS Bachelor_party,
SUM(category = 'others') AS Others,
SUM(category = 'wedding') AS Weddings
FROM venues;
                `,
      (err, result) => {
        if (err) {
          console.error(err);
          res.status(500).json({ error: "Internal server error" });
          return;
        } else if (result.length === 0) {
          res.status(404).json({ error: "Venue not found" });
          return;
        } else {
          console.log(result);

          res.status(200).json({ result });
        }
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
