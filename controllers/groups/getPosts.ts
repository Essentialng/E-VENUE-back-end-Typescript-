import express, { Request, Response } from "express";
import pool from "../../db/db";
import { RowDataPacket } from "mysql2";
import getUserIDAndToken from "../users/getUserIdFromToken";

// wrongly sending back comments as duplicate
export const getPosts: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  const { group_id } = req.params;

  if (!group_id) {
    res.status(400).json({ error: "Missing group id fields" });
    return;
  }

  const { user_id } = getUserIDAndToken(req);

  if (!user_id) {
    try {
      pool.execute<RowDataPacket[]>(
        `
        SELECT 
    egp.id, 
    egp.post, 
    egp.created_at, 
    COALESCE(egp.shares, 0) AS shares, 
    COALESCE(egp.views, 0) AS views,
    GROUP_CONCAT(eimg.imgs) AS imgs, 
    u.first_name AS owner_firstname, 
    u.last_name AS owner_lastname, 
    u.img AS owner_img, 
    COUNT(epl.fk_user_id) AS likes,
    (SELECT COUNT(*) FROM egroup_post_likes WHERE fk_egroup_post_id = egp.id AND fk_user_id = 0) AS user_liked,
    JSON_ARRAYAGG(
      JSON_OBJECT(
        "comment_id", epc.id,
        "comment", epc.comment,
        "created_at", epc.created_at,
        "commentator_img", uc.img,
        "commentator_first_name", uc.first_name,
        "commentator_last_name", uc.last_name
      ) 
    ) AS post_comments
  FROM egroup_posts egp
  LEFT JOIN users u ON egp.fk_user_id = u.user_id
  LEFT JOIN egroup_post_comments epc ON epc.fk_egroup_post_id = egp.id
  LEFT JOIN users uc ON epc.fk_user_id = uc.user_id
  LEFT JOIN egroups eg ON eg.id = egp.fk_egroup_id
  LEFT JOIN egroup_post_likes epl ON epl.fk_egroup_post_id = egp.id
  LEFT JOIN egroup_post_imgs eimg ON eimg.fk_egroup_post_id = egp.id
  WHERE eg.id = ?
  GROUP BY egp.id;
              `,
        [group_id],
        (err, result) => {
          if (err) {
            console.error(err);
            res.status(500).json({ error: "Internal server error" });
            return;
          } else if (result.length === 0) {
            res.status(404).json({ error: "No posts yet." });
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
      SELECT 
  egp.id, 
  egp.post, 
  egp.created_at, 
  COALESCE(egp.shares, 0) AS shares, 
  COALESCE(egp.views, 0) AS views,
  GROUP_CONCAT(eimg.imgs) AS imgs, 
  u.first_name AS owner_firstname, 
  u.last_name AS owner_lastname, 
  u.img AS owner_img, 
  COUNT(epl.fk_user_id) AS likes,
  (SELECT COUNT(*) FROM egroup_post_likes WHERE fk_egroup_post_id = egp.id AND fk_user_id = ?) AS user_liked,
  JSON_ARRAYAGG(
    JSON_OBJECT(
      "comment_id", epc.id,
      "comment", epc.comment,
      "created_at", epc.created_at,
      "commentator_img", uc.img,
      "commentator_first_name", uc.first_name,
      "commentator_last_name", uc.last_name
    ) 
  ) AS post_comments
FROM egroup_posts egp
LEFT JOIN users u ON egp.fk_user_id = u.user_id
LEFT JOIN egroup_post_comments epc ON epc.fk_egroup_post_id = egp.id
LEFT JOIN users uc ON epc.fk_user_id = uc.user_id
LEFT JOIN egroups eg ON eg.id = egp.fk_egroup_id
LEFT JOIN egroup_post_likes epl ON epl.fk_egroup_post_id = egp.id
LEFT JOIN egroup_post_imgs eimg ON eimg.fk_egroup_post_id = egp.id
WHERE eg.id = ?
GROUP BY egp.id;
            `,
        [user_id, group_id],
        (err, result) => {
          if (err) {
            console.error(err);
            res.status(500).json({ error: "Internal server error" });
            return;
          } else if (result.length === 0) {
            res.status(404).json({ error: "No posts yet." });
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
