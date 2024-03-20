import express, { Request, Response } from "express";
import pool from "../../db/db";
import { ResultSetHeader } from "mysql2";
import { validateInputLength } from "../../middleware/inputs/checkLength";
import getUserIDAndToken from "../users/getUserIdFromToken";

export const addComment: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  const { video_id, comment }: { video_id: number; comment: string } = req.body;
  console.log({ video_id, comment });

  if (!video_id || !comment) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const validationFields = [
    { name: "video_id", maxLength: 100 },
    { name: "comment", maxLength: 100 },
  ];

  const strVideoId = video_id.toString();

  const validationErrors = validateInputLength(
    { strVideoId, comment },
    validationFields
  );

  if (validationErrors.length > 0) {
    res
      .status(400)
      .json({ error: "Input(s) too long", fields: validationErrors });
    return;
  }

  const { user_id } = getUserIDAndToken(req);
  console.log({ user_id });

  if (!user_id) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    pool.execute<ResultSetHeader>(
      `
      INSERT INTO short_video_comments
      (comment,
      fk_video_id,
      fk_user_id)
      VALUES
      (?,
      ?,
      ?);
            `,
      [comment, strVideoId, user_id],
      (err) => {
        if (err) {
          console.error(err.message);
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
