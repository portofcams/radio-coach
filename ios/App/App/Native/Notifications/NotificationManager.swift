import Foundation
import UserNotifications

// Device-local daily "time to train" reminder. Pure UNUserNotificationCenter —
// no APNs, no /api/push/register, no server. The user picks a time on the
// Profile screen and we schedule one repeating UNCalendarNotificationTrigger.
// Local notifications need no entitlement or capability, so this works for
// guests too and doesn't touch the app's signing/provisioning setup.
@Observable
@MainActor
final class NotificationManager {
    static let shared = NotificationManager()

    private let requestID = "rc_daily_reminder"
    private let enabledKey = "rc_reminder_enabled"
    private let hourKey = "rc_reminder_hour"
    private let minuteKey = "rc_reminder_minute"

    /// Persisted UI state. `enabled` reflects the user's toggle; `reminderTime`
    /// carries only the hour/minute we schedule against.
    var enabled: Bool
    var reminderTime: Date
    /// True once the OS-level permission has been refused — the UI then explains
    /// the user must re-enable in Settings, since we can't re-prompt after a deny.
    var permissionDenied = false

    private let center = UNUserNotificationCenter.current()

    private init() {
        let d = UserDefaults.standard
        enabled = d.bool(forKey: enabledKey)
        let hour = d.object(forKey: hourKey) as? Int ?? 18
        let minute = d.object(forKey: minuteKey) as? Int ?? 0
        reminderTime = Calendar.current.date(
            from: DateComponents(hour: hour, minute: minute)
        ) ?? Date()
    }

    /// Refresh the denied flag on appear so the UI is accurate if the user changed
    /// the permission in Settings while the app was backgrounded.
    func refreshStatus() async {
        let settings = await center.notificationSettings()
        permissionDenied = settings.authorizationStatus == .denied
        // Permission revoked out from under us — reflect it in the toggle.
        if permissionDenied && enabled {
            enabled = false
            persistEnabled()
            center.removePendingNotificationRequests(withIdentifiers: [requestID])
        }
    }

    /// Turn the reminder on: ask permission the first time, then (re)schedule.
    /// Returns false if permission was refused so the caller can revert the toggle.
    @discardableResult
    func enableReminder() async -> Bool {
        let granted = (try? await center.requestAuthorization(options: [.alert, .sound])) ?? false
        guard granted else {
            permissionDenied = true
            enabled = false
            persistEnabled()
            return false
        }
        permissionDenied = false
        enabled = true
        persistEnabled()
        await schedule()
        return true
    }

    func disableReminder() {
        enabled = false
        persistEnabled()
        center.removePendingNotificationRequests(withIdentifiers: [requestID])
    }

    /// Called when the user moves the time picker — persist and re-schedule.
    func timeChanged() async {
        persistTime()
        if enabled { await schedule() }
    }

    private func schedule() async {
        center.removePendingNotificationRequests(withIdentifiers: [requestID])

        let content = UNMutableNotificationContent()
        content.title = "Time to train"
        content.body = "Run a scenario to keep your phraseology sharp."
        content.sound = .default

        let comps = Calendar.current.dateComponents([.hour, .minute], from: reminderTime)
        let trigger = UNCalendarNotificationTrigger(dateMatching: comps, repeats: true)
        let request = UNNotificationRequest(identifier: requestID, content: content, trigger: trigger)
        try? await center.add(request)
    }

    private func persistEnabled() {
        UserDefaults.standard.set(enabled, forKey: enabledKey)
    }

    private func persistTime() {
        let c = Calendar.current.dateComponents([.hour, .minute], from: reminderTime)
        let d = UserDefaults.standard
        d.set(c.hour ?? 18, forKey: hourKey)
        d.set(c.minute ?? 0, forKey: minuteKey)
    }
}
