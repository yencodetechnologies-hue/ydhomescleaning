const express = require('express');
const router = express.Router();
const {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  regenerateAccessLink,
  accessByToken
} = require('../controllers/Usercontroller');

// PUBLIC: open dashboard from the personal link (keep this before any '/:id' routes)
router.get('/access/:token', accessByToken);

// Map the routes
router.route('/')
  .get(getUsers)
  .post(createUser);

// ADMIN: generate a fresh access link for a user (old link stops working)
router.post('/:id/access-link', regenerateAccessLink);

router.route('/:id')
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;