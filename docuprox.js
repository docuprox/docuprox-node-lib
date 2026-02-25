const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

class Docuprox {
  /**
   * Initialize the Docuprox client with API URL and key
   * @param {string} [apiUrl] - Base URL of the API
   * @param {string} [apiKey] - API key for authentication
   */
  constructor(apiUrl, apiKey) {
    this.apiUrl = (apiUrl || process.env.DOCUPROX_API_URL || "https://api.docuprox.com/v1").replace(/\/$/, "");
    this.apiKey = apiKey || process.env.DOCUPROX_API_KEY;

    if (!this.apiKey) {
      throw new Error("API key is required. Provide it as parameter or set DOCUPROX_API_KEY in .env");
    }

    this.headers = {
      "x-auth": this.apiKey,
    };
  }

  /**
   * Process a file by sending it as multipart/form-data to /process endpoint
   * @param {string} filePath - Path to file
   * @param {string} templateId - Template UUID
   * @param {Object} [static_values] - Optional static values to include
   * @returns {Promise<Object>} JSON response from API
   */
  async processFile(filePath, templateId, static_values = null) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const form = new FormData();
      form.append("actual_image", fs.createReadStream(filePath));
      form.append("template_id", templateId);

      if (static_values) {
        form.append("static_values", JSON.stringify(static_values));
      }

      const response = await axios.post(`${this.apiUrl}/process`, form, {
        headers: {
          ...this.headers,
          ...form.getHeaders(),
        },
      });

      return response.data;
    } catch (err) {
      const errorMsg = this._extractError(err);
      throw new Error(`API request failed: ${errorMsg}`);
    }
  }

  /**
   * Process a base64 string by sending it as JSON to /process endpoint
   * @param {string} base64Data - Base64 encoded string
   * @param {string} templateId - Template UUID
   * @param {Object} [static_values] - Optional static values to include
   * @returns {Promise<Object>} JSON response from API
   */
  async processBase64(base64Data, templateId, static_values = null) {
    try {
      const payload = {
        actual_image: base64Data,
        template_id: templateId,
      };

      if (static_values) {
        payload.static_values = static_values;
      }

      const response = await axios.post(`${this.apiUrl}/process`, payload, {
        headers: this.headers,
      });

      return response.data;
    } catch (err) {
      const errorMsg = this._extractError(err);
      throw new Error(`API request failed: ${errorMsg}`);
    }
  }

/**
 * Process a job by sending zip file to /process-job endpoint
 * @param {string|Buffer|Stream} zipFile - Zip file (path, Buffer, or Stream)
 * @param {string} templateId - Template UUID
 * @param {Object} [static_values] - Optional static values to include
 * @returns {Promise<Object>}
 */
async processJob(zipFile, templateId, static_values = null) {
  try {
    if (!zipFile) {
      throw new Error("zipFile is required");
    }

    if (!templateId) {
      throw new Error("templateId is required");
    }

    const form = new FormData();

    // Handle file path
    if (typeof zipFile === "string") {
      if (!fs.existsSync(zipFile)) {
        throw new Error(`File not found: ${zipFile}`);
      }

      form.append(
        "actual_image",
        fs.createReadStream(zipFile),
        {
          filename: path.basename(zipFile),
          contentType: "application/zip",
        }
      );
    }

    // Handle Buffer
    else if (Buffer.isBuffer(zipFile)) {
      form.append("actual_image", zipFile, {
        filename: "input.zip",
        contentType: "application/zip",
      });
    }

    // Handle Stream
    else {
      form.append("actual_image", zipFile, {
        filename: "input.zip",
        contentType: "application/zip",
      });
    }

    form.append("template_id", templateId);

    if (static_values) {
      form.append("static_values", JSON.stringify(static_values));
    }

    const response = await axios.post(
      `${this.apiUrl}/process-job`,
      form,
      {
        headers: {
          ...this.headers,
          ...form.getHeaders(),
        },

        // Important for large zip uploads
        maxContentLength: Infinity,
        maxBodyLength: Infinity,

        // Recommended timeout for SDK
        timeout: 300000, // 5 minutes
      }
    );

    return response.data;

  } catch (err) {
    const errorMsg = this._extractError(err);
    throw new Error(`Docuprox processJob failed: ${errorMsg}`);
  }
}

/**
 * Get the status of a processing job
 * @param {string} job_id - The ID of the job to check
 * @returns {Promise<Object>} JSON response with job status
 */
async getJobStatus(job_id) {
  try {
    if (!job_id) {
      throw new Error("job_id is required");
    }

    const response = await axios.get(`${this.apiUrl}/job-status/${job_id}`, {
      headers: this.headers,
    });

    return response.data;
  } catch (err) {
    const errorMsg = this._extractError(err);
    throw new Error(`Docuprox getJobStatus failed: ${errorMsg}`);
  }
}

/**
 * Get the results of a processed job
 * @param {string} job_id - The ID of the job
 * @param {string} [result_format="json"] - Format of the results ('json' or 'csv')
 * @returns {Promise<Object|string>} Job results in specified format
 */
async getJobResults(job_id, result_format = "json") {
  try {
    if (!job_id) {
      throw new Error("job_id is required");
    }

    if (!["json", "csv"].includes(result_format.toLowerCase())) {
      throw new Error("result_format must be 'json' or 'csv'");
    }

    const payload = {
      job_id: job_id,
      result_format: result_format.toLowerCase(),
    };

    const response = await axios.post(`${this.apiUrl}/job-results`, payload, {
      headers: this.headers,
    });

    return response.data;
  } catch (err) {
    const errorMsg = this._extractError(err);
    throw new Error(`Docuprox getJobResults failed: ${errorMsg}`);
  }
}




  /**
   * Internal method to handle and format API errors
   * @param {Error} err
   * @returns {string}
   */
  _extractError(err) {
    if (err.response) {
      return err.response.data?.error || JSON.stringify(err.response.data);
    } else if (err.request) {
      return "No response received from API";
    } else {
      return err.message;
    }
  }
}

module.exports = Docuprox;
module.exports.default = Docuprox;