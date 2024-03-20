import { Router } from "express";
const router = Router();

import { addGroup } from "../../controllers/groups/addGroup";
import { getAllLimitedInfo } from "../../controllers/groups/getAllLInfo";
import { getOneGroup } from "../../controllers/groups/getOneGroup";
import { addPost } from "../../controllers/groups/addPost";
import { getPosts } from "../../controllers/groups/getPosts";
import { addLike } from "../../controllers/groups/addLike";
import { unLike } from "../../controllers/groups/unLikePost";
import { updateViews } from "../../controllers/groups/updatePostViews";
import { addComment2Post } from "../../controllers/groups/addComment2Post";
import { getMembers } from "../../controllers/groups/getMembers";
import { searchGroup } from "../../controllers/groups/search";
import { joinGroup } from "../../controllers/groups/joinGroup";
import { leaveGroup } from "../../controllers/groups/leaveGroup";

router.post("/", addGroup);
router.get("/getLimitedInfo", getAllLimitedInfo);
router.get("/:group_id", getOneGroup);
router.post("/addPost", addPost);
router.get("/getPosts/:group_id", getPosts);
router.post("/addLike/:group_post_id", addLike);
router.post("/unLike/:group_post_id", unLike);
router.post("/updateViews/:group_post_id", updateViews);
router.post("/addComment2Post/:group_post_id", addComment2Post);
router.get("/getMembers/:group_id", getMembers);
router.get("/searchGroup/search", searchGroup);
router.post("/joinGroup/:group_id", joinGroup);
router.post("/leaveGroup/:group_id", leaveGroup);

export default router;
