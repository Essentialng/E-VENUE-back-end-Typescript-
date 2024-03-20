import express, { Request, Response } from "express";
import { ResultSetHeader } from "mysql2";
import pool from "../../db/db";
import getUserIDAndToken from "../users/getUserIdFromToken";

export const addComment2Post: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  const { group_post_id } = req.params;
  const { comment }: { comment: string } = req.body;
  const { user_id } = getUserIDAndToken(req);

  if (!group_post_id || !comment || !user_id) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  try {
    pool.execute<ResultSetHeader>(
      `
      INSERT INTO egroup_post_comments
(comment,
fk_egroup_post_id,
fk_user_id)
VALUES
(?,
?,
?);
      
            `,
      [comment, group_post_id, user_id],
      (err) => {
        if (err) {
          console.error(err);
          res.status(500).json({ error: "Internal server error" });
          return;
        }
        res.status(200).json({ message: "Comment added successfully" });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
