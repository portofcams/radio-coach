import Foundation
import StoreKit

// Native StoreKit 2 purchases — the plain-Swift successor to IAPPlugin.swift
// (which wrapped this same logic in a Capacitor bridge). After a purchase or
// restore we hand Apple's signed transaction (jwsRepresentation) to
// /api/iap/verify; the server verifies the signature chain and unlocks Pro, so
// this manager is never trusted on its own. Product IDs mirror
// src/lib/apple-iap.ts IAP_PRODUCT_IDS.
@Observable
@MainActor
final class IAPManager {
    static let productIDs = ["com.binnacleai.radiocoach.pro.monthly"]

    var products: [Product] = []
    var isPurchasing = false
    var errorMessage: String?

    private let client = NetworkClient.shared
    private struct VerifyRequest: Encodable { let jws: String }
    private struct VerifyResponse: Decodable { let pro: Bool }

    func loadProducts() async {
        do {
            products = try await Product.products(for: Self.productIDs)
                .sorted { $0.price < $1.price }
        } catch {
            errorMessage = "Couldn't load subscription options."
        }
    }

    /// Buy → verify server-side → returns whether Pro is now active.
    @discardableResult
    func purchase(_ product: Product) async -> Bool {
        errorMessage = nil
        isPurchasing = true
        defer { isPurchasing = false }
        do {
            let result = try await product.purchase()
            switch result {
            case .success(let verification):
                guard case .verified(let transaction) = verification else {
                    errorMessage = "That purchase couldn't be verified."
                    return false
                }
                await transaction.finish()
                return await verifyWithServer(verification.jwsRepresentation)
            case .userCancelled:
                return false
            case .pending:
                errorMessage = "Your purchase is pending approval."
                return false
            @unknown default:
                return false
            }
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }

    /// Restore prior purchases — prompts App Store auth, then verifies the latest entitlement.
    @discardableResult
    func restore() async -> Bool {
        errorMessage = nil
        isPurchasing = true
        defer { isPurchasing = false }
        try? await AppStore.sync()
        var latest: String?
        for await entitlement in Transaction.currentEntitlements {
            if case .verified = entitlement { latest = entitlement.jwsRepresentation }
        }
        guard let jws = latest else {
            errorMessage = "No purchases to restore."
            return false
        }
        return await verifyWithServer(jws)
    }

    private func verifyWithServer(_ jws: String) async -> Bool {
        do {
            let res: VerifyResponse = try await client.request(
                "/api/iap/verify", method: "POST", body: VerifyRequest(jws: jws)
            )
            return res.pro
        } catch {
            errorMessage = "Purchase succeeded but couldn't be confirmed — try Restore."
            return false
        }
    }
}
