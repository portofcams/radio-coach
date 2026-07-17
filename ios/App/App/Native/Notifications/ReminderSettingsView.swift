import SwiftUI

// Daily local-reminder toggle + time picker for the Profile screen. Device-local
// UNUserNotificationCenter (see NotificationManager) — no server, works for guests.
struct ReminderSettingsView: View {
    @State private var notif = NotificationManager.shared
    @State private var working = false

    var body: some View {
        Section {
            Toggle("Daily practice reminder", isOn: Binding(
                get: { notif.enabled },
                set: { on in
                    working = true
                    Task {
                        if on { await notif.enableReminder() }
                        else { notif.disableReminder() }
                        working = false
                    }
                }
            ))
            .disabled(working)

            if notif.enabled {
                DatePicker("Remind me at", selection: $notif.reminderTime,
                           displayedComponents: .hourAndMinute)
                    .onChange(of: notif.reminderTime) { _, _ in
                        Task { await notif.timeChanged() }
                    }
            }
        } header: {
            Text("Reminder")
        } footer: {
            if notif.permissionDenied {
                Text("Notifications are turned off for Clearspar. Turn them on in Settings → Notifications → Clearspar to get your daily nudge.")
            } else {
                Text("A once-a-day nudge to run a scenario and keep your phraseology sharp.")
            }
        }
        .task { await notif.refreshStatus() }
    }
}
