import axios from 'axios';

const API_URL = 'http://localhost:5001/api/results/';

// Get students for mark entry (Enforced Alphabetical Ranking)
const getStudentsForEntry = async (params, token) => {
  const config = {
    headers: { Authorization: `Bearer ${token}` },
    params // Includes courseId, semester, academicYear, and now SECTION
  };
  const response = await axios.get(`${API_URL}students`, config);
  return response.data;
};

// Save marks as draft
const saveMarks = async (data, token) => {
  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };
  const response = await axios.post(`${API_URL}save`, data, config);
  return response.data;
};

// Submit marks for approval
const submitMarks = async (data, token) => {
  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };
  const response = await axios.post(`${API_URL}submit`, data, config);
  return response.data;
};

// Approve results
const approveMarks = async (data, token) => {
  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };
  const response = await axios.post(`${API_URL}approve`, data, config);
  return response.data;
};

// Publish results
const publishMarks = async (data, token) => {
  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };
  const response = await axios.post(`${API_URL}publish`, data, config);
  return response.data;
};

// Get student's results
const getMyResults = async (token) => {
  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };
  const response = await axios.get(`${API_URL}my-results`, config);
  return response.data;
};

// Get analytics
const getAnalytics = async (params, token) => {
  const config = {
    headers: { Authorization: `Bearer ${token}` },
    params
  };
  const response = await axios.get(`${API_URL}analytics`, config);
  return response.data;
};

const resultService = {
  getStudentsForEntry,
  saveMarks,
  submitMarks,
  approveMarks,
  publishMarks,
  getMyResults,
  getAnalytics
};

export default resultService;
