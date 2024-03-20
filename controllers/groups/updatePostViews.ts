import express, { Request, Response } from "express";
import { ResultSetHeader } from "mysql2";
import pool from "../../db/db";

export const updateViews: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  const { group_post_id } = req.params;

  if (!group_post_id) {
    res.status(400).json({ error: "Missing group id fields" });
    return;
  }

  try {
    pool.execute<ResultSetHeader[]>(
      `
      UPDATE egroup_posts
      SET views = COALESCE(views, 0) + 1
      WHERE id = ?;
      
            `,
      [group_post_id],
      (err, result) => {
        if (err) {
          console.error(err);
          res.status(500).json({ error: "Internal server error" });
          return;
        } else if (result.length === 0) {
          res.status(404).json({ error: "No posts yet." });
          return;
        }
        res.status(200).json({ message: "Update successful" });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
