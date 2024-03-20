import express, { Request, Response } from "express";
import pool from "../../db/db";
import { RowDataPacket } from "mysql2";

export const getAllInfo: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  const { story_id } = req.query;

  if (!story_id) {
    try {
      pool.execute<RowDataPacket[]>(
        `
        SELECT st.id, st.video, COALESCE(st.views, 0) AS views, COUNT(DISTINCT stl.fk_user_id) AS likes,
  u.first_name, u.last_name, u.img
  FROM stories st
  LEFT JOIN story_likes stl ON st.id = stl.fk_story_id
  JOIN users u ON u.user_id = st.fk_user_id
  GROUP BY st.id
  ORDER BY st.id DESC;
  ;
              `,

        (err, result) => {
          if (err) {
            console.error(err);
            res.status(500).json({ error: "Internal server error" });
            return;
          } else if (result.length === 0) {
            res.status(404).json({ error: "Stories not found" });
            return;
          }
          res.status(200).json({ result });
        }
      );
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  } else {
    try {
      pool.execute<RowDataPacket[]>(
        `
      SELECT st.id, st.video, COALESCE(st.views, 0) AS views, COUNT(DISTINCT stl.fk_user_id) AS likes,
u.first_name, u.last_name, u.img
FROM stories st
LEFT JOIN story_likes stl ON st.id = stl.fk_story_id
JOIN users u ON u.user_id = st.fk_user_id
GROUP BY st.id
ORDER BY st.id = ? DESC;
;
            `,
        [story_id],
        (err, result) => {
          if (err) {
            console.error(err);
            res.status(500).json({ error: "Internal server error" });
            return;
          } else if (result.length === 0) {
            res.status(404).json({ error: "Stories not found" });
            return;
          }
          res.status(200).json({ result });
        }
      );
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
};
