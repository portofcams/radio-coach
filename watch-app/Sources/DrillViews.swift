import SwiftUI
import WatchKit

// A flashcard micro-drill: show a prompt, tap to reveal the spoken form, advance.
private struct Flashcard: View {
    let prompt: String
    let answer: String
    let next: () -> Void
    @State private var revealed = false

    var body: some View {
        VStack(spacing: 10) {
            Text(prompt)
                .font(.system(size: 34, weight: .bold, design: .monospaced))
                .minimumScaleFactor(0.5)
                .lineLimit(2)
            if revealed {
                Text(answer)
                    .font(.headline)
                    .foregroundStyle(.cyan)
                    .multilineTextAlignment(.center)
            } else {
                Text("tap to reveal")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            Spacer(minLength: 4)
            Button(revealed ? "Next" : "Reveal") {
                WKInterfaceDevice.current().play(.click)
                if revealed { revealed = false; next() } else { revealed = true }
            }
            .buttonStyle(.borderedProminent)
            .tint(.cyan)
        }
        .padding()
        .contentShape(Rectangle())
        .onTapGesture { if !revealed { revealed = true } }
    }
}

struct PhoneticDrillView: View {
    @State private var ch: Character = "A"
    private var pool: [Character] { Array("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") }
    private var answer: String { Phonetics.alphabet[ch] ?? Phonetics.digits[ch] ?? String(ch) }
    var body: some View {
        Flashcard(prompt: String(ch), answer: answer) { ch = pool.randomElement()! }
            .navigationTitle("Phonetic")
            .onAppear { ch = pool.randomElement()! }
    }
}

struct NumbersDrillView: View {
    @State private var item = Numbers.random()
    var body: some View {
        Flashcard(prompt: item.display, answer: item.spoken) { item = Numbers.random() }
            .navigationTitle("Numbers")
    }
}

struct CallsignDrillView: View {
    @State private var cs = Phonetics.randomCallsign()
    var body: some View {
        Flashcard(prompt: cs, answer: Phonetics.say(cs)) { cs = Phonetics.randomCallsign() }
            .navigationTitle("Callsign")
    }
}
