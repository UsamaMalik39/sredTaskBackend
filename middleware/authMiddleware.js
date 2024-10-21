exports.checkGitHubToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(400).json({ message: 'GitHub token not provided' });
    }
    req.githubToken = token;
    next();
};
