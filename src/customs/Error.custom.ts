class ErrorCustom extends Error {
    public isOperational: boolean = true;
    public status: string;
    public statusCode: number = 500;
    public path?: string;
    public value?: any;
    public errorType: string;
    public name;
    public code?: number;

    public constructor(
        message: string,
        statusCode: number,
        errorType?: string,
        name?: string
    ) {
        super(message);
        this.statusCode = statusCode;
        this.status = statusCode >= 400 && statusCode < 500 ? "fail" : "Error";
        this.errorType = errorType || "Internal Error";
        this.name = name || "Error";

        Error.captureStackTrace(this, this.constructor);
    }
}

export default ErrorCustom;
