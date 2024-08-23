export interface CreateDeliveryUserInputs {
    email: string;
    password: string;
    phone: string;
    firstName: string;
    lastName: string;
    address: string;
    pincode: string;
    locations: {
        lat: number;
        lng: number;
    };
}

export interface EditDeliveryProfileInputs {
    firstName: string;
    lastName: string;
    address: string;
}

export interface DeliveryLoginInputs {
    email: string;
    password: string;
}
