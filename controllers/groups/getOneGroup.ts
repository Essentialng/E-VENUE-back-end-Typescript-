import express, { Request, Response } from "express";
import pool from "../../db/db";
import { RowDataPacket } from "mysql2";
import getUserIDAndToken from "../users/getUserIdFromToken";

export const getOneGroup: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  const { group_id } = req.params;

  if (!group_id) {
    res.status(400).json({ error: "Missing group_id" });
    return;
  }

  const { user_id } = getUserIDAndToken(req);

  if (!user_id) {
    try {
      pool.execute<RowDataPacket[]>(
        `
        SELECT eg.id,
      eg.name,
      eg.about,
      eg.logo,
      eg.fk_user_id
      , COUNT(egm.fk_user_id) as member_total
  FROM egroups eg
  LEFT JOIN egroup_members egm ON egm.fk_egroup_id = eg.id
  WHERE eg.id = ?
  GROUP BY eg.id;
      `,
        [group_id],
        (err, result) => {
          if (err) {
            console.error(err);
            res.status(500).json({ error: "Internal server error" });
            return;
          } else if (result.length === 0) {
            res.status(404).json({ error: "Group not found" });
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
        SELECT eg.id,
    eg.name,
    eg.about,
    eg.logo,
    eg.fk_user_id
    , COUNT(egm.fk_user_id) as member_total,
CASE WHEN EXISTS (
  SELECT 1
  FROM egroup_members egm2
  WHERE egm2.fk_egroup_id = eg.id
    AND egm2.fk_user_id = ?
) THEN 1 ELSE 0 END AS user_has_joined
FROM egroups eg
LEFT JOIN egroup_members egm ON egm.fk_egroup_id = eg.id
WHERE eg.id = ?
GROUP BY eg.id;
      `,
        [user_id, group_id],
        (err, result) => {
          if (err) {
            console.error(err);
            res.status(500).json({ error: "Internal server error" });
            return;
          } else if (result.length === 0) {
            res.status(404).json({ error: "Group not found" });
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
