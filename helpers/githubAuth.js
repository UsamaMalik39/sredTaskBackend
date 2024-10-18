const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const GitHubIntegration = require('../models/gitHubIntegration');

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await GitHubIntegration.findById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL
},
async (accessToken, refreshToken, profile, done) => {
    try {
        let integration = await GitHubIntegration.findOne({ githubId: profile.id });

        if (!integration) {
            integration = new GitHubIntegration({
                githubId: profile.id,
                username: profile.username,
                accessToken: accessToken
            });
            await integration.save();
        } else {
            integration.accessToken = accessToken;
            await integration.save();
        }
        done(null, integration);
    } catch (err) {
        done(err, null);
    }
}));
