import SwiftUI

// Native port of src/app/oral/page.tsx — a mock-oral deck: hear the examiner's
// question, answer aloud, reveal the model answer + key points, self-grade.
@Observable
@MainActor
final class OralViewModel {
    private let radio = RadioPlayer()
    private let speech = SpeechFallbackPlayer()
    private let client = NetworkClient.shared
    private struct TTSRequest: Encodable { let text: String }

    var deck: [OralQuestion]
    var index = 0
    var revealed = false
    var isLoadingAudio = false
    var got = 0
    var review = 0
    var usingFallbackVoice = false

    var current: OralQuestion? { index < deck.count ? deck[index] : nil }
    var isDone: Bool { index >= deck.count }

    init() { deck = PracticeData.oralQuestions.shuffled() }

    func hearExaminer() async {
        guard let q = current else { return }
        usingFallbackVoice = false
        if let bundled = BundledAudio.data(for: q.id) {
            radio.play(bundled)
            return
        }
        isLoadingAudio = true
        defer { isLoadingAudio = false }
        do {
            let bytes = try await client.requestBytes("/api/tts", body: TTSRequest(text: q.question))
            radio.play(bytes)
        } catch {
            usingFallbackVoice = true
            speech.speak(q.question)
        }
    }

    func rate(gotIt: Bool) {
        if gotIt { got += 1 } else { review += 1 }
        revealed = false
        index += 1
    }

    func restart() {
        deck = PracticeData.oralQuestions.shuffled()
        index = 0; revealed = false; got = 0; review = 0
    }
}

struct OralView: View {
    @State private var model = OralViewModel()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                if let q = model.current {
                    Text("\(q.area.uppercased())  ·  \(model.index + 1)/\(model.deck.count)")
                        .font(.caption).fontWeight(.bold).tracking(1).foregroundStyle(.secondary)

                    Text(q.question).font(.title3).fontWeight(.medium)

                    Button {
                        Task { await model.hearExaminer() }
                    } label: {
                        Label(model.isLoadingAudio ? "Loading…" : "Hear the examiner",
                              systemImage: "speaker.wave.2.fill")
                    }
                    .buttonStyle(.bordered)
                    .disabled(model.isLoadingAudio)

                    if model.usingFallbackVoice {
                        Label("Backup voice — primary ATC voice is unavailable right now", systemImage: "waveform.badge.exclamationmark")
                            .font(.caption).foregroundStyle(.orange)
                    }

                    if model.revealed {
                        VStack(alignment: .leading, spacing: 12) {
                            Text(q.answer).font(.subheadline)
                            VStack(alignment: .leading, spacing: 6) {
                                Text("KEY POINTS").font(.caption2).fontWeight(.bold).tracking(1).foregroundStyle(.secondary)
                                ForEach(q.keyPoints, id: \.self) { point in
                                    Label(point, systemImage: "checkmark.circle.fill")
                                        .font(.subheadline)
                                        .labelStyle(.titleAndIcon)
                                }
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding()
                        .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 12))

                        HStack {
                            Button("Review this") { model.rate(gotIt: false) }
                                .buttonStyle(.bordered).tint(.orange)
                            Button("I had it →") { model.rate(gotIt: true) }
                                .buttonStyle(.borderedProminent)
                        }
                        .frame(maxWidth: .infinity)
                    } else {
                        Text("Answer out loud, like a real checkride — then reveal.")
                            .font(.subheadline).foregroundStyle(.secondary)
                        Button("Reveal answer") { model.revealed = true }
                            .frame(maxWidth: .infinity)
                            .buttonStyle(.borderedProminent)
                            .controlSize(.large)
                    }
                } else {
                    // Summary
                    VStack(spacing: 12) {
                        Text("Deck complete").font(.title2).fontWeight(.semibold)
                        Text("You felt solid on \(model.got) and flagged \(model.review) to review.")
                            .font(.subheadline).foregroundStyle(.secondary).multilineTextAlignment(.center)
                        Button("Run it again") { model.restart() }
                            .buttonStyle(.borderedProminent).controlSize(.large)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.top, 40)
                }
            }
            .padding(20)
        }
        .navigationTitle("Mock Oral")
        .navigationBarTitleDisplayMode(.inline)
    }
}
