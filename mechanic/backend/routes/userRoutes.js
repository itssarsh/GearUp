const express = require("express");
const auth = require("../middleware/auth");
const mechanicUserController = require("../controllers/userController");

const router = express.Router();

router.get("/", mechanicUserController.listUsers);
router.get("/me", auth, mechanicUserController.getProfile);
router.post("/signup", mechanicUserController.signup);
router.post("/login", mechanicUserController.login);
router.post("/logout", auth, mechanicUserController.logout);
router.post("/forgot-password", mechanicUserController.forgotPassword);
router.post("/reset-password", mechanicUserController.resetPassword);

module.exports = router;
