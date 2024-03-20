import express, { Request, Response } from "express";
import pool from "../../db/db";
import { RowDataPacket } from "mysql2";

export const getLocationCount: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  try {
    // check if the Venue exists in the database. Avoid race condition
    pool.execute<RowDataPacket[]>(
      `
      SELECT
SUM(location LIKE '%lagos%') AS lagos,
SUM(location LIKE '%ogun%') AS ogun,
SUM(location LIKE '%kano%') AS kano,
SUM(location LIKE '%abia%') AS abia,
SUM(location LIKE '%abuja%') AS abuja,
SUM(location LIKE '%rivers%') AS rivers
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
