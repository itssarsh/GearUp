import axios from "axios";
import { startGlobalLoading, stopGlobalLoading } from "../../../utils/loadingBridge";
import { getStoredToken } from "../utils/session";

const API = axios.create({
  baseURL: "http://localhost:5000/api/mechanic",
});

API.interceptors.request.use((request) => {
  if (!request.skipGlobalLoader) {
    startGlobalLoading();
  }

  const token = getStoredToken();

  if (token) {
    request.headers.Authorization = `Bearer ${token}`;
  }

  return request;
}, (error) => {
  stopGlobalLoading();
  return Promise.reject(error);
});

API.interceptors.response.use((response) => {
  if (!response.config?.skipGlobalLoader) {
    stopGlobalLoading();
  }

  return response;
}, (error) => {
  if (!error.config?.skipGlobalLoader) {
    stopGlobalLoading();
  }

  return Promise.reject(error);
});

export default API;
