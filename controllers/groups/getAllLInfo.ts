import express, { Request, Response } from "express";
import pool from "../../db/db";
import { RowDataPacket } from "mysql2";

export const getAllLimitedInfo: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  try {
    pool.execute<RowDataPacket[]>(
      `
      SELECT 
    eg.id,
    eg.name,
    eg.about,
    eg.logo,
    eg.fk_user_id,
    COUNT(DISTINCT egm.fk_user_id) AS member_total,
    COUNT(DISTINCT CASE WHEN po.created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN po.id END) AS total_post_last_24_hrs
FROM 
    egroups eg
LEFT JOIN 
    egroup_members egm ON egm.fk_egroup_id = eg.id
LEFT JOIN 
    egroup_posts po ON po.fk_egroup_id = eg.id
GROUP BY 
    eg.id;
    `,
      (err, result) => {
        if (err) {
          console.error(err);
          res.status(500).json({ error: "Internal server error" });
          return;
        } else if (result.length === 0) {
          res.status(404).json({ error: "Groups not found" });
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
