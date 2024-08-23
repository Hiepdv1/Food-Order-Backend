export interface CreateManagementUserInput {
    name: string;
    email: string;
    password: string;
    role: string;
    permissions: Array<string>;
}

export interface ManagementUserLoginInput {
    email: string;
    password: string;
}

export interface ManagementUserPayload {
    _id: string;
    email: string;
}
