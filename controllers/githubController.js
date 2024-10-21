const GitHubIntegration = require('../models/gitHubIntegration');
const {
    createAxiosInstance,
    fetchOrganizations,
    fetchReposForOrg,
    fetchRepoData,
} = require('../helpers/githubHelper');

exports.checkStatus = (req, res) => {
    if (req.isAuthenticated()) {
        res.json({
            connected: true,
            user: req.user,
            integrationDate: req.user.integrationDate,
            githubToken: req.user.accessToken,
        });
    } else {
        res.json({
            connected: false,
        });
    }
};

exports.logout = (req, res) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
};

exports.removeIntegration = async (req, res) => {
    try {
        await GitHubIntegration.findOneAndDelete({ githubId: req.user.githubId });
        req.logout((err) => {
            if (err) {
                return next(err);
            }
            res.json({ message: 'Integration removed successfully' });
        });
    } catch (err) {
        console.log('err', err);
        res.status(500).json({ message: 'Error removing integration' });
    }
};

exports.fetchOrganizationsAndRepos = async (req, res) => {
    const page = parseInt(req.query.page) || 1; 
    const limit = parseInt(req.query.limit) || 10; 

    try {
        const organizations = await fetchOrganizations(req.githubToken, page, limit);
        let repos = [];
        await Promise.all(organizations.map(async (org) => {
            const orgRepos = await fetchReposForOrg(org, req.githubToken, page, limit);
            repos = [...repos, ...orgRepos];
        }));

        res.json({ repos });
    } catch (err) {
        console.log('Error fetching organizations and repositories:', err);
        res.status(500).json({ message: 'Error fetching organizations and repositories' });
    }
};

exports.fetchRepositoryInfo = async (req, res) => {
    const { owner, repos } = req.body;

    try {
        const axiosInstance = createAxiosInstance(req.githubToken);

        const repoDataArray = await Promise.all(repos.map(async (repo) => {
            try {
                return await fetchRepoData(owner, repo, axiosInstance);
            } catch (error) {
                console.error(`Error fetching data for ${owner}/${repo}:`, error.message);
                return null;
            }
        }));

        const validRepoData = repoDataArray.filter(Boolean);
        res.json(validRepoData);
    } catch (error) {
        console.error(`Error in fetchRepositoryInfo:`, error.message);
        res.status(500).json({ message: 'Error fetching repository information' });
    }
};

exports.fetchCommits = async (req, res) => {
    const { owner, repo } = req.body;

    try {
        const axiosInstance = createAxiosInstance(req.githubToken);
        const commitsResponse = await axiosInstance.get(`/repos/${owner}/${repo}/commits`);
        res.json(commitsResponse.data);
    } catch (error) {
        console.error(`Error fetching commits for ${owner}/${repo}:`, error.message);
        res.status(500).json({ message: 'Error fetching commits' });
    }
};

exports.fetchPullRequests = async (req, res) => {
    const { owner, repo } = req.body;

    try {
        const axiosInstance = createAxiosInstance(req.githubToken);
        const pullRequestsResponse = await axiosInstance.get(`/repos/${owner}/${repo}/pulls?state=all`);
        res.json(pullRequestsResponse.data);
    } catch (error) {
        console.error(`Error fetching pull requests for ${owner}/${repo}:`, error.message);
        res.status(500).json({ message: 'Error fetching pull requests' });
    }
};
