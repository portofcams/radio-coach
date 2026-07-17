import SwiftUI

// A described plan tier for the Profile "Plans" section. On iOS only Solo Pilot
// is purchasable (StoreKit); Free is the default. CFI Pro / Flight School are
// instructor/school tiers managed on the web and intentionally not shown as an
// in-app purchase surface (Apple 3.1.1 forbids linking out to buy them).
struct PlanInfo: Identifiable {
    let id: String
    let name: String
    let price: String?
    let tagline: String
    let features: [String]

    static let free = PlanInfo(
        id: "free",
        name: "Free",
        price: nil,
        tagline: "Everything you need to start.",
        features: [
            "Ground School, Listen & Oral drills",
            "A set of graded readbacks every day",
            "Student, Intermediate & Advanced calls",
            "Pilot tools & airport diagrams",
        ]
    )

    static let soloPilot = PlanInfo(
        id: "solo",
        name: "Solo Pilot",
        price: "$9.99/mo",
        tagline: "Train every call, no limits.",
        features: [
            "Unlimited grading — no daily cap",
            "Full advanced library: emergencies, IFR clearances, Class B, CRAFT",
            "Every facility and difficulty",
            "Priority on new scenarios",
        ]
    )
}

struct PlanCard: View {
    let plan: PlanInfo
    let isCurrent: Bool
    var action: (() -> Void)?   // upgrade action (Solo Pilot, when not current)

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .firstTextBaseline) {
                Text(plan.name).font(.headline)
                if let price = plan.price {
                    Text(price).font(.subheadline).foregroundStyle(.secondary)
                }
                Spacer()
                if isCurrent {
                    Text("Current")
                        .font(.caption).fontWeight(.semibold)
                        .padding(.horizontal, 8).padding(.vertical, 3)
                        .background(Color.accentColor.opacity(0.15), in: Capsule())
                        .foregroundStyle(Color.accentColor)
                }
            }

            Text(plan.tagline).font(.subheadline).foregroundStyle(.secondary)

            VStack(alignment: .leading, spacing: 6) {
                ForEach(plan.features, id: \.self) { f in
                    HStack(alignment: .top, spacing: 8) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.caption)
                            .foregroundStyle(isCurrent ? Color.accentColor : .secondary)
                            .accessibilityHidden(true)
                        Text(f).font(.caption)
                        Spacer(minLength: 0)
                    }
                }
            }

            if let action, !isCurrent {
                Button(action: action) {
                    Text("Upgrade to \(plan.name)").frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.regular)
                .padding(.top, 2)
            }
        }
        .padding(.vertical, 6)
    }
}
