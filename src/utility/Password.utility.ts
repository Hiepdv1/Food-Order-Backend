import HttpError from "http-errors";
import bcrypt from "bcrypt";

export const GenerateSalt = async (rounds?: number) => {
    return await bcrypt.genSalt(rounds);
};

export const GeneratePassword = async (password: string, salt: string) => {
    return await bcrypt.hash(password, salt);
};

export const ValidatePassword = async (password: string, hash: string) => {
    const isValid = await bcrypt.compare(password, hash);
    if (!isValid)
        throw new HttpError.Unauthorized("The password is not correct");
};
