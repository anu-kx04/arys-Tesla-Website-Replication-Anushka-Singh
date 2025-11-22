
const isAuthenticated = (req, res, next) => {
    
    if (req.session.user) {
        // User is authenticated, proceed to the next middleware or route handler
        next();
    } else {
        // User is not authenticated
        res.status(401).json({ message: 'Authentication required to access this resource.' });
    }
};

module.exports = {
    isAuthenticated,
};