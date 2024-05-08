// Import necessary modules and types
import {
    query,
    update,
    text,
    Record,
    StableBTreeMap,
    Variant,
    Vec,
    Principal,
    Opt,
    nat64,
    Result,
    bool,
    Canister,
    Duration
} from "azle";
import { Ledger, binaryAddressFromPrincipal, hexAddressFromPrincipal } from "azle/canisters/ledger";
import { v4 as uuidv4 } from "uuid";

// Define record types for Shoe
type ShoeId = string;
type ShoeName = string;
type Description = string;
type Location = string;
type Price = bigint;
type Size = string;
type ShoeURL = string;
type SoldAmount = bigint;
type Like = number;
type Comments = string;

const ShoeRecord = Record({
    id: text,
    name: text,
    description: text,
    location: text,
    price: nat64,
    size: text,
    seller: Principal,
    shoeURL: text,
    soldAmount: nat64,
    like: int8,
    comments: text
});

// Define a shoe Payload record
type ShoePayload = {
    name: ShoeName,
    description: Description,
    location: Location,
    price: Price,
    size: Size,
    shoeURL: ShoeURL
};

// Define record types for Order
type OrderId = string;
type PaymentPending = string;
type Completed = string;
type OrderStatus = PaymentPending | Completed;

const OrderStatusVariant = Variant({
    PaymentPending: text,
    Completed: text
});

type OrderRecord = {
    shoeId: ShoeId,
    price: Price,
    status: OrderStatus,
    seller: Principal,
    paidAtBlock: Opt<nat64>,
    memo: nat64
};

// Define a Message variant for response messages
type NotFound = string;
type NotOwner = string;
type Owner = string;
type InvalidPayload = string;
type PaymentFailed = string;
type PaymentCompleted = string;

const MessageVariant = Variant({
    NotFound: text,
    NotOwner: text,
    Owner: text,
    InvalidPayload: text,
    PaymentFailed: text,
    PaymentCompleted: text
});

// Define stable storage maps
const shoesStorage = StableBTreeMap<ShoeId, ShoeRecord>(0);
const persistedOrders = StableBTreeMap<Principal, OrderRecord>(2);
const pendingOrders = StableBTreeMap<nat64, OrderRecord>(3);

const ORDER_RESERVATION_PERIOD: Duration = 120n;

// Define the Ledger canister
const icpCanister = Ledger(Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai"));

// Define the canister interface
const ShoeMarket = Canister({

    // Query function to retrieve details of every shoe in store
    getShoes: query([], Vec(ShoeRecord), () => shoesStorage.values()),

    // Query function to retrieve details of a specific shoe by its ID
    getShoe: query([text], Result(ShoeRecord, MessageVariant), (id) => {
        const productOpt = shoesStorage.get(id);
        if (!productOpt) {
            return Result.Err({ NotFound: `Shoe with id=${id} not found` });
        }
        return Result.Ok(productOpt);
    }),

    // Function to add a new shoe to the market
    addShoe: update([ShoePayload], Result(ShoeRecord, MessageVariant), (payload) => {
        if (!payload) {
            return Result.Err({ InvalidPayload: "Invalid payload" });
        }

        const shoeId = uuidv4();
        const shoe: ShoeRecord = {
            id: shoeId,
            seller: ic.caller(),
            soldAmount: 0n,
            like: 0,
            comments: "",
            ...payload
        };
        shoesStorage.insert(shoeId, shoe);
        return Result.Ok(shoe);
    }),

    // Query function to search for shoes by name
    searchShoe: query([text], Vec(ShoeRecord), (name) => {
        const shoes = shoesStorage.values();
        return shoes.filter((shoe) => shoe.name.toLowerCase().includes(name.toLowerCase()));
    }),

    // Function to get the total number of shoes in the store
    getNoOfShoes: query([], int32, () => shoesStorage.len().toInt()),

    // Function to update shoe details
    updateShoe: update([ShoeRecord], Result(ShoeRecord, MessageVariant), (updatedShoe) => {
        const shoeId = updatedShoe.id;
        const existingShoe = shoesStorage.get(shoeId);
        if (!existingShoe) {
            return Result.Err({ NotFound: `Shoe with id=${shoeId} not found` });
        }
        shoesStorage.insert(shoeId, updatedShoe);
        return Result.Ok(updatedShoe);
    }),

    // Function to delete a shoe by its ID
    deleteShoeById: update([text], Result(text, MessageVariant), (id) => {
        const shoe = shoesStorage.get(id);
        if (!shoe) {
            return Result.Err({ NotFound: `Shoe with id=${id} not found` });
        }
        if (shoe.seller !== ic.caller()) {
            return Result.Err({ NotOwner: "Only the seller can delete the shoe" });
        }
        shoesStorage.remove(id);
        return Result.Ok(`Shoe with id=${id} deleted successfully`);
    }),

    // Function to like a shoe
    likeShoe: update([text], Result(ShoeRecord, MessageVariant), (id) => {
        const shoe = shoesStorage.get(id);
        if (!shoe) {
            return Result.Err({ NotFound: `Shoe with id=${id} not found` });
        }
        shoe.like++;
        shoesStorage.insert(id, shoe);
        return Result.Ok(shoe);
    }),

    // Function to insert a comment for a shoe
    insertComment: update([text, text], Result(text, MessageVariant), (id, comment) => {
        const shoe = shoesStorage.get(id);
        if (!shoe) {
            return Result.Err({ NotFound: `Shoe with id=${id} not found` });
        }
        shoe.comments += `\n${comment}`;
        shoesStorage.insert(id, shoe);
        return Result.Ok(`Comment added successfully for shoe with id=${id}`);
    }),

    // Function to get comments for a shoe
    getComments: query([text], text, (id) => {
        const shoe = shoesStorage.get(id);
        if (!shoe) {
            return "Shoe not found";
        }
        return shoe.comments;
    }),

    // Function to create an order for a shoe
    createOrder: update([text], Result(OrderRecord, MessageVariant), (shoeId) => {
        const shoe = shoesStorage.get(shoeId);
        if (!shoe) {
            return Result.Err({ NotFound: `Shoe with id=${shoeId} not found` });
        }
        const order: OrderRecord = {
            shoeId: shoe.id,
            price: shoe.price,
            status: "PaymentPending",
            seller: shoe.seller,
            paidAtBlock: null,
            memo: generateCorrelationId(shoe.id)
        };
        pendingOrders.insert(order.memo, order);
        discardByTimeout(order.memo, ORDER_RESERVATION_PERIOD);
        return Result.Ok(order);
    }),

    // Function to complete a purchase
    completePurchase: update([Principal, text, nat64, nat64, nat64], Result(OrderRecord, MessageVariant), async (seller, shoeId, price, block, memo) => {
        const paymentVerified = await verifyPaymentInternal(seller, price, block, memo);
        if (!paymentVerified) {
            return Result.Err({ PaymentFailed: `Payment verification failed for memo=${memo}` });
        }
        const pendingOrder = pendingOrders.remove(memo);
        if (!pendingOrder) {
            return Result.Err({ NotFound: `Pending order with memo=${memo} not found` });
        }
        const updatedOrder: OrderRecord = { ...pendingOrder, status: "Completed", paidAtBlock: block };
        const shoe = shoesStorage.get(shoeId);
        if (!shoe) {
            throw Error(`Shoe with id=${shoeId} not found`);
        }
        shoe.soldAmount++;
        shoesStorage.insert(shoeId, shoe);
        persistedOrders.insert(ic.caller(), updatedOrder);
        return Result.Ok(updatedOrder);
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
