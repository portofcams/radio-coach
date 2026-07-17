import SwiftUI

// Native port of src/app/listen/page.tsx — hear an ATC transmission, type what
// you heard, get a word-accuracy score. Data from the bundled listening deck.
@Observable
@MainActor
final class ListenViewModel {
    private let radio = RadioPlayer()
    private let speech = SpeechFallbackPlayer()
    private let client = NetworkClient.shared
    private struct TTSRequest: Encodable { let text: String }

    var current: ListenCall
    var played = false
    var isLoadingAudio = false
    var typed = ""
    var result: (pct: Int, targetWords: Int, matched: Int)?
    var errorMessage: String?
    var usingFallbackVoice = false

    init() {
        current = PracticeData.listenCalls.randomElement()
            ?? ListenCall(id: "empty", text: "", context: "")
    }

    func playCall() async {
        errorMessage = nil
        usingFallbackVoice = false
        if let bundled = BundledAudio.data(for: current.id) {
            radio.play(bundled)
            played = true
            return
        }
        isLoadingAudio = true
        defer { isLoadingAudio = false }
        do {
            let bytes = try await client.requestBytes("/api/tts", body: TTSRequest(text: current.text))
            radio.play(bytes)
            played = true
        } catch {
            usingFallbackVoice = true
            speech.speak(current.text)
            played = true
        }
    }

    func check() {
        result = PracticeData.scoreListening(said: typed, target: current.text)
    }

    func next() {
        let pool = PracticeData.listenCalls.filter { $0.id != current.id }
        current = pool.randomElement() ?? current
        played = false
        typed = ""
        result = nil
    }
}

struct ListenView: View {
    @State private var model = ListenViewModel()
    @ScaledMetric(relativeTo: .largeTitle) private var pctFontSize: CGFloat = 36

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text(model.current.context.uppercased())
                    .font(.caption).fontWeight(.bold).tracking(1).foregroundStyle(.secondary)

                Button {
                    Task { await model.playCall() }
                } label: {
                    Label(model.isLoadingAudio ? "Loading…" : "Play transmission",
                          systemImage: "speaker.wave.2.fill")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
                .disabled(model.isLoadingAudio)

                if model.usingFallbackVoice {
                    Label("Backup voice — primary ATC voice is unavailable right now", systemImage: "waveform.badge.exclamationmark")
                        .font(.caption).foregroundStyle(.orange)
                }

                if model.played {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Type what you heard").font(.subheadline).fontWeight(.medium)
                        TextField("Your readback…", text: Binding(
                            get: { model.typed }, set: { model.typed = $0 }
                        ), axis: .vertical)
                            .lineLimit(3...6)
                            .textFieldStyle(.roundedBorder)
                            .autocorrectionDisabled()
                    }

                    if let r = model.result {
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text("\(r.pct)%").font(.system(size: pctFontSize, weight: .bold))
                                    .foregroundStyle(scoreColor(r.pct))
                                Text("\(r.matched)/\(r.targetWords) words matched")
                                    .font(.subheadline).foregroundStyle(.secondary)
                            }
                            .accessibilityElement(children: .ignore)
                            .accessibilityLabel("\(r.pct) percent, \(r.matched) of \(r.targetWords) words matched")
                            Text("Actual transmission").font(.caption).fontWeight(.semibold).foregroundStyle(.secondary)
                            Text(model.current.text).font(.subheadline).dyslexiaFriendlyReadout()
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding()
                        .background(scoreColor(r.pct).opacity(0.1), in: RoundedRectangle(cornerRadius: 12))

                        Button("Next transmission →") { model.next() }
                            .frame(maxWidth: .infinity)
                            .buttonStyle(.bordered)
                            .controlSize(.large)
                    } else {
                        Button("Check") { model.check() }
                            .frame(maxWidth: .infinity)
                            .buttonStyle(.borderedProminent)
                            .controlSize(.large)
                            .disabled(model.typed.isEmpty)
                    }
                }

                if let error = model.errorMessage {
                    Text(error).font(.subheadline).foregroundStyle(.red)
                }
            }
            .padding(20)
        }
        .navigationTitle("Listen")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func scoreColor(_ pct: Int) -> Color {
        pct >= 85 ? .green : pct >= 60 ? .orange : .red
    }
}
