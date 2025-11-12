const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Get token from the Authorization header
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Add the user payload (id, role, email) to the request object
    req.user = decoded.user; 
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};