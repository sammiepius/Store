import { query, update, text, Record, StableBTreeMap, Variant, Vec, None, Some, Ok, Err, ic, Principal, Opt, nat64, Duration, Result, bool, Canister } from "azle";
import {
    Ledger, binaryAddressFromAddress, binaryAddressFromPrincipal, hexAddressFromPrincipal
} from "azle/canisters/ledger";
import { hashCode } from "hashcode";
import { v4 as uuidv4 } from "uuid";

const Shoe = Record({
    id: text,
    name: text,
    description: text,
    location: text,
    price: nat64,
    // quantity: text,
    size:text,
    seller: Principal,
    shoeURL: text,
    soldAmount: nat64
});

const shoePayload = Record({
    name: text,
    description: text,
    location: text,
    price: nat64,
    size:text,
    shoeURL: text,
    
    // quantity: text,
    
    
});

const OrderStatus = Variant({
    PaymentPending: text,
    Completed: text
});

const Order = Record({
    shoeId: text,
    price: nat64,
    status: OrderStatus,
    seller: Principal,
    paid_at_block: Opt(nat64),
    memo: nat64
});

const Message = Variant({
    NotFound: text,
    InvalidPayload: text,
    PaymentFailed: text,
    PaymentCompleted: text
});

const shoesStorage = StableBTreeMap(0, text, Shoe);
const persistedOrders = StableBTreeMap(1, Principal, Order);
const pendingOrders = StableBTreeMap(2, nat64, Order);


const ORDER_RESERVATION_PERIOD = 120n;

const icpCanister = Ledger(Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai"));

export default Canister({

getShoes: query([], Vec(Shoe), () => {
    return shoesStorage.values();
}),

getOrders: query([], Vec(Order), () => {
    return persistedOrders.values();
}),

getPendingOrders: query([], Vec(Order), () => {
    return pendingOrders.values();
}),

getShoe: query([text], Result(Shoe, Message), (id) => {
    const productOpt = shoesStorage.get(id);
    if ("None" in productOpt) {
        return Err({ NotFound: `shoe with id=${id} not found` });
    }
    return Ok(productOpt.Some);
}),


//function that search for a shoe product
//  searchShoe: query([text], Vec(Shoe), (name) => {
//     // const shoes = shoesStorage.values();
//     // return shoes.filter((shoes) =>
//     //   shoes.name.toLowerCase().includes(name.toLowerCase())
//     // );

//     try {
//         // const lowerCaseKeyword = keyword.toLowerCase();
//         const result = shoesStorage.values().filter((shoe) => {
//           const lowerCaseName = shoe.name.toLowerCase();
//           const value = lowerCaseName.includes(name.toLowerCase());
//           return value;
//         });
//         return Result.Ok(Shoe);
//       } catch (error) {
//         return Err({
//             NotFound: `An error occurred while searching for shoe products err=${error}`,
//           });
//       }
//   }),

//   "An error occurred while searching for shoe products."

 addShoe: update([shoePayload], Result(Shoe, Message), (payload) => {
    if (typeof payload !== "object" || Object.keys(payload).length === 0) {
        return Err({ NotFound: "invalid payoad" })
    }
    const shoe = { id: uuidv4(), soldAmount: 0n, seller: ic.caller(), ...payload };
    shoesStorage.insert(shoe.id, shoe);
    return Ok(shoe);
}),

updateShoe: update([Shoe], Result(Shoe, Message), (payload) => {
    const productOpt = shoesStorage.get(payload.id);
    if ("None" in productOpt) {
        return Err({ NotFound: `cannot update the shoe: shoe with id=${payload.id} not found` });
    }
    shoesStorage.insert(productOpt.Some.id, payload);
    return Ok(payload);
}),

deleteShoeById: update([text], Result(text, Message), (id) => {
    const deletedProductOpt = shoesStorage.remove(id);
    if ("None" in deletedProductOpt) {
        return Err({ NotFound: `cannot delete the shoe: shoe with id=${id} not found` });
    }
    return Ok(deletedProductOpt.Some.id);
}),




createOrder: update([text], Result(Order, Message), (id) => {
    const productOpt = shoesStorage.get(id);
    if ("None" in productOpt) {
        return Err({ NotFound: `cannot create the order: shoe=${id} not found` });
    }
    const shoe = productOpt.Some;
    const order = {
        shoeId: shoe.id,
        price: shoe.price,
        status: { PaymentPending: "PAYMENT_PENDING" },
        seller: shoe.seller,
        paid_at_block: None,
        memo: generateCorrelationId(id)
    };
    pendingOrders.insert(order.memo, order);
    discardByTimeout(order.memo, ORDER_RESERVATION_PERIOD);
    return Ok(order);
}),

completePurchase: update([Principal, text, nat64, nat64, nat64], Result(Order, Message), async (seller, id, price, block, memo) => {
    const paymentVerified = await verifyPaymentInternal(seller, price, block, memo);
    if (!paymentVerified) {
        return Err({ NotFound: `cannot complete the purchase: cannot verify the payment, memo=${memo}` });
    }
    const pendingOrderOpt = pendingOrders.remove(memo);
    if ("None" in pendingOrderOpt) {
        return Err({ NotFound: `cannot complete the purchase: there is no pending order with id=${id}` });
    }
    const order = pendingOrderOpt.Some;
    const updatedOrder = { ...order, status: { Completed: "COMPLETED" }, paid_at_block: Some(block) };
    const productOpt = shoesStorage.get(id);
    if ("None" in productOpt) {
        throw Error(`shoe with id=${id} not found`);
    }
    const shoe = productOpt.Some;
    shoe.soldAmount += 1n;
    shoesStorage.insert(shoe.id, shoe);
    persistedOrders.insert(ic.caller(), updatedOrder);
    return Ok(updatedOrder);
}),


verifyPayment: query([Principal, nat64, nat64, nat64], bool, async (receiver, amount, block, memo) => {
    return await verifyPaymentInternal(receiver, amount, block, memo);
}),

    // not used right now. can be used for transfers from the canister for instances when a marketplace can hold a balance account for users
    makePayment: update([text, nat64], Result(Message, Message), async (to, amount) => {
    const toPrincipal = Principal.fromText(to);
    const toAddress = hexAddressFromPrincipal(toPrincipal, 0);
    const transferFeeResponse = await ic.call(icpCanister.transfer_fee, { args: [{}] });
    const transferResult = ic.call(icpCanister.transfer, {
        args: [{
            memo: 0n,
            amount: {
                e8s: amount
            },
            fee: {
                e8s: transferFeeResponse.transfer_fee.e8s
            },
            from_subaccount: None,
            to: binaryAddressFromAddress(toAddress),
            created_at_time: None
        }]
    });
    if ("Err" in transferResult) {
        return Err({ PaymentFailed: `payment failed, err=${transferResult.Err}` })
    }
    return Ok({ PaymentCompleted: "payment completed" });
  })
});

/*
    a hash function that is used to generate correlation ids for orders.
    also, we use that in the verifyPayment function where we check if the used has actually paid the order
*/
function hash(input: any): nat64 {
    return BigInt(Math.abs(hashCode().value(input)));
};

// a workaround to make uuid package work with Azle
globalThis.crypto = {
    // @ts-ignore
    getRandomValues: () => {
        let array = new Uint8Array(32);

        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }

        return array;
    }
};

function generateCorrelationId(shoeId: text): nat64 {
    const correlationId = `${shoeId}_${ic.caller().toText()}_${ic.time()}`;
    return hash(correlationId);
};

/*
    after the order is created, we give the `delay` amount of minutes to pay for the order.
    if it's not paid during this timeframe, the order is automatically removed from the pending orders.
*/
function discardByTimeout(memo: nat64, delay: Duration) {
    ic.setTimer(delay, () => {
        const order = pendingOrders.remove(memo);
        console.log(`Order discarded ${order}`);
    });
};

async function verifyPaymentInternal(receiver: Principal, amount: nat64, block: nat64, memo: nat64): Promise<bool> {
    const blockData = await ic.call(icpCanister.query_blocks, { args: [{ start: block, length: 1n }] });
    const tx = blockData.blocks.find((block) => {
        if ("None" in block.transaction.operation) {
            return false;
        }
        const operation = block.transaction.operation.Some;
        const senderAddress = binaryAddressFromPrincipal(ic.caller(), 0);
        const receiverAddress = binaryAddressFromPrincipal(receiver, 0);
        return block.transaction.memo === memo &&
            hash(senderAddress) === hash(operation.Transfer?.from) &&
            hash(receiverAddress) === hash(operation.Transfer?.to) &&
            amount === operation.Transfer?.amount.e8s;
    });
    return tx ? true : false;
};