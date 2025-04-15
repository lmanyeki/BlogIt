import { PrismaClient} from '@prisma/client';
const client = new PrismaClient;

async function validateEmailAndUsername(req, res, next) {
    const {emailAddress, username } = req.body;
    try {
        const userWithEmail = await client.user.findFirst({
            where: { emailAddress }
        })
        if (userWithEmail) {
            return res.status(400).json({ message: "Email address already in use."})
        }

        const userWithUsername = await client.user.findFirst({
            where: { username }
        })
        if (userWithUsername) {
            return res.status(400).json({ message: "Username already in use."})
        }
        next();
    } catch (e) {
        res.status(500).json({ message: "Error validating username and email."})
    }
}

export default validateEmailAndUsername;