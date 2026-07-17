import Foundation
import Security

// Stores the auth Bearer token in the Keychain (survives app restarts; a token
// is a credential, not a setting). In DEBUG only, falls back to UserDefaults if
// the Keychain is unavailable — unsigned Simulator builds have no
// application-identifier entitlement, so SecItemAdd fails with -34018 there.
// Release builds are signed and Keychain-only.
enum KeychainHelper {
    private static let service = "com.binnacleai.radiocoach.auth"
    private static let account = "authToken"
    private static let debugKey = "rc_debug_authToken"

    @discardableResult
    static func save(_ token: String) -> Bool {
        let data = Data(token.utf8)
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
        ]
        SecItemDelete(query as CFDictionary)
        var attributes = query
        attributes[kSecValueData as String] = data
        attributes[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlock
        let status = SecItemAdd(attributes as CFDictionary, nil)
        if status == errSecSuccess { return true }
        #if DEBUG
        NSLog("RC_DEBUG: Keychain save failed (\(status)); using UserDefaults fallback")
        UserDefaults.standard.set(token, forKey: debugKey)
        return true
        #else
        return false
        #endif
    }

    static func load() -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]
        var item: CFTypeRef?
        if SecItemCopyMatching(query as CFDictionary, &item) == errSecSuccess,
           let data = item as? Data, let token = String(data: data, encoding: .utf8) {
            return token
        }
        #if DEBUG
        return UserDefaults.standard.string(forKey: debugKey)
        #else
        return nil
        #endif
    }

    static func clear() {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
        ]
        SecItemDelete(query as CFDictionary)
        #if DEBUG
        UserDefaults.standard.removeObject(forKey: debugKey)
        #endif
    }
}
