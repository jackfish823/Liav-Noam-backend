import { createController } from "./base.js";
import { User, IUser } from '../models/User.js';
import express from 'express';

const usersController = createController<IUser>(User);

const router = express.Router();

router.get('/', usersController.getAll.bind(usersController));

router.get('/:id', usersController.getById.bind(usersController));

router.post('/', usersController.post.bind(usersController));

router.put('/:id', usersController.put.bind(usersController));

router.delete('/:id', usersController.delete.bind(usersController));

export default router;
