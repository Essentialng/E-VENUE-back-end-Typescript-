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
      SELECT st.id, st.video, COALESCE(st.views, 0) AS views, COALESCE(stl.like_count, 0) AS likes
      FROM stories st
      LEFT JOIN story_likes stl ON st.id = stl.fk_story_id;
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
