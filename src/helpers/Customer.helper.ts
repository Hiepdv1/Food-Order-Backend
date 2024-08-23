import HttpErrors from "http-errors";
import { DeliveryModel } from "../models";
import { OrderModel } from "../models/Order.model";
import { ResponseVendorAddress } from "../dto";
import { SetAssignOrderForDeliveryRollback } from "../Rollbacks/Customer.rollback";
import { ObjectId } from "mongoose";

// const calculateDistance = (
//     lat1: number,
//     lng1: number,
//     lat2: number,
//     lng2: number
// ) => {
//     const toRad = (value: number) => (value * Math.PI) / 180;
//     const R = 6371; // Radius of the Earth in km
//     const dLat = toRad(lat2 - lat1);
//     const dLng = toRad(lng2 - lng1);

//     // Solution 2: - Vincenty -

//     // Haversine
//     const a =
//         Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//         Math.cos(toRad(lat1)) *
//             Math.cos(toRad(lat2)) *
//             Math.sin(dLng / 2) *
//             Math.sin(dLng / 2);

//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

//     return R * c; // Distance in km
// };

const calculateAverageLocation = (
    locations: Array<{ lat: number; lng: number }>
) => {
    const total = locations.reduce(
        (acc, loc) => {
            acc.lat += loc.lat;
            acc.lng += loc.lng;
            return acc;
        },
        { lat: 0, lng: 0 }
    );

    return {
        lat: total.lat / locations.length,
        lng: total.lng / locations.length,
    };
};

export const AssignOrderForDelivery = async (
    orderId: string,
    pincodes: Array<string>,
    vendorLocations: Array<ResponseVendorAddress>,
    customerLocation: { lat: number; lng: number }
) => {
    const vendorCoords = vendorLocations.map((vendor) => vendor.locations);
    vendorCoords.push(customerLocation);
    const averageLocation = calculateAverageLocation(vendorCoords);

    const findDeliverys = DeliveryModel.find(
        {
            verified: true,
            isAvailable: true,
            locations: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [averageLocation.lng, averageLocation.lat],
                    },
                },
            },
        },
        { locations: 1, _id: 1 }
    )
        .lean()
        .sort({ "dailyOrder.count": 1 })
        .limit(10);

    const findOrder = OrderModel.findById(orderId);

    const [deliveryPersons, currentOrder] = await Promise.all([
        findDeliverys,
        findOrder,
    ]);

    if (!currentOrder) throw new HttpErrors.BadRequest("Order not found");

    if (deliveryPersons.length === 0)
        throw new HttpErrors.Forbidden(
            "No delivery service available for the specified pincodes"
        );

    // let nearestDeliveryPerson = null;
    // let minDistance = Infinity;

    // for (const deliveryPerson of deliveryPersons) {
    //     if (deliveryPerson.locations) {
    //         const distance = calculateDistance(
    //             averageLocation.lat,
    //             averageLocation.lng,
    //             deliveryPerson.locations.coordinates[0],
    //             deliveryPerson.locations.coordinates[1]
    //         );

    //         if (distance < minDistance) {
    //             minDistance = distance;
    //             nearestDeliveryPerson = deliveryPerson;
    //         }
    //     }
    // }

    // if (!nearestDeliveryPerson)
    //     throw new HttpErrors.Forbidden(
    //         "No delivery service available for the specified locations"
    //     );

    SetAssignOrderForDeliveryRollback(currentOrder.id);

    currentOrder.deliveryId = deliveryPersons[0]._id.toString();
    return await currentOrder.save();
};
