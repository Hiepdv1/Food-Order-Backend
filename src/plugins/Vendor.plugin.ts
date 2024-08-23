import { Schema } from "mongoose";

export function RemoveFieldsPlugin(schema: Schema) {
    schema.post(
        ["find", "findOne", ],
        function (docs: Partial<any> | Partial<any>[]) {
            if (Array.isArray(docs)) {
                docs.forEach((doc: Partial<any>) => {
                    delete doc.__v;
                    delete doc.createdAt;
                    delete doc.updatedAt;
                    delete doc.password;
                });
            } else {
                delete docs.__v;
                delete docs.createdAt;
                delete docs.updatedAt;
                delete docs.password;
            }
        }
    );
}
