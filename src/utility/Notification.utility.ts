import HttpErrors from "http-errors";
import crypto from "crypto";

// Email

// Notification

// OTP
export const GenerateOtp = (bytes?: number, expirationDuration?: number) => {
    if (bytes && bytes > 4)
        throw new HttpErrors.InternalServerError(
            "Bytes must be less than equal to 4 bytes"
        );
    const size = bytes || 4;
    const expires = expirationDuration || 300000; // 5 minutes (miliseconds)
    const rd = crypto.randomBytes(size).toString("hex");
    const otp = Number.parseInt(`0x${rd}`, 16);
    return {
        otp,
        exp: Date.now() + expires,
    };
};

export const SendOTP = async (otp: number, toPhoneNumber: string) => {
    const accountSid = process.env.TWILIO_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    const client = require("twilio")(accountSid, authToken);

    const res = await client.messages.create({
        body: `Your OTP is ${otp}`,
        from: "+18126333178",
        to: toPhoneNumber,
    });

    return res;
};

// Payment Nofication or Email
