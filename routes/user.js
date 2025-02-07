const express = require("express");
const router = express.Router();
const userCtrl = require("../controllers/user");
const authMiddleware = require('../middleware/auth');

/*******************************/
/********ROUTES DE L'API********/
/*******************************/

/********CRÉATION D'UN DOCUMENT********/
router.post("/signup", userCtrl.signup);

router.post("/login", userCtrl.login);

router.put("/update", authMiddleware, userCtrl.updateUser);

router.get("/me", authMiddleware, userCtrl.getUserInfo);


module.exports = router;
