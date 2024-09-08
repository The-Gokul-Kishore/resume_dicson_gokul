import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [jobDescription, setJobDescription] = useState('');
  const [limit, setLimit] = useState(1);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resumes, setResumes] = useState([]);
  const [processing, setProcessing] = useState(false);

  const handleStop = async () => {
    if (!processing) return;
    if (window.confirm("Are you sure you want to stop processing?")) {
      setLoading(false);
      setProcessing(false);
      try {
        await axios.post('http://localhost:5000/api/stop');
      } catch (error) {
        console.error("Error stopping processing:", error);
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (processing) {
      alert("Processing is already ongoing.");
      return;
    }
    setLoading(true);
    setProcessing(true);
    try {
      const response = await axios.post('http://localhost:5000/api/process', {
        job_description: jobDescription,
        limit: limit
      });
      setResumes(response.data);
    } catch (error) {
      console.error("Error fetching resumes:", error);
    }
  };
  useEffect(() => {
    let isMounted = true; // Track if component is mounted
  
    const fetchProgress = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/progress');
        if (isMounted) {
          setProgress(response.data.progress);
          if (response.data.progress >= 100) {
            // Fetch resumes only if component is still mounted
            try {
              const resumesResponse = await axios.post('http://localhost:5000/api/process', {
                job_description: jobDescription,
                limit: limit
              });
              if (isMounted) {
                setResumes(resumesResponse.data);
                setLoading(false);
                setProcessing(false);
              }
            } catch (error) {
              console.error("Error fetching resumes:", error);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching progress:", error);
      }
    };
  
    const interval = setInterval(fetchProgress, 1000);
  
    return () => {
      clearInterval(interval);
      isMounted = false; // Set to false when component unmounts
    };
  }, [jobDescription, limit, loading, processing]);
  
  
  return (
    <div className="container">
      <h1 className="header">Resume Matcher</h1>
      <div className="note">
        This application helps you match resumes to job descriptions by analyzing and comparing them based on your input. Simply enter the job description, set the number of top resumes you want to retrieve, and click 'Find Resumes' to start the processing.
      </div>
      <form onSubmit={handleSubmit}>
        <label>
          Job Description:
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows="10"
            cols="50"
            disabled={loading}
          />
        </label>
        <br />
        <label>
          Limit (Number of top resumes):
          <input
            type="number"
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value, 10))}
            min="1"
            disabled={loading}
          />
        </label>
        <br />
        <button type="submit" disabled={loading}>Find Resumes</button>
        <button type="button" onClick={handleStop} disabled={!processing}>Stop Processing</button>
      </form>
      {loading && (
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}>
            {progress}%
          </div>
        </div>
      )}
      {!loading && resumes.length > 0 && (
        <div className="resume-table">
          <h2>Matching Resumes</h2>
          <table>
            <thead>
              <tr>
                <th>Application No</th>
                <th>Resume Link</th>
                <th>Match Percentage</th>
              </tr>
            </thead>
            <tbody>
              {resumes.map((resume, index) => (
                <tr key={index}>
                  <td>{resume.application_no}</td>
                  <td>
                    <a href={resume.resume_link} target="_blank" rel="noopener noreferrer">
                      View Resume
                    </a>
                  </td>
                  <td>{resume.match_percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
