import {Model} from "mongoose";
import {Request, Response} from "express";

class BaseController<T> {
    model: Model<T>

    constructor(model: Model<T>) {
        this.model = model;
    }

    async post(req: Request, res: Response) {
        const obj = new this.model(req.body);

        try {
            const savedObj = await obj.save();

            res.status(201).json(savedObj);
        } catch (error) {
            console.error({
                message: `Failed to save ${this.model.modelName} to db`,
                error,
                additionalData: {obj}
            });

            res.status(500).json('Failed to save ' + this.model.modelName);
        }
    }

    async getAll(req: Request, res: Response) {
        try {
            const filter = req.query;
            const list = await this.model.find(filter);

            res.status(200).json(list);
        } catch (error) {
            console.error({
                message: `Failed to get all ${this.model.modelName}s from db`,
                error,
            });

            res.status(500).json(`Failed to get all ${this.model.modelName}s`);
        }
    }

    async getById(req: Request, res: Response) {
        try {
            const obj = await this.model.findById(req.params.id);

            if (!obj) {
                res.status(404).json(this.model.modelName + " not found");
                return;
            }

            res.status(200).json(obj);
        } catch (error) {
            const errMsg = `Failed to find ${this.model.modelName} with id ${req.params.id}`
            console.error({
                message: errMsg,
                error,
            });

            res.status(500).json(errMsg);
        }
    }

    async put(req: Request, res: Response) {
        try {
            const obj = await this.model.findByIdAndUpdate(req.params.id, req.body, {new: true});

            if (!obj) {
                res.status(404).json(this.model.modelName + " not found");
                return;
            }

            res.status(200).json(obj);
        } catch (error) {
            const errMsg = `Failed to update ${this.model.modelName} with id ${req.params.id}`
            console.error({
                message: errMsg,
                error,
            });

            res.status(500).json(errMsg);        }
    }

    async delete(req: Request, res: Response) {
        try {
            const obj = await this.model.findByIdAndDelete(req.params.id);

            if (!obj) {
                res.status(404).json(this.model.modelName + " not found");
                return;
            }

            res.status(200).json(obj);
        } catch (error) {
            const errMsg = `Failed to delete ${this.model.modelName} with id ${req.params.id}`
            console.error({
                message: errMsg,
                error,
            });

            res.status(500).json(errMsg);        }
    }
}

const createController = <T>(model: Model<T>) => new BaseController<T>(model);

export {createController}