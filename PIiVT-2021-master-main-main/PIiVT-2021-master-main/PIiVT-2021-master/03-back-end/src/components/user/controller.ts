import BaseController from "../../common/BaseController";
import { Request, Response, NextFunction } from "express";
import UserModel from "./model";
import IErrorResponse from "../../common/IErrorResponse.interface";
import { IAddUser, IAddUserValidator, } from "./dto/AddUser";
import { IEditUser, IEditUserValidator } from "./dto/EditUser";
import * as nodemailer from "nodemailer";
import Config from "../../config/dev";

class UserController extends BaseController {
    public async getAll(req: Request, res: Response, next: NextFunction) {
        const users = await this.services.userService.getAll();
        res.send(users);
    }

    public async getById(req: Request, res: Response, next: NextFunction) {
        const id = +(req.params.id);
        const userId: number = +id;

        if (userId <= 0) {
            res.sendStatus(400);
            return;
        }

        const data: UserModel|null|IErrorResponse = await this.services.userService.getById(userId);

        if (data === null) {
            res.sendStatus(404);
            return;
        }

        if (data instanceof UserModel) {
            res.send(data);
            return;
        }

        res.status(500).send(data);
    }

    public async add(req: Request, res: Response, next: NextFunction) {
        const data = req.body;

        if (!IAddUserValidator(data)) {
            res.status(400).send(IAddUserValidator.errors);
            return;
        }

        const result =  await this.services.userService.add(data as IAddUser);

        res.send(result);
    }

    public async edit(req: Request, res: Response, next: NextFunction) {
        const data = req.body;
        const id = +(req.params.id);
        const userId: number = +id

        if (userId <= 0) {
            res.status(400).send("Invalid ID number");
            return;
        }
        if (!IEditUserValidator(data)) {
            res.status(400).send(IEditUserValidator.errors);
            return;
        }

        const result =  await this.services.userService.edit(userId, data as IEditUser);

        if (result === null) {
            res.sendStatus(404);
            return;
        }

        res.send(result);
    }

    public async delete(req: Request, res: Response, next: NextFunction) {
        const id = +(req.params.id);    

        if (id <= 0) return res.status(400).send("The ID value cannot be smaller than 1");

        res.send(await this.services.userService.delete(id));
    }

    private async sendRegistrationEmail(data: UserModel): Promise<IErrorResponse> {
        return new Promise<IErrorResponse>(async resolve => {
            const transport = nodemailer.createTransport({
                host: Config.mail.hostname,
                port: Config.mail.port,
                secure: Config.mail.secure,
                auth: {
                    user: Config.mail.username,
                    pass: Config.mail.password
                },
                debug: Config.mail.debug,
            },
            {
                from: Config.mail.fromEmail,
            });

            transport.sendMail({
                to: data.email,
                subject: "Account registration notification",
                html: `
                    <!doctype html>
                    <html>
                        <head>
                            <meta charset="utf-8">
                        </head>
                        <body>
                            <p>
                            Your account was successfully created. with this email ${data.email}
                            </p>
                            <p>
                                You can log in to the portal with your email and password.
                            </p>
                        </body>
                    </html>
                `
            })
            .then(() => {
                transport.close();
                resolve({
                    errorCode: 0,
                    errorMessage: ""
                });
            })
            .catch(error => {
                transport.close();
                resolve({
                    errorCode: -1,
                    errorMessage: error?.message,
                });
            });
        })
    }

    public async register(req: Request, res: Response, next: NextFunction) {
        const data = req.body;

        if (!IAddUserValidator(data)) {
            res.status(400).send(IAddUserValidator.errors);
            return;
        }

        const result: UserModel|IErrorResponse =  await this.services.userService.add(data as IAddUser);

        if (!(result instanceof UserModel)) {
            if (result.errorMessage.includes("uq_user_email")) {
                return res.status(400).send("An account already exists with this email");
            }
            
            return res.status(400).send(result);
        }

        const mailResult = await this.sendRegistrationEmail(result);

        if (mailResult.errorCode !== 0) {
            
        }

        res.send(result);
    }
}

export default UserController;