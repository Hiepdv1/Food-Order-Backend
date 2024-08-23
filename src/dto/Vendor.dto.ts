export interface CreateVendorInput {
    name: string;
    ownerName: string;
    foodTypes: Array<string>;
    pincode: string;
    address: string;
    phone: string;
    email: string;
    password: string;
    locations: {
        lat: number;
        lng: number;
    };
}

export interface EditVendorInputs {
    phone: string;
    address: string;
    name: string;
    foodTypes: Array<string>;
}

export interface VendorLoginInputs {
    email: string;
    password: string;
}

export interface VendorPayload {
    _id: string;
    email: string;
    name: string;
    foodTypes: Array<string>;
}

export interface VendorProcessOrder {
    status: string;
    remarks: string;
    time: number;
}

export interface CreateOfferInputs {
    offerType: string;
    vendors: Array<any>;
    title: string;
    description: string;
    offerAmount: number;
    startValidity: Date;
    endValidity: Date;
    promoCode: string;
    promoType: string;
    bank: Array<String>;
    bins: Array<Number>;
    pincode: string;
    minValue: number;
    isActive: boolean;
}

export interface LocationInputs {
    lat: number;
    lng: number;
    _csrf: string;
}
