import express, { Request, Response } from "express";
import pool from "../../db/db";
import { RowDataPacket } from "mysql2";

export const getAllInfo: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  const { video_id } = req.query;

  if (!video_id) {
    res.status(400).json({ error: "Missing video id fields" });
    return;
  }

  try {
    pool.execute<RowDataPacket[]>(
      `
      SELECT 
    sv.id, 
    sv.video, 
    sv.description,
    sv.posted_on,
    COALESCE(sv.views, 0) AS views, 
    COUNT(DISTINCT svl.fk_user_id) AS likes,
    sv.fk_user_id AS video_user_id, 
    u.first_name AS video_user_first_name, 
    u.last_name AS video_user_last_name, 
    u.img AS video_user_img,
    JSON_ARRAYAGG(
        JSON_OBJECT(
            'comment_id', svc.id, 
            'comment', svc.comment, 
            'commentator_username', uc.first_name, 
            'commentator_img', uc.img, 
            'created_at', svc.created_at
        )
    ) AS comments,
    CASE WHEN EXISTS (
        SELECT 1 
        FROM short_videos_likes svl2 
        WHERE svl2.fk_video_id = sv.id AND svl2.fk_user_id = sv.fk_user_id
    ) THEN 1 ELSE 0 END AS user_has_liked
FROM 
    short_videos sv
LEFT JOIN 
    short_videos_likes svl ON sv.id = svl.fk_video_id
INNER JOIN 
    users u ON sv.fk_user_id = u.user_id
LEFT JOIN 
    short_video_comments svc ON sv.id = svc.fk_video_id
LEFT JOIN 
    users uc ON svc.fk_user_id = uc.user_id
GROUP BY 
    sv.id, 
    sv.video, 
    sv.views, 
    sv.fk_user_id, 
    u.first_name, 
    u.last_name, 
    u.img
ORDER BY 
    sv.id = ? DESC
;
            `,
      [video_id],
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
