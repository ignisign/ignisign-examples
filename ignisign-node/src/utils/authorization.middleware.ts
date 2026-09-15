const jwt = require('jsonwebtoken');

// SECURITY: JWT secret must be set via environment variable
const secretKey = process.env.JWT_SECRET;

if (!secretKey) {
  throw new Error('CRITICAL SECURITY ERROR: JWT_SECRET environment variable is not set. This is required for secure token generation and verification.');
}

export const checkBearerToken = (req, res, next) => {
  const token = req.headers.authorization;
  if (token && token.startsWith('Bearer ')) {
    const accessToken = token.substring(7);

    jwt.verify(accessToken, secretKey, (err, decoded) => {
      if (err) {
        res.status(401).json({ error: 'Unauthorized' });
      } else {
        // Token is valid, proceed to next middleware or route
        // req.user = decoded; // Store the decoded token payload in the request object if needed
        next();
      }
    });
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

export const generateBearerToken = () => {
  const payload = {};

  const options = {
    expiresIn: '1h'
  };

  const token = jwt.sign(payload, secretKey, options);
  return token;
};