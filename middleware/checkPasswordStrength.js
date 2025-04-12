import zxcvbn from 'zxcvbn';

function checkPasswordStrength(req, res, next) {
    const {password} = req.body;
    const result = zxcvbn(password);
    if (result.score < 3) {
        return res.status(400).json({ message: "Pick a stronger password" });
    }
    next();
}

export default checkPasswordStrength;