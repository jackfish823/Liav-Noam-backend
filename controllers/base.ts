import { Model } from "mongoose";
import { Request, Response } from "express";

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
            console.log(error);
            res.status(500).json({ message: error });
        }
    }

    async getAll(req: Request, res: Response) {
        try {
            const filter = req.query;
            const list = await this.model.find(filter);

            res.status(200).json(list);
        } catch (error) {
            res.status(500).json({ message: error });
        }
    }

    async getById(req: Request, res: Response) {
        try {
            const obj = await this.model.findById(req.params.id);

            if (!obj) {
                res.status(404).json({ message: "Not found" });
                return;
            }

            res.status(200).json(obj);
        } catch (error) {
            res.status(500).json({ message: error });

        }
    }

    async put(req: Request, res: Response) {
        try {
            const obj = await this.model.findByIdAndUpdate(req.params.id, req.body, { new: true });

            if (!obj) {
                res.status(404).json({ message: "Not found" });
                return;
            }

            res.status(200).json(obj);
        } catch (error) {
            res.status(500).json({ message: error });
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const obj = await this.model.findByIdAndDelete(req.params.id);

            if (!obj) {
                res.status(404).json({ message: "Not found" });
                return;
            }

            res.status(200).json(obj);
        } catch (error) {
            res.status(500).json({ message: error });
        }
    }
}

const createController = <T>(model: Model<T>) => new BaseController<T>(model);

export { createController }