import express, { Request, Response } from "express";
import { ResultSetHeader } from "mysql2";
import pool from "../../db/db";

export const increaseView: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  const { video_id }: { video_id: number } = req.body;
  console.log({ video_id });

  if (!video_id) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const strVideoId = video_id.toString();

  try {
    pool.execute<ResultSetHeader>(
      `
      UPDATE short_videos
SET views = COALESCE(views, 0) + 1
WHERE id = ?;
            `,
      [strVideoId],
      (err) => {
        if (err) {
          console.error(err.message);
          res.status(500).json({ error: "Internal server error" });
          return;
        }
        res.status(200).json({ message: "View incremented" });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
