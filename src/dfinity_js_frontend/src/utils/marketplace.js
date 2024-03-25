import { Principal } from "@dfinity/principal";
import { transferICP } from "./ledger";

export async function createShoe(shoe) {
    return window.canister.marketplace.addShoe(shoe);
}
export async function deleteShoeById(id) {
    return window.canister.marketplace.deleteShoeById(id);
}
export async function likeShoe(id) {
    return window.canister.marketplace.likeShoe(id);
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