// src/api/products.js
import axios from "axios";

const BASE_URL = "https://pos-backend-7gom.onrender.com/api"; // Replace with your API base URL
const API_TOKEN = "your-api-token"; // Replace with your API token, if required

export const fetchProducts = async () => {
  try {
    const response = await axios.get(`"https://pos-backend-7gom.onrender.com/products`, {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`, // Remove if no auth is needed
        "Content-Type": "application/json",
      },
    });
    return response.data; // Assumes API returns an array of products
  } catch (error) {
    console.error("API Error:", error.response?.data || error.message);
    throw new Error("Failed to fetch products from Product Manager");
  }
};