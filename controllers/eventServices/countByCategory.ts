import express, { Request, Response } from "express";
import pool from "../../db/db";
import { RowDataPacket } from "mysql2";

export const countByCategory: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  try {
    pool.execute<RowDataPacket[]>(
      `
      SELECT 
    SUM(category = 'designers') AS total_designers,
    SUM(category = 'make_up_artise') AS total_make_up_artise,
    SUM(category = 'Photographer/Videographer') AS total_photo_video_makers
FROM 
    event_services;
                `,
      (err, result) => {
        if (err) {
          console.error(err);
          res.status(500).json({ error: "Internal server error" });
          return;
        } else if (result.length === 0) {
          res.status(404).json({ error: "Designers not found" });
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
