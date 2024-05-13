import { query, update, text, Record, StableBTreeMap, Variant, Vec, None, Some,int32, Ok, Err, ic, Principal, Opt, nat64, Duration, Result, bool, Canister, int8} from "azle";
import {
    Ledger, binaryAddressFromAddress, binaryAddressFromPrincipal, hexAddressFromPrincipal
} from "azle/canisters/ledger";
// @ts-ignore
import { hashCode } from "hashcode";
import { v4 as uuidv4 } from "uuid";

// Define record types for Shoe
const Shoe = Record({
    id: text,
    name: text,
    description: text,
    location: text,
    price: nat64,
    size:text,
    seller: Principal,
    shoeURL: text,
    soldAmount: nat64,
    like: int8,
    liked: Vec(text),
    comments: Vec(text)
});

// Define a shoe Payload record
const ShoePayload = Record({
    name: text,
    description: text,
    location: text,
    price: nat64,
    size:text,
    shoeURL: text,   
});

const OrderStatus = Variant({
    PaymentPending: text,
    Completed: text
});

// Define record types for Order
const Order = Record({
    shoeId: text,
    price: nat64,
    status: OrderStatus,
    seller: Principal,
    paid_at_block: Opt(nat64),
    memo: nat64
});

// Define a Message variant for response messages
const Message = Variant({
    NotFound: text,
    NotOwner:text,
    Owner: text,
    InvalidPayload: text,
    PaymentFailed: text,
    PaymentCompleted: text,
    AlreadyLiked: text,
});


const shoesStorage = StableBTreeMap(0, text, Shoe); // Define a StableBTreeMap to store Shoe by their IDs
const persistedOrders = StableBTreeMap(2, Principal, Order);
const pendingOrders = StableBTreeMap(3, nat64, Order);



const ORDER_RESERVATION_PERIOD = 120n;

// Define the Ledger canister
const icpCanister = Ledger(Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai"));

// Define the canister interface
export default Canister({

// Query function to retrieve details of every shoe in store
getShoes: query([], Vec(Shoe), () => {
    return shoesStorage.values();
}),

getOrders: query([], Vec(Order), () => {
    return persistedOrders.values();
}),

getPendingOrders: query([], Vec(Order), () => {
    return pendingOrders.values();
}),

// Query function to retrieve details of a specific shoe by its ID
getShoe: query([text], Result(Shoe, Message), (id) => {
    if(!isValidUuid(id)){
        return Err({InvalidPayload: `Id=${id} is not in the valid uuid format.`})
    }
    const productOpt = shoesStorage.get(id);
    if ("None" in productOpt) {
        return Err({ NotFound: `shoe with id=${id} not found` });
    }
    return Ok(productOpt.Some);
}),

// Function to add a new shoe to the market
addShoe: update([ShoePayload], Result(Shoe, Message), (payload) => {
    if (typeof payload !== "object" || Object.keys(payload).length === 0) {
        return Err({ NotFound: "invalid payoad" })
    }
    // @ts-ignore
    const validatePayloadErrors = validateShoePayload(payload);
    if (validatePayloadErrors.length){
        return Err({InvalidPayload: `Invalid payload. Errors=[${validatePayloadErrors}]`});
    }

    const shoeId = uuidv4();
    const shoe = {
         id: shoeId, 
         seller: ic.caller(),
         soldAmount: 0n, 
         like:0,
         liked: [],
         comments:[],
         ...payload
         
     };
    shoesStorage.insert(shoe.id, shoe);
    return Ok(shoe);
}),


//query function that search for a shoe product by name
searchShoe: query([text], Vec(Shoe), (name) => {
    const shoes = shoesStorage.values();
    return shoes.filter((shoes) =>
      shoes.name.toLowerCase().includes(name.toLowerCase())
    );
}),


 //query function that gets total numbers of shoes in store 
getNoOfShoes: query([], int32, () => {
    return Number(shoesStorage.len().toString()); // Return shoe count
}),


// Function to update shoe details
updateShoe: update([text, ShoePayload], Result(Shoe, Message), (id, payload) => {
    if(!isValidUuid(id)){
        return Err({InvalidPayload: `Id=${id} is not in the valid uuid format.`})
    }
    // @ts-ignore
    const validatePayloadErrors = validateShoePayload(payload);
    if (validatePayloadErrors.length){
        return Err({InvalidPayload: `Invalid payload. Errors=[${validatePayloadErrors}]`});
    }

    const productOpt = shoesStorage.get(id);
    if ("None" in productOpt) {
        return Err({ NotFound: `cannot update the shoe: shoe with id=${id} not found` });
    }
    const product = productOpt.Some; 
    if(product.seller.toString() !== ic.caller().toString()){
        return Err({NotOwner: "You are not the seller of this shoe"})
    }
    let updatedProduct = {...product, ...payload};
    shoesStorage.insert(product.id, updatedProduct);
    return Ok(updatedProduct);
}),


 // Function to delete a shoe by its ID
deleteShoeById: update([text], Result(text, Message), (id) => {
    if(!isValidUuid(id)){
        return Err({InvalidPayload: `Id=${id} is not in the valid uuid format.`})
    }
    const shoeOpt = shoesStorage.get(id);
    if ("None" in shoeOpt) {
        return Err({ NotFound: `cannot delete the shoe: shoe with id=${id} not found` });
    }
    if (shoeOpt.Some.seller.toString() !== ic.caller().toString()) {
        return Err({ 
            NotOwner: "only seller can delete shoe" 
        });
      }
    const deletedProductOpt = shoesStorage.remove(id);
    return Ok(deletedProductOpt.Some.id);
}),

// Function that likes a shoe 
likeShoe: update([text], Result(Shoe, Message), (id) => {
    if(!isValidUuid(id)){
        return Err({InvalidPayload: `Id=${id} is not in the valid uuid format.`})
    }
    const shoeOpt = shoesStorage.get(id);

    if ("None" in shoeOpt) {
        return Err({ NotFound: `cannot like the shoe: shoe with id=${id} not found` });
    }
    const shoe = shoeOpt.Some;
    if(shoe.liked.includes(ic.caller().toString())){
        return Err({AlreadyLiked: "Caller has already liked this shoe"})
    }
    shoe.like += 1;
    shoe.liked.push(ic.caller().toString());

    shoesStorage.insert(shoe.id, shoe)
    return Ok(shoe);
}),

 
// Function to insert a comment for a shoe
insertComment: update([text, text], Result(Vec(text), Message), (id, comment) => {
    if(!isValidUuid(id)){
        return Err({InvalidPayload: `Id=${id} is not in the valid uuid format.`})
    }
    if(isInvalidString(comment)){
        return Err({InvalidPayload: `Comment cannot be empty`})
    }
    const shoeOpt = shoesStorage.get(id);
    if ("None" in shoeOpt) {
        return Err({ NotFound: `cannot add comment: shoe with id=${id} not found` });
    }
    const shoe = shoeOpt.Some;

    shoe.comments.push(comment);
    shoesStorage.insert(shoe.id, shoe);
    return Ok(shoe.comments);
}),


//query function that gets comments
getComments: query([text], Result(Vec(text), Message), (id) => {
    if(!isValidUuid(id)){
        return Err({InvalidPayload: `Id=${id} is not in the valid uuid format.`})
    }
    const shoeOpt = shoesStorage.get(id);
    if ("None" in shoeOpt) {
        return Err({InvalidPayload: "shoe with id=" + id + " not found"});
    }
    return Ok(shoeOpt.Some.comments);
}), 


// Function to create an order for a shoe
createOrder: update([text], Result(Order, Message), (id) => {
    if(!isValidUuid(id)){
        return Err({InvalidPayload: `Id=${id} is not in the valid uuid format.`})
    }
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

 // Function to complete a purchase
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


// Helper function that trims the input string and then checks the length
// The string is empty if true is returned, otherwise, string is a valid value
function isInvalidString(str: text): boolean {
    return str.trim().length == 0
  }

  // Helper function to ensure the input id meets the format used for ids generated by uuid
  function isValidUuid(id: string): boolean {
    const regexExp = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;
    return regexExp.test(id);
}


  /**
  * Helper function to validate the ShoePayload
  */
  function validateShoePayload(payload: typeof ShoePayload): Vec<string>{
    const errors: Vec<text> = [];
    // @ts-ignore
    if (isInvalidString(payload.name)){
        errors.push(`name='${payload.name}' cannot be empty.`)
    }
    // @ts-ignore
    if (isInvalidString(payload.description)){
        errors.push(`description='${payload.description}' cannot be empty.`)
    }
    // @ts-ignore
    if (isInvalidString(payload.location)){
        errors.push(`location='${payload.location}' cannot be empty.`)
    }
    // @ts-ignore
    if (isInvalidString(payload.shoeURL)){
        errors.push(`shoeURL='${payload.shoeURL}' cannot be empty.`)
    }
    // @ts-ignore
    if (isInvalidString(payload.size)){
        errors.push(`size='${payload.size}' cannot be empty.`)
    }
    return errors;
  }

