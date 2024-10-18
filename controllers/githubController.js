const GitHubIntegration = require('../models/gitHubIntegration');
const axios = require('axios'); 

exports.checkStatus = (req, res) => {
    if (req.isAuthenticated()) {
        res.json({
            connected: true,
            user: req.user,
            integrationDate: req.user.integrationDate,
            githubToken: req.user.accessToken 
        });
    } else {
        res.json({
            connected: false
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
        console.log('err',err)
        res.status(500).json({ message: 'Error removing integration' });
    }
};

exports.fetchOrganizationsAndRepos = async (req, res) => {

    const token = req.headers.authorization?.split(' ')[1]; 

    if (!token) {
        return res.status(400).json({ message: 'GitHub token not provided' });
    }

    try {
        const orgsResponse = await axios.get(`https://api.github.com/user/orgs`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'X-GitHub-Api-Version': '2022-11-28' 
            }
        });
        const organizations = orgsResponse.data;
        let repos = []
        await Promise.all(organizations.map(async (org) => {
            const reposResponse = await axios.get(`https://api.github.com/orgs/${org.login}/repos`, {
                headers: {
                    Authorization: `Bearer ${token}` ,
                    
                }
            });
            repos=[...repos,...reposResponse.data];
        }));

        res.json({ repos });
    } catch (err) {
        console.log('Error fetching organizations and repositories:', err);
        res.status(500).json({ message: 'Error fetching organizations and repositories' });
    }
};


exports.fetchRepositoryInfo = async (req, res) => {
    const { owner, repos } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(400).json({ message: 'GitHub token not provided' });
    }

    try {
        const axiosInstance = axios.create({
            baseURL: 'https://api.github.com',
            headers: {
                Authorization: `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
            },
        });

        const repoDataArray = await Promise.all(repos.map(async (repo) => {
            try {
                const [repoData, commits, issues, pullRequests] = await Promise.all([
                    axiosInstance.get(`/repos/${owner}/${repo}`),
                    axiosInstance.get(`/repos/${owner}/${repo}/commits?per_page=1`),
                    axiosInstance.get(`/repos/${owner}/${repo}/issues?state=all&per_page=1`),
                    axiosInstance.get(`/repos/${owner}/${repo}/pulls?state=all&per_page=1`),
                ]);

                const getCount = (response) => {
                    const totalCount = response.headers['x-total-count'];
                    if (totalCount !== undefined) {
                        return parseInt(totalCount, 10);
                    }
                    return response.data.length > 0 ? response.data.length : 0; 
                };

                return {
                    user_id: repoData.data.owner.id,
                    user: repoData.data.owner.login,
                    total_commits: getCount(commits),
                    total_issues: getCount(issues),
                    total_pull_requests: getCount(pullRequests),
                    repo_name: repo
                };
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
}
