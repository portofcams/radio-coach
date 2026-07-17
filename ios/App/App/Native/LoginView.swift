import SwiftUI

// Native port of src/app/login/page.tsx — same copy, same login/signup toggle,
// same field set. Talks to AuthManager instead of fetch().
struct LoginView: View {
    @Environment(AuthManager.self) private var auth
    @State private var mode: Mode = .login
    @State private var email = ""
    @State private var password = ""
    @State private var errorMessage: String?
    @State private var isSubmitting = false

    enum Mode { case login, signup }

    var body: some View {
        VStack(spacing: 24) {
            VStack(spacing: 4) {
                Text("CLEARSPAR")
                    .font(.caption).fontWeight(.semibold).tracking(2)
                Text(mode == .login ? "Welcome back" : "Create your account")
                    .font(.title2).fontWeight(.semibold)
                Text(mode == .login ? "Sign in to see your progress" : "Track your readback scores over time")
                    .font(.subheadline).foregroundStyle(.secondary)
            }

            VStack(alignment: .leading, spacing: 16) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Email").font(.subheadline).fontWeight(.medium)
                    TextField("you@example.com", text: $email)
                        .textFieldStyle(.roundedBorder)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.emailAddress)
                        .autocorrectionDisabled()
                }
                VStack(alignment: .leading, spacing: 4) {
                    Text("Password").font(.subheadline).fontWeight(.medium)
                    SecureField(mode == .signup ? "At least 6 characters" : "••••••••", text: $password)
                        .textFieldStyle(.roundedBorder)
                }

                if let errorMessage {
                    Text(errorMessage)
                        .font(.subheadline)
                        .foregroundStyle(.red)
                }

                Button(action: submit) {
                    if isSubmitting {
                        ProgressView().frame(maxWidth: .infinity)
                    } else {
                        Text(mode == .login ? "Sign in" : "Create account")
                            .frame(maxWidth: .infinity)
                    }
                }
                .buttonStyle(.borderedProminent)
                .disabled(isSubmitting || email.isEmpty || password.isEmpty)
            }

            Button(mode == .login ? "No account? Sign up free" : "Already have one? Sign in") {
                mode = mode == .login ? .signup : .login
                errorMessage = nil
            }
            .font(.subheadline)
        }
        .padding(.horizontal, 24)
    }

    private func submit() {
        errorMessage = nil
        isSubmitting = true
        Task {
            defer { isSubmitting = false }
            do {
                if mode == .login {
                    try await auth.login(email: email, password: password)
                } else {
                    try await auth.signup(email: email, password: password)
                }
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }
}
