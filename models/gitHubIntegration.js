const mongoose = require('mongoose');

const GitHubIntegrationSchema = new mongoose.Schema({
    githubId: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    accessToken: {
        type: String,
        required: true
    },
    integrationDate: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('GitHubIntegration', GitHubIntegrationSchema, 'github-integration');
