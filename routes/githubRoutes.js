const express = require('express');
const passport = require('passport');
const githubController = require('../controllers/githubController');

const router = express.Router();

router.get('/github', passport.authenticate('github', { scope: ['user:email', 'read:org', 'repo'] }));

router.get('/github/callback',
    passport.authenticate('github', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('http://localhost:4200'); 
    }
);

router.get('/status', githubController.checkStatus);

router.delete('/remove', githubController.removeIntegration);

router.get('/logout', githubController.logout);


router.get('/organizations', githubController.fetchOrganizationsAndRepos);
router.post('/repo-info', githubController.fetchRepositoryInfo);

module.exports = router;
