import express from 'express';

import { authenticationV2 } from '../../middlewares/authentication';
import { AuthController } from '../../controllers/auth.controller';

const authRouter = express.Router();

authRouter.post('/signup', AuthController.signUp);
authRouter.post('/signin', AuthController.signIn);
authRouter.post('/refresh-token', AuthController.refreshToken);

// Require authentication routers
authRouter.use(authenticationV2);

authRouter.post('/signout', AuthController.signOut);

module.exports = authRouter;
