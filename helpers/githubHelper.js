const axios = require('axios');

const createAxiosInstance = (token) => {
    return axios.create({
        baseURL: 'https://api.github.com',
        headers: {
            Authorization: `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
        },
    });
};

const fetchOrganizations = async (token) => {
    const response = await axios.get('https://api.github.com/user/orgs', {
        headers: {
            Authorization: `Bearer ${token}`,
            'X-GitHub-Api-Version': '2022-11-28',
        },
    });
    return response.data;
};

const fetchReposForOrg = async (org, token) => {
    const response = await axios.get(`https://api.github.com/orgs/${org.login}/repos`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data;
};

const fetchRepoData = async (owner, repo, axiosInstance) => {
    const [repoData, commits, issues, pullRequests] = await Promise.all([
        axiosInstance.get(`/repos/${owner}/${repo}`),
        axiosInstance.get(`/repos/${owner}/${repo}/commits?per_page=1`),
        axiosInstance.get(`/repos/${owner}/${repo}/issues?state=all&per_page=1`),
        axiosInstance.get(`/repos/${owner}/${repo}/pulls?state=all&per_page=1`),
    ]);

    const getCount = (response) => {
        const totalCount = response.headers['x-total-count'];
        return totalCount !== undefined ? parseInt(totalCount, 10) : response.data.length;
    };

    return {
        user_id: repoData.data.owner.id,
        user: repoData.data.owner.login,
        total_commits: getCount(commits),
        total_issues: getCount(issues),
        total_pull_requests: getCount(pullRequests),
        repo_name: repo,
    };
};

module.exports = {
    createAxiosInstance,
    fetchOrganizations,
    fetchReposForOrg,
    fetchRepoData,
};