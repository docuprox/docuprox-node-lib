# DocuProx Package

A Node.js library to interact with the DocuProx API for processing documents using templates.

## Installation

```bash
npm install docuprox
```

or with yarn:

```bash
yarn add docuprox
```

## Configuration

Create a `.env` file in your project root with your API credentials:

```env
DOCUPROX_API_URL=https://api.docuprox.com/v1
DOCUPROX_API_KEY=your-api-key-here
```

Or set environment variables directly:

```bash
export DOCUPROX_API_URL=https://api.docuprox.com/v1
export DOCUPROX_API_KEY=your-api-key-here
```

**Note:** You must provide your own API key. The API key is required for authentication.

## Usage

```javascript
const Docuprox = require("docuprox");

// Initialize the client (API key required, can be set via DOCUPROX_API_KEY env var)
const client = new Docuprox(null, "your-api-key-here");  // Uses default URL: https://api.docuprox.com/v1

// Or set custom URL and API key
const client = new Docuprox("https://your-custom-api.com/v1", "your-api-key-here");

// Or use environment variables (recommended for production)
// Set DOCUPROX_API_URL and DOCUPROX_API_KEY environment variables
const client = new Docuprox();  // Will use env vars or defaults

(async () => {
  try {
    // Process a file with a template (sends as multipart/form-data)
    const templateId = "your-template-uuid-here";
    const result = await client.processFile("./path/to/your/file.pdf", templateId);
    console.log(result);

    // Process base64 data with a template (sends as JSON)
    const base64String = "your_base64_encoded_data_here";
    const result2 = await client.processBase64(base64String, templateId);
    console.log(result2);

    // Process with static values (optional key-value pairs)
    // Note: Static values will be returned in the response. By default, the value will be
    // the value set in the UI. If you provide static_values, it will override the UI defaults.
    const staticValues = {
      company_name: "Acme Corp",
      invoice_number: "INV-2024-001"
    };
    const result3 = await client.processFile("./path/to/your/file.pdf", templateId, staticValues);
    console.log(result3);
  } catch (error) {
    console.error("Error:", error.message);
  }
})();
```

### Processing Methods

Docuprox provides multiple processing methods:

| Method | Endpoint | Input Type | Use Case |
|--------|----------|------------|----------|
| `processFile` | `/process` | File path | Process a single file with template |
| `processBase64` | `/process` | Base64 string | Process a single base64-encoded file with template |
| `processAgentFile` | `/process-agent` | File path | Process using AI agent with custom prompts |
| `processAgentBase64` | `/process-agent` | Base64 string | Process using AI agent with custom prompts (base64) |
| `processJob` | `/process-job` | File path/Buffer/Stream | Process batch jobs with files |
| `processJobBase64` | `/process-job` | Base64 string | Process batch jobs with base64 data |

**Note:** Most methods support optional `static_values` parameter for injecting static data.

### Static Values

Static values allow you to pass predefined key-value pairs to the processing API. These values will be included in the returned response.

**Priority:**
- **Default**: If no `static_values` are provided, the response will include values set in the template UI
- **Override**: If you provide `static_values` parameter, these values will override the UI defaults

**Example:**

Let's say in the UI, `company_name` is set to "Docuprox" as the default value.

```javascript
const Docuprox = require("docuprox");
const client = new Docuprox();
const templateId = "your-template-uuid-here";

(async () => {
  // Without static_values - uses UI default
  const result1 = await client.processFile("file.pdf", templateId);
  // Response will include: company_name = "Docuprox" (from UI)

  // With static_values - overrides UI default
  const staticValues = {
    company_name: "Acme Corp",  // Overrides "Docuprox" from UI
    invoice_number: "INV-2024-001",
    date: "2024-01-15"
  };
  const result2 = await client.processFile("file.pdf", templateId, staticValues);
  // Response will include: company_name = "Acme Corp" (from static_values)

  // Works with all processing methods
  await client.processBase64(base64String, templateId, staticValues);
  await client.processJob("file.pdf", templateId, staticValues);
  await client.processJobBase64(base64String, templateId, staticValues);
})();
```

### AI Agent Processing

For advanced document processing with custom prompts and AI-powered extraction, use the agent processing methods:

```javascript
const Docuprox = require("docuprox");
const client = new Docuprox();

(async () => {
  try {
    // Define your prompt configuration
    const promptJson = {
      "invoice_number": "Extract the invoice number",
      "total_amount": "Extract the total amount",
      "date": "Extract the invoice date"
    };

    const documentType = "invoice";

    // Process a file with AI agent
    const fileResult = await client.processAgentFile(
      "./invoice.pdf",
      promptJson,
      documentType
    );
    console.log(fileResult);

    // Process base64 with AI agent
    const base64Data = "your-base64-encoded-document";
    const base64Result = await client.processAgentBase64(
      base64Data,
      promptJson,
      documentType
    );
    console.log(base64Result);

    // With custom instructions (works for both file and base64)
    const resultWithInstructions = await client.processAgentFile(
      "./invoice.pdf",
      promptJson,
      documentType,
      "Please extract all monetary values in USD format"
    );

    // With custom instructions and static values
    const resultComplete = await client.processAgentFile(
      "./invoice.pdf",
      promptJson,
      documentType,
      "Please extract all monetary values in USD format",
      { company_name: "Acme Corp", department: "Finance" }
    );
    console.log(resultComplete);
  } catch (error) {
    console.error("Error:", error.message);
  }
})();
```

### Async Job Processing

For long-running or batch processing tasks, use the async job workflow:

```javascript
const Docuprox = require("docuprox");
const client = new Docuprox();
const templateId = "your-template-uuid-here";

(async () => {
  try {
    // Step 1: Submit a job (returns immediately with job_id)
    const jobResponse = await client.processJob("./path/to/your/file.zip", templateId);
    const jobId = jobResponse.job_id;
    console.log(`Job submitted: ${jobId}`);

    // Or submit with base64 data
    const jobResponse2 = await client.processJobBase64(base64String, templateId);
    const jobId2 = jobResponse2.job_id;

    // Step 2: Check job status
    const status = await client.getJobStatus(jobId);
    console.log(`Job status:`, status);

    // Step 3: Retrieve results when job is complete (default: JSON format)
    const results = await client.getJobResults(jobId);
    console.log(results);

    // Or get results in CSV format
    const resultsCsv = await client.getJobResults(jobId, "csv");
    console.log(resultsCsv);
  } catch (error) {
    console.error("Error:", error.message);
  }
})();
```

#### ZIP File Structure for Batch Processing

When using `processJob` with ZIP files, all images and PDF files must be placed in the **root directory** of the ZIP file (not in subdirectories).

**Correct Structure:**
```
documents.zip
├── invoice1.pdf
├── invoice2.pdf
├── receipt1.jpg
├── receipt2.png
└── document3.pdf
```

**Incorrect Structure (will not work):**
```
documents.zip
└── invoices/          ❌ Subdirectories not supported
    ├── invoice1.pdf
    └── invoice2.pdf
```

**Supported file types in ZIP:**
- PDF files (`.pdf`)
- Images (`.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.tiff`, `.tif`, `.bmp`)

**Example:**
```javascript
// Create a ZIP file with all documents in the root
// documents.zip contains: invoice1.pdf, invoice2.pdf, receipt.jpg

const jobResponse = await client.processJob(
  "./documents.zip",
  "template-uuid"
);

// The job will process all files in the ZIP
console.log(`Job ID: ${jobResponse.job_id}`);

// Check status
const status = await client.getJobStatus(jobResponse.job_id);

// Get results for all processed documents
const results = await client.getJobResults(jobResponse.job_id);
```

## API Reference

### Constructor

#### `new Docuprox(apiUrl?, apiKey?)`

Creates a new Docuprox client instance.

- `apiUrl` (optional): The base URL of the DocuProx API. Defaults to `DOCUPROX_API_URL` env var or `https://api.docuprox.com/v1`
- `apiKey` (optional): API key for authentication. Defaults to `DOCUPROX_API_KEY` env var
- **Throws**: Error if API key is not provided via parameter or environment variable

**Example:**
```javascript
const client = new Docuprox();  // Uses env vars
const client = new Docuprox(null, "api-key");  // Custom API key
const client = new Docuprox("https://custom-api.com/v1", "api-key");  // Custom URL and key
```

### Single File Processing Methods

#### `processFile(filePath, templateId, static_values?)`

Processes a file by uploading it to the `/process` endpoint with the specified template.

- `filePath` (string): Path to the file to process
- `templateId` (string): UUID string of the template to use for processing
- `static_values` (Object, optional): Dictionary of static key-value pairs to include in processing
- **Returns**: `Promise<Object>` - JSON response from the API containing document data
- **Throws**: Error if file not found or API error

**Example:**
```javascript
const result = await client.processFile("./invoice.pdf", "template-uuid");
const resultWithStatic = await client.processFile("./invoice.pdf", "template-uuid", {
  company_name: "Acme Corp",
  date: "2024-01-15"
});
```

#### `processBase64(base64Data, templateId, static_values?)`

Processes a base64 encoded string by sending it to the `/process` endpoint with the specified template.

- `base64Data` (string): Base64 encoded string of the image/document
- `templateId` (string): UUID string of the template to use for processing
- `static_values` (Object, optional): Dictionary of static key-value pairs to include in processing
- **Returns**: `Promise<Object>` - JSON response from the API containing document data
- **Throws**: Error if API error

**Example:**
```javascript
const result = await client.processBase64("base64-encoded-string", "template-uuid");
const resultWithStatic = await client.processBase64("base64-encoded-string", "template-uuid", {
  invoice_number: "INV-001"
});
```

### AI Agent Processing Methods

#### `processAgentFile(filePath, promptJson, documentType, customInstructions?, static_values?)`

Process a file using AI agent by sending it to the `/process-agent` endpoint. This method allows for advanced document processing with custom prompts and AI-powered extraction.

- `filePath` (string): Path to the file to process
- `promptJson` (Object): JSON object containing the prompt configuration with field definitions
- `documentType` (string): Type of document being processed (e.g., "invoice", "receipt", "contract")
- `customInstructions` (string, optional): Custom instructions for processing
- `static_values` (Object, optional): Dictionary of static key-value pairs to include in processing
- **Returns**: `Promise<Object>` - JSON response from the API with extracted data
- **Throws**: Error if file not found, required parameters are missing, or API error

**Example:**
```javascript
const promptJson = {
  "invoice_number": "Extract the invoice number",
  "total_amount": "Extract the total amount"
};

// Basic usage
const result = await client.processAgentFile(
  "./invoice.pdf",
  promptJson,
  "invoice"
);

// With custom instructions
const result2 = await client.processAgentFile(
  "./invoice.pdf",
  promptJson,
  "invoice",
  "Extract all amounts in USD format"
);

// With custom instructions and static values
const result3 = await client.processAgentFile(
  "./invoice.pdf",
  promptJson,
  "invoice",
  "Extract all amounts in USD format",
  { company_name: "Acme Corp" }
);
```

#### `processAgentBase64(base64Data, promptJson, documentType, customInstructions?, static_values?)`

Process base64 data using AI agent by sending it to the `/process-agent` endpoint. This method allows for advanced document processing with custom prompts and AI-powered extraction.

- `base64Data` (string): Base64 encoded string of the image/document
- `promptJson` (Object): JSON object containing the prompt configuration with field definitions
- `documentType` (string): Type of document being processed (e.g., "invoice", "receipt", "contract")
- `customInstructions` (string, optional): Custom instructions for processing
- `static_values` (Object, optional): Dictionary of static key-value pairs to include in processing
- **Returns**: `Promise<Object>` - JSON response from the API with extracted data
- **Throws**: Error if required parameters are missing or API error

**Example:**
```javascript
const promptJson = {
    "invoice_number" : "Extract the invoice number",
    "total_amount" : "Extract the total amount"
    };

// Basic usage
const result = await client.processAgentBase64(
  "base64-string",
  promptJson,
  "invoice"
);

// With custom instructions
const result2 = await client.processAgentBase64(
  "base64-string",
  promptJson,
  "invoice",
  "Extract all amounts in USD format"
);

// With custom instructions and static values
const result3 = await client.processAgentBase64(
  "base64-string",
  promptJson,
  "invoice",
  "Extract all amounts in USD format",
  { company_name: "Acme Corp" }
);
```

### Async Job Processing Methods

#### `processJob(file, templateId, static_values?)`

Submits an async processing job by sending a file to the `/process-job` endpoint. Returns immediately with a job_id. Supports ZIP files, PDFs, and images. Content type is automatically detected from file extension.

- `file` (string|Buffer|Stream): Path to file, Buffer, or Stream
- `templateId` (string): UUID string of the template to use for processing
- `static_values` (Object, optional): Dictionary of static key-value pairs to include in processing
- **Returns**: `Promise<Object>` - JSON response from the API containing job_id and status
- **Throws**: Error if file not found or API error

**Supported file types:**
- ZIP files (`.zip`)
- PDF files (`.pdf`)
- Images (`.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.tiff`, `.tif`, `.bmp`)

**Example:**
```javascript
const jobResponse = await client.processJob("./documents.zip", "template-uuid");
console.log(jobResponse.job_id);

// With static values
const jobResponse2 = await client.processJob("./invoice.pdf", "template-uuid", {
  batch_id: "BATCH-2024-001"
});
```

#### `processJobBase64(base64Data, templateId, static_values?)`

Submits an async processing job with base64 encoded data to the `/process-job` endpoint. Returns immediately with a job_id.

- `base64Data` (string): Base64 encoded string of the image/document
- `templateId` (string): UUID string of the template to use for processing
- `static_values` (Object, optional): Dictionary of static key-value pairs to include in processing
- **Returns**: `Promise<Object>` - JSON response from the API containing job_id and status
- **Throws**: Error if API error

**Example:**
```javascript
const jobResponse = await client.processJobBase64("base64-string", "template-uuid");
console.log(jobResponse.job_id);
```

### Job Status and Results Methods

#### `getJobStatus(job_id)`

Checks the status of a processing job.

- `job_id` (string): UUID string of the job to check
- **Returns**: `Promise<Object>` - JSON response from the API with job status information (e.g., pending, processing, completed, failed)
- **Throws**: Error if job_id is invalid or API error

**Example:**
```javascript
const status = await client.getJobStatus("job-uuid-here");
console.log(status);
```

#### `getJobResults(job_id, result_format?)`

Retrieves the results of a completed processing job.

- `job_id` (string): UUID string of the job to retrieve results for
- `result_format` (string, optional): Format of results - `"json"` or `"csv"` (default: `"json"`)
- **Returns**: `Promise<Object|string>` - JSON response from the API with job results in the specified format
- **Throws**: Error if job_id is invalid, format is invalid, or API error

**Example:**
```javascript
// Get results in JSON format (default)
const results = await client.getJobResults("job-uuid-here");
console.log(results);

// Get results in CSV format
const resultsCsv = await client.getJobResults("job-uuid-here", "csv");
console.log(resultsCsv);
```

## Error Handling

All methods throw errors when operations fail. Always wrap calls in try-catch blocks:

```javascript
try {
  const result = await client.processFile("./file.pdf", "template-uuid");
  console.log(result);
} catch (error) {
  console.error("Error:", error.message);
  // Handle error appropriately
}
```

## Dependencies

- `axios`: ^1.11.0
- `form-data`: For multipart/form-data uploads
- `dotenv`: ^17.2.1

## License

MIT
