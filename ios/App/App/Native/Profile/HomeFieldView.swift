import SwiftUI

// Callsign editor + home-field setter (native port of those Profile widgets).
// Callsign: PUT /api/user/callsign. Home field: look up an ICAO via
// GET /api/airports?ident=, then save via PUT /api/user/homefield { ident } —
// the server pulls real frequencies/runways to build scenarios at your field.
struct HomeFieldView: View {
    @Environment(AuthManager.self) private var auth
    @State private var callsign = ""
    @State private var ident = ""
    @State private var lookup: AirportLookup.Field?
    @State private var lookupError: String?
    @State private var isLooking = false
    @State private var saved = false
    @State private var isRequesting = false
    @State private var requestResult: String?

    private let client = NetworkClient.shared
    private struct CallsignBody: Encodable { let callsign: String }
    private struct CallsignResp: Decodable { let callsign: String? }
    private struct HomeBody: Encodable { let ident: String }
    private struct Empty: Decodable {}
    private struct RequestBody: Encodable { let ident: String }
    private struct RequestResp: Decodable { let requestCount: Int; let alreadyRequested: Bool }

    var body: some View {
        Section {
            HStack {
                TextField("N-number, e.g. N172SP", text: $callsign)
                    .textInputAutocapitalization(.characters)
                    .autocorrectionDisabled()
                    .onSubmit { saveCallsign() }
                if !callsign.isEmpty {
                    Button("Save") { saveCallsign() }.font(.caption)
                }
            }
        } header: {
            Text("Your aircraft callsign")
        } footer: {
            Text("Used in your scenarios instead of a generic tail number.")
        }

        Section {
            HStack {
                TextField("ICAO ident, e.g. PHNL", text: $ident)
                    .textInputAutocapitalization(.characters)
                    .autocorrectionDisabled()
                    .onSubmit { Task { await lookUp() } }
                Button(isLooking ? "…" : "Look up") { Task { await lookUp() } }
                    .font(.caption)
                    .disabled(ident.count < 3 || isLooking)
            }

            if let f = lookup {
                VStack(alignment: .leading, spacing: 4) {
                    Text("\(f.name)").font(.subheadline).fontWeight(.medium)
                    Text("\(f.city) · \(f.towered ? "Towered" : "Non-towered")")
                        .font(.caption).foregroundStyle(.secondary)
                    if !f.runways.isEmpty {
                        Text("Runways: \(f.runways.joined(separator: ", "))")
                            .font(.caption).foregroundStyle(.secondary)
                    }
                    Button("Set as my home field") { Task { await saveHome() } }
                        .buttonStyle(.borderedProminent).controlSize(.small)
                        .padding(.top, 2)
                }
            }
            if let e = lookupError {
                Text(e).font(.caption).foregroundStyle(.red)
                if requestResult == nil {
                    Button(isRequesting ? "Requesting…" : "Request \(ident.uppercased()) be added to the real-data library") {
                        requestField()
                    }
                    .font(.caption)
                    .disabled(isRequesting)
                }
            }
            if let r = requestResult {
                Text(r).font(.caption).foregroundStyle(.green)
            }
            if saved {
                Label("Home field saved", systemImage: "checkmark.circle.fill")
                    .font(.caption).foregroundStyle(.green)
            }
        } header: {
            Text("Your home field")
        } footer: {
            Text("Enter your field's ICAO ident — we pull its real frequencies and runways to build scenarios at your airport.")
        }
        .onAppear { callsign = auth.currentUser?.callsign ?? "" }
    }

    private func saveCallsign() {
        Task {
            if let r = try? await client.request(
                "/api/user/callsign", method: "PUT", body: CallsignBody(callsign: callsign), as: CallsignResp.self
            ) {
                callsign = r.callsign ?? ""
            }
        }
    }

    private func lookUp() async {
        lookupError = nil; lookup = nil; saved = false; requestResult = nil
        isLooking = true
        defer { isLooking = false }
        let code = ident.uppercased()
        guard let res = try? await client.request("/api/airports?ident=\(code)", as: AirportLookup.self) else {
            lookupError = "Couldn't reach the lookup service."
            return
        }
        if let field = res.field { lookup = field }
        else { lookupError = "No field found for \(code)." }
    }

    private func saveHome() async {
        guard let f = lookup else { return }
        _ = try? await client.request("/api/user/homefield", method: "PUT", body: HomeBody(ident: f.icao), as: Empty.self)
        saved = true
    }

    private func requestField() {
        Task {
            isRequesting = true
            defer { isRequesting = false }
            let code = ident.uppercased()
            guard let r = try? await client.request(
                "/api/airports/request", method: "POST", body: RequestBody(ident: code), as: RequestResp.self
            ) else { return }
            requestResult = r.alreadyRequested
                ? "You've already asked for \(code) — \(r.requestCount) pilot\(r.requestCount == 1 ? "" : "s") waiting."
                : "Requested — you're pilot #\(r.requestCount) asking for \(code)."
        }
    }
}
