import Ajv from 'ajv';

interface IAddProfile {
    name: string;
    description: string | null;
    pricePerUnit: number;
    manufacturerId: number;
    categoryId: number;
    status: string; //enum
}

interface IUploadPhoto {
    imagePath: string;  
}

const ajv = new Ajv();

const IAddProfileValidator = ajv.compile({
    type: "object",
    properties: {
        name: {
            type: "string",
            minLength: 2,
            maxLength: 50,
        },
        description: {
            type: ["string", "null"],
            maxLength: 255,
        },
        pricePerUnit: {
            type: "number",
            multipleOf: 0.01,

        },
        manufacturerId: {
            type: "number",
            minimum: 1,

        },
        categoryId: {
            type: "number",
            minimum: 1,
        },
        status: {
            type: "string",
        },
    },
    required: [
        "name",
        "pricePerUnit",
        "manufacturerId",
        "categoryId",
        "status",
    ],
    additionalProperties: false
});

export { IAddProfile };
export { IAddProfileValidator };
export { IUploadPhoto }