# Docuprox

📦 A Node.js library for processing files using the Docuprox API.

This package provides a simple and reliable way to send files or base64-encoded data for automated document processing and extraction.

🚀 Installation

Install the package using npm:

```bash
npm install docuprox
```

or with yarn:

```bash
yarn add docuprox
```

## Setup

1. Create a `.env` file in the root directory with your Docuprox API credentials (copy from `.env.example`):

   ```
   DOCUPROX_API_URL=https://api.docuprox.com/v1
   DOCUPROX_API_KEY=your-api-key-here
   ```

   **Note:** You must provide your own API key. The default in the code is a placeholder and should not be used in production.

## Usage

```javascript
const Docuprox = require("docuprox");

// Initialize client (uses .env variables by default)
const docuprox = new Docuprox();

(async () => {
  try {
    // Process a file
    const fileResult = await docuprox.processFile(
      "./sample.jpg",
      "your-template-uuid",
    );
    console.log("File Result:", fileResult);

    // Process base64 data
    const base64Result = await docuprox.processBase64(
      "base64-string",
      "your-template-uuid",
    );
    console.log("Base64 Result:", base64Result);
  } catch (error) {
    console.error("Error:", error.message);
  }
})();
```

## API Reference

### Docuprox Class

#### Constructor

```javascript
new Docuprox(apiUrl?, apiKey?)
```

- `apiUrl`: Optional base URL (defaults to env or https://api.docuprox.com/v1)
- `apiKey`: Optional API key (defaults to env or placeholder)

#### Methods

##### processFile(filePath, templateId, static_values)

Processes a file by uploading it to the API.

- `filePath`: Path to the file
- `templateId`: Template UUID
- `static_values`: (Optional) Object containing static values to be injected
- Returns: Promise<Object> - API response

##### processBase64(base64Data, templateId, static_values)

Processes base64 encoded data.

- `base64Data`: Base64 string
- `templateId`: Template UUID
- `static_values`: (Optional) Object containing static values to be injected
- Returns: Promise<Object> - API response

##### processJob(zipFile, templateId, static_values)

Processes a zip file containing multiple documents using the default API key.

- `zipFile`: Path to zip file, Buffer, or Stream
- `templateId`: Template UUID
- `static_values`: (Optional) Object containing static values to be injected
- Returns: Promise<Object> - API response

##### getJobStatus(job_id)

Checks the status of a document processing job.

- `job_id`: Job ID returned from processJob
- Returns: Promise<Object> - API response with job status

##### getJobResults(job_id, result_format)

Retrieves the results of a processed job in JSON or CSV format.

- `job_id`: The ID of the job
- `result_format`: format of the results ('json' or 'csv', defaults to 'json')
- Returns: Promise<Object|string> - Job results

## Dependencies

- axios: ^1.11.0
- dotenv: ^17.2.1

## License

MIT
