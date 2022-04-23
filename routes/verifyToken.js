const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    const token = req.session.authToken;
    console.log(token);
    if(!token) return res.status(401).send('ACCESS DENIED');
    // if(!token) return res.status(401).redirect('/');
    try {
        const verified = jwt.verify(token, process.env.TOKEN_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        console.log(error);
        res.status(400).send('INVALID TOKEN');
    }
}