export class HttpResponder {
    success(res, statusCode, body) {
        res.status(statusCode).json(body);
    }
    error(res, statusCode, message) {
        res.status(statusCode).json({ error: message });
    }
    file(res, filePath, headers = {}) {
        Object.entries(headers).forEach(([key, value]) => {
            res.setHeader(key, value);
        });
        res.sendFile(filePath);
    }
}
export const httpResponse = new HttpResponder();
