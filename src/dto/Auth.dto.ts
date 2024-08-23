import { VendorPayload } from "./Vendor.dto";
import { CustomerPayload } from "./Customer.dto";
import { ManagementUserPayload } from "./Managementuser.dto";

export type AuthPayload =
    | VendorPayload
    | CustomerPayload
    | ManagementUserPayload;
