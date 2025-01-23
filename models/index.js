const user = req.oidc.user
req.user = user


module.exports = {
    User,
    user
}