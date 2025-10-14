const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
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
   * @returns {Promise<Object>} JSON response from API
   */
  async processFile(filePath, templateId) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const form = new FormData();
      form.append("actual_image", fs.createReadStream(filePath));
      form.append("template_id", templateId);

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
   * @returns {Promise<Object>} JSON response from API
   */
  async processBase64(base64Data, templateId) {
    try {
      const payload = {
        actual_image: base64Data,
        template_id: templateId,
      };

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