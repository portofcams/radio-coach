import SwiftUI
import StoreKit

// Solo Pilot subscription paywall. Purchases go through IAPManager (StoreKit 2)
// and are verified server-side; on success we refresh the account's entitlement
// so the rest of the app unlocks immediately.
struct PaywallView: View {
    @Environment(AuthManager.self) private var auth
    @Environment(\.dismiss) private var dismiss
    @State private var iap = IAPManager()
    @State private var showLogin = false

    private let perks = [
        "Unlimited scenario grading — no daily cap",
        "Full advanced library: emergencies, Class B, CRAFT clearances",
        "Every facility and difficulty",
        "Priority on new scenarios",
    ]

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                VStack(spacing: 6) {
                    Text("SOLO PILOT").font(.caption).fontWeight(.bold).tracking(2).foregroundStyle(Color.accentColor)
                    Text("Unlock the full trainer").font(.title2).fontWeight(.semibold)
                    Text("Train every call, graded like a CFI.")
                        .font(.subheadline).foregroundStyle(.secondary)
                }
                .padding(.top, 12)

                VStack(alignment: .leading, spacing: 12) {
                    ForEach(perks, id: \.self) { perk in
                        HStack(alignment: .top, spacing: 10) {
                            Image(systemName: "checkmark.circle.fill").foregroundStyle(Color.accentColor).accessibilityHidden(true)
                            Text(perk).font(.subheadline)
                            Spacer(minLength: 0)
                        }
                    }
                }
                .padding()
                .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 12))

                if !auth.isSignedIn {
                    // A subscription is tied to an account (server verifies the
                    // purchase against the signed-in user), so a guest signs in first.
                    Text("Create a free account to subscribe — it keeps your Pro access tied to you across devices.")
                        .font(.subheadline).foregroundStyle(.secondary).multilineTextAlignment(.center)
                    Button {
                        showLogin = true
                    } label: {
                        Text("Sign in or create an account").frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)
                } else if let product = iap.products.first {
                    Button {
                        Task {
                            if await iap.purchase(product) {
                                await auth.refreshEntitlement()
                                dismiss()
                            }
                        }
                    } label: {
                        Group {
                            if iap.isPurchasing {
                                ProgressView()
                            } else {
                                Text("Subscribe — \(product.displayPrice)/mo")
                            }
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)
                    .disabled(iap.isPurchasing)
                } else {
                    ProgressView().frame(maxWidth: .infinity).padding()
                }

                if auth.isSignedIn {
                    Button("Restore purchases") {
                        Task {
                            if await iap.restore() {
                                await auth.refreshEntitlement()
                                dismiss()
                            }
                        }
                    }
                    .font(.subheadline)
                    .disabled(iap.isPurchasing)
                }

                if let error = iap.errorMessage {
                    Text(error).font(.caption).foregroundStyle(.red).multilineTextAlignment(.center)
                }

                Text("Recurring billing, cancel anytime in Settings. Payment is charged to your Apple Account.")
                    .font(.caption2).foregroundStyle(.secondary).multilineTextAlignment(.center)

                if let product = iap.products.first {
                    Text("Solo Pilot — \(product.displayPrice) per month, auto-renews monthly until canceled.")
                        .font(.caption2).foregroundStyle(.secondary).multilineTextAlignment(.center)
                }

                HStack(spacing: 16) {
                    Link("Terms of Use (EULA)", destination: URL(string: "https://clearsparradio.binnacleai.com/terms")!)
                    Link("Privacy Policy", destination: URL(string: "https://clearsparradio.binnacleai.com/privacy")!)
                }
                .font(.caption2)
            }
            .padding(20)
        }
        .navigationTitle("Go Pro")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("Close") { dismiss() }
            }
        }
        .task { await iap.loadProducts() }
        .sheet(isPresented: $showLogin) {
            NavigationStack {
                LoginView()
                    .toolbar {
                        ToolbarItem(placement: .topBarTrailing) {
                            Button("Close") { showLogin = false }
                        }
                    }
            }
        }
        .onChange(of: auth.isSignedIn) { _, signedIn in
            if signedIn { showLogin = false }
        }
    }
}
