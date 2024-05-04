import { Principal } from "@dfinity/principal";
import { transferICP } from "./ledger";

// add shoe to the store
export async function createShoe(shoe) {
    return window.canister.marketplace.addShoe(shoe);
}

// delete shoe by the shoe id
export async function deleteShoeById(id) {
    return window.canister.marketplace.deleteShoeById(id);
}

// like a shoe
export async function likeShoe(id) {
    return window.canister.marketplace.likeShoe(id);
}


// addComment
export async function createComment(comment) {
    return window.canister.marketplace.addComment(comment);
}

// getComment
export async function getComments() {
    return window.canister.marketplace.getComments();
  }


// getNoOfShoes
export async function getNoOfShoes() {
    return window.canister.marketplace.getNoOfShoes();
  }


export async function getShoes() {
    try {
        return await window.canister.marketplace.getShoes();
    } catch (err) {
        if (err.name === "AgentHTTPResponseError") {
            const authClient = window.auth.client;
            await authClient.logout();
        }
        return [];
    }
}

export async function buyShoe(shoe) {
    const marketplaceCanister = window.canister.marketplace;
    const orderResponse = await marketplaceCanister.createOrder(shoe.id);
    const sellerPrincipal = Principal.from(orderResponse.Ok.seller);
    const sellerAddress = await marketplaceCanister.getAddressFromPrincipal(sellerPrincipal);
    const block = await transferICP(sellerAddress, orderResponse.Ok.price, orderResponse.Ok.memo);
    await marketplaceCanister.completePurchase(sellerPrincipal, shoe.id, orderResponse.Ok.price, block, orderResponse.Ok.memo);
}