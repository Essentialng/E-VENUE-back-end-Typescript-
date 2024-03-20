import express, { Request, Response } from "express";
import { ResultSetHeader } from "mysql2";
import pool from "../../db/db";
import getUserIDAndToken from "../users/getUserIdFromToken";

export const addLike: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  const { group_post_id } = req.params;

  if (!group_post_id) {
    res.status(400).json({ error: "Missing group id fields" });
    return;
  }

  const { user_id } = getUserIDAndToken(req);

  if (!user_id) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const like_count = 1;
  try {
    pool.execute<ResultSetHeader[]>(
      `
      INSERT INTO egroup_post_likes
(like_count,
fk_egroup_post_id,
fk_user_id)
VALUES
(?,
?,
?);
            `,
      [like_count, group_post_id, user_id],
      (err, result) => {
        if (err) {
          console.error(err);
          res.status(500).json({ error: "Internal server error" });
          return;
        } else if (result.length === 0) {
          res.status(404).json({ error: "No posts yet." });
          return;
        }
        res.status(200).json({ message: "Post liked successfully" });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
