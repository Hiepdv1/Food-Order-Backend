import { CustomerModel } from "../models";
import { OrderModel } from "../models/Order.model";
import { rollbacks } from "../utility/Rollback.utility";

// ---------------------------------- Create Order Controller ----------------------------------------------------
export const SetCreatedOrderRollback = (
    orderId: string,
    customerId: string
) => {
    rollbacks.set("createdOrderRollback", async () => {
        const deleteOrder = OrderModel.deleteOne({ _id: orderId });
        const updateOrder = CustomerModel.findOneAndUpdate(
            {
                _id: customerId,
                orders: {
                    $elemMatch: {
                        $eq: orderId,
                    },
                },
            },
            {
                $pull: {
                    orders: orderId,
                },
            },
            { new: true }
        );
        await Promise.all([deleteOrder, updateOrder]);
    });
};

export const SetAssignOrderForDeliveryRollback = (orderId: string) => {
    rollbacks.set("AssignOrderForDeliveryRollback", async () => {
        await OrderModel.updateOne(
            {
                _id: orderId,
            },
            {
                $set: {
                    deliveryId: null,
                },
            }
        );
    });
};
