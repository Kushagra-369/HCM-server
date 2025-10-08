const { errorHandlingdata } = require('../Error/ErrorHandling')
const jwt = require('jsonwebtoken')

exports.authenticate = (req, res, next) => {
    try {
        const token =
            req.headers["x-api-key"] ||
            req.headers["authorization"]?.split(" ")[1];

        if (!token) {
            return res.status(400).send({ status: false, msg: "Token must be present" });
        }

        const decodedToken = jwt.verify(token, process.env.JWT_Admin_SECRET_KEY);

        // Defensive check
        if (!decodedToken?.userId || !decodedToken?.role) {
            return res.status(401).send({ status: false, msg: "Invalid token" });
        }

        req.user = decodedToken;
        next();
    } catch (e) {
        errorHandlingdata(e, res);
    }
};


exports.AdminAuthorize = (req, res, next) => {
    try {
        const { userId, role } = req.user;
        const id = req.params.id;

        if (!id) {
            return res.status(400).send({ status: false, msg: "id must be present" });
        }

        if (role === "admin") {
            return next();
        }

        if (id != userId) {
            return res.status(403).send({ status: false, msg: "Unauthorized user" });
        }

        next();
    } catch (e) {
        errorHandlingdata(e, res);
    }
};

