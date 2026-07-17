import SwiftUI

struct ScenarioDetailView: View {
    let scenarioId: String
    @State private var model: ScenarioViewModel?

    var body: some View {
        Group {
            if let model {
                ScenarioLoadedView(model: model)
            } else {
                ContentUnavailableView("Scenario not found", systemImage: "questionmark.circle")
            }
        }
        .onAppear {
            if model == nil, let s = ScenarioStore.byId(scenarioId) {
                model = ScenarioViewModel(scenario: s)
            }
        }
    }
}

private struct ScenarioLoadedView: View {
    @State var model: ScenarioViewModel
    @ScaledMetric(relativeTo: .largeTitle) private var scoreFontSize: CGFloat = 44

    var body: some View {
        @Bindable var model = model
        return ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                header
                setupCard
                if let diagram = model.scenario.diagram, diagram.chart != nil {
                    AirportDiagramView(diagram: diagram)
                }
                if model.phase == .done, let result = model.result {
                    resultCard(result)
                } else {
                    transcriptView
                }
                if model.usingFallbackVoice {
                    Label("Backup voice — primary ATC voice is unavailable right now", systemImage: "waveform.badge.exclamationmark")
                        .font(.caption).foregroundStyle(.orange)
                }
                controls
                if let error = model.errorMessage {
                    Text(error).font(.subheadline).foregroundStyle(.red)
                }
            }
            .padding(20)
        }
        .navigationTitle(model.scenario.title)
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $model.showPaywall) {
            NavigationStack { PaywallView() }
        }
    }

    private var header: some View {
        HStack(spacing: 8) {
            if let f = model.scenario.facility {
                Text(f.rawValue).font(.caption).fontWeight(.bold)
            }
            if let freq = model.scenario.frequency {
                Text(freq).font(.caption).monospaced().foregroundStyle(.secondary)
            }
            Spacer()
            Text(DifficultyMeta.from(model.scenario.difficulty).label)
                .font(.caption).foregroundStyle(.secondary)
        }
    }

    private var setupCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("SITUATION").font(.caption2).fontWeight(.bold).tracking(1).foregroundStyle(.secondary)
            Text(model.scenario.setup).font(.subheadline)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 12))
    }

    @ViewBuilder private var transcriptView: some View {
        if !model.transcript.isEmpty {
            VStack(alignment: .leading, spacing: 8) {
                Text("YOUR READBACK").font(.caption2).fontWeight(.bold).tracking(1).foregroundStyle(.secondary)
                Text(model.transcript).font(.subheadline).dyslexiaFriendlyReadout()
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding()
            .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 12))
        }
    }

    private func resultCard(_ result: GradeResult) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("\(result.score)").font(.system(size: scoreFontSize, weight: .bold))
                Text(result.passFail.rawValue)
                    .font(.headline)
                    .foregroundStyle(color(for: result.passFail))
                Spacer()
            }
            // Grouped so VoiceOver announces "Score 85, PASS" once, instead of
            // reading the bare number then the verdict as two disconnected fragments.
            .accessibilityElement(children: .ignore)
            .accessibilityLabel("Score \(result.score), \(result.passFail.rawValue)")
            Text(result.feedback).font(.subheadline).dyslexiaFriendlyReadout()
            VStack(alignment: .leading, spacing: 4) {
                Text("What a CFI would say").font(.caption).fontWeight(.semibold).foregroundStyle(.secondary)
                Text(result.cfiTip).font(.caption).dyslexiaFriendlyReadout()
            }
            if !result.elements.missed.isEmpty {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Missed").font(.caption).fontWeight(.semibold).foregroundStyle(.red)
                    ForEach(result.elements.missed, id: \.self) { Text("• \($0)").font(.caption) }
                }
            }
            VStack(alignment: .leading, spacing: 4) {
                Text("Textbook readback").font(.caption).fontWeight(.semibold).foregroundStyle(.secondary)
                Text(result.correctReadback).font(.caption).italic().dyslexiaFriendlyReadout()
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(color(for: result.passFail).opacity(0.1), in: RoundedRectangle(cornerRadius: 12))
    }

    private func color(for pf: GradeResult.PassFail) -> Color {
        switch pf { case .pass: return .green; case .partial: return .orange; case .fail: return .red }
    }

    @ViewBuilder private var controls: some View {
        switch model.phase {
        case .idle:
            actionButton("Play ATC call", systemImage: "play.circle.fill") {
                Task { await model.playATC() }
            }
        case .loadingATC, .playingATC:
            actionButton("Loading…", systemImage: "waveform", disabled: true) {}
        case .ready:
            actionButton("Record readback", systemImage: "mic.circle.fill") {
                Task { await model.startRecording() }
            }
        case .recording:
            actionButton("Stop & grade", systemImage: "stop.circle.fill", tint: .red) {
                Task { await model.stopAndGrade() }
            }
        case .transcribing:
            actionButton("Transcribing…", systemImage: "waveform", disabled: true) {}
        case .grading:
            actionButton("Grading…", systemImage: "checkmark.seal", disabled: true) {}
        case .done:
            actionButton("Try again", systemImage: "arrow.counterclockwise") { model.reset() }
        }
    }

    private func actionButton(
        _ title: String, systemImage: String, tint: Color = .accentColor,
        disabled: Bool = false, action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            Label(title, systemImage: systemImage).frame(maxWidth: .infinity)
        }
        .buttonStyle(.borderedProminent)
        .tint(tint)
        .controlSize(.large)
        .disabled(disabled)
    }
}
