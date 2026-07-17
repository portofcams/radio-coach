import Foundation

enum APIError: Error, LocalizedError {
    case server(String)
    case decoding
    case network

    var errorDescription: String? {
        switch self {
        case .server(let message): return message
        case .decoding: return "Something went wrong reading the server's response."
        case .network: return "Couldn't reach the server. Check your connection."
        }
    }
}

// Every existing web/JSON API route (src/app/api/**) is reused as-is — this
// is the only client change needed on the network side. Auth is Bearer-token
// (see src/lib/auth.ts getAuthUser(), which accepts this alongside the
// cookie the web client still uses).
struct NetworkClient {
    static let shared = NetworkClient()
    private let baseURL = URL(string: "https://clearsparradio.binnacleai.com")!
    private let decoder: JSONDecoder = {
        let d = JSONDecoder()
        d.keyDecodingStrategy = .convertFromSnakeCase
        return d
    }()
    // Every src/app/api/** route reads its request body with plain camelCase
    // destructuring (`const { scenarioId } = await req.json()`) — none expect
    // snake_case keys. Encoding verbatim (no conversion) matches that. Response
    // decoding is different: a few routes (e.g. /api/user/weakspots) genuinely
    // return snake_case keys, so the decoder keeps .convertFromSnakeCase.
    private let encoder = JSONEncoder()

    func request<Response: Decodable>(
        _ path: String,
        method: String = "GET",
        body: Encodable? = nil,
        as: Response.Type = Response.self
    ) async throws -> Response {
        var req = URLRequest(url: baseURL.appendingPathComponent(path))
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token = KeychainHelper.load() {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        if let body {
            req.httpBody = try encoder.encode(AnyEncodable(body))
        }

        let (data, response): (Data, URLResponse)
        do {
            (data, response) = try await URLSession.shared.data(for: req)
        } catch {
            throw APIError.network
        }

        guard let http = response as? HTTPURLResponse else { throw APIError.network }
        guard (200..<300).contains(http.statusCode) else {
            if let err = try? decoder.decode(ErrorBody.self, from: data) {
                throw APIError.server(err.error)
            }
            throw APIError.server("Request failed (\(http.statusCode))")
        }

        do {
            return try decoder.decode(Response.self, from: data)
        } catch {
            throw APIError.decoding
        }
    }

    // POST a JSON object with its keys sent VERBATIM (no snake_case conversion).
    // Needed for endpoints that read camelCase keys directly — e.g.
    // /api/auth/apple parses `identityToken` off the body as-is.
    func postJSON<Response: Decodable>(_ path: String, _ json: [String: String]) async throws -> Response {
        var req = URLRequest(url: baseURL.appendingPathComponent(path))
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token = KeychainHelper.load() {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        req.httpBody = try JSONSerialization.data(withJSONObject: json)

        let (data, response): (Data, URLResponse)
        do { (data, response) = try await URLSession.shared.data(for: req) }
        catch { throw APIError.network }
        guard let http = response as? HTTPURLResponse else { throw APIError.network }
        guard (200..<300).contains(http.statusCode) else {
            if let err = try? decoder.decode(ErrorBody.self, from: data) { throw APIError.server(err.error) }
            throw APIError.server("Request failed (\(http.statusCode))")
        }
        do { return try decoder.decode(Response.self, from: data) }
        catch { throw APIError.decoding }
    }

    // Raw bytes (TTS returns audio/mpeg, not JSON).
    func requestBytes(_ path: String, method: String = "POST", body: Encodable? = nil) async throws -> Data {
        var req = URLRequest(url: baseURL.appendingPathComponent(path))
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token = KeychainHelper.load() {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        if let body { req.httpBody = try encoder.encode(AnyEncodable(body)) }

        let (data, response): (Data, URLResponse)
        do { (data, response) = try await URLSession.shared.data(for: req) }
        catch { throw APIError.network }
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw APIError.server("Request failed")
        }
        return data
    }

    // multipart/form-data upload — STT expects an `audio` file part.
    func uploadAudio<Response: Decodable>(
        _ path: String, audio: Data, filename: String, mimeType: String
    ) async throws -> Response {
        let boundary = "Boundary-\(UUID().uuidString)"
        var req = URLRequest(url: baseURL.appendingPathComponent(path))
        req.httpMethod = "POST"
        req.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        if let token = KeychainHelper.load() {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        var form = Data()
        form.append("--\(boundary)\r\n".data(using: .utf8)!)
        form.append("Content-Disposition: form-data; name=\"audio\"; filename=\"\(filename)\"\r\n".data(using: .utf8)!)
        form.append("Content-Type: \(mimeType)\r\n\r\n".data(using: .utf8)!)
        form.append(audio)
        form.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)

        let (data, response): (Data, URLResponse)
        do { (data, response) = try await URLSession.shared.upload(for: req, from: form) }
        catch { throw APIError.network }
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            if let err = try? decoder.decode(ErrorBody.self, from: data) { throw APIError.server(err.error) }
            throw APIError.server("Upload failed")
        }
        do { return try decoder.decode(Response.self, from: data) }
        catch { throw APIError.decoding }
    }
}

private struct ErrorBody: Decodable { let error: String }

// Encodable is a protocol, not a concrete type, so URLRequest.httpBody needs
// this wrapper to encode a boxed Encodable value.
private struct AnyEncodable: Encodable {
    private let encodeClosure: (Encoder) throws -> Void
    init(_ wrapped: Encodable) { self.encodeClosure = wrapped.encode }
    func encode(to encoder: Encoder) throws { try encodeClosure(encoder) }
}
