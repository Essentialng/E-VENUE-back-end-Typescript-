import express, { Request, Response } from "express";
import pool from "../../db/db";
import { RowDataPacket } from "mysql2";

export const getLimitedInfo: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  try {
    pool.execute<RowDataPacket[]>(
      `
SELECT sv.id, sv.video, COALESCE(sv.views, 0) AS views, COALESCE(svl.like_count, 0) AS likes
FROM short_videos sv
LEFT JOIN short_videos_likes svl ON sv.id = svl.fk_video_id;
            `,
      (err, result) => {
        if (err) {
          console.error(err);
          res.status(500).json({ error: "Internal server error" });
          return;
        } else if (result.length === 0) {
          res.status(404).json({ error: "Short videos not found" });
          return;
        }
        res.status(200).json({ result });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
