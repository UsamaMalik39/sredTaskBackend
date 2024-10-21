const express = require('express');
const passport = require('passport');
const githubController = require('../controllers/githubController');
const { checkGitHubToken } = require('../middleware/authMiddleware');

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

router.post('/logout', githubController.logout);

router.get('/organizations', checkGitHubToken, githubController.fetchOrganizationsAndRepos);
router.post('/repo-info', checkGitHubToken, githubController.fetchRepositoryInfo);
router.post('/commits', checkGitHubToken, githubController.fetchCommits);
router.post('/pull-requests', checkGitHubToken, githubController.fetchPullRequests);

module.exports = router;
