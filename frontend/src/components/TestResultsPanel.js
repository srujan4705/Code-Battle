import React, { useState } from "react";

function TestResultsPanel({ testResults, isSubmission }) {
  const [expandedTests, setExpandedTests] = useState({});
  
  if (!testResults || testResults.length === 0) {
    return null;
  }

  const passedCount = testResults.filter(test => test.passed).length;
  const totalCount = testResults.length;
  
  const toggleTestExpansion = (index) => {
    setExpandedTests(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };
  
  return (
    <div className="card fade-in" style={{ marginBottom: "var(--space-xl)" }}>
      <div className="card-header">
        <div className="d-flex justify-content-between align-items-center">
          <h3 style={{ margin: 0, fontSize: "1.25rem", display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
            <i className={`fas ${isSubmission ? "fa-check-double" : "fa-vial"}`} 
               style={{ fontSize: "1.4rem", color: isSubmission ? "var(--success)" : "var(--primary)" }}></i> 
            <span>{isSubmission ? "Submission Results" : "Test Results"}</span>
          </h3>
          <div>
            <span 
              className={`badge ${passedCount === totalCount ? "badge-success" : passedCount === 0 ? "badge-danger" : "badge-warning"}`}
              style={{ 
                padding: "var(--space-sm) var(--space-md)", 
                fontSize: "0.9rem",
                fontWeight: "600",
                boxShadow: "var(--shadow-sm)",
                animation: "pulse 2s infinite"
              }}
            >
              {passedCount}/{totalCount} passed
            </span>
          </div>
        </div>
      </div>
      
      <div className="card-body" style={{ padding: "var(--space-xl)" }}>
        <div className="test-results-list" style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
          {testResults.map((test, index) => (
            <div 
              key={index} 
              className={`test-case-item ${test.passed ? "test-passed" : "test-failed"}`}
              style={{ 
                marginBottom: "var(--space-md)", 
                padding: "var(--space-lg)", 
                borderRadius: "var(--radius-lg)", 
                border: `2px solid ${test.passed ? "var(--success)" : "var(--error)"}`,
                backgroundColor: test.passed ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                boxShadow: "var(--shadow-md)",
                transition: "all var(--transition-normal)",
                cursor: "pointer"
              }}
              onClick={() => toggleTestExpansion(index)}
            >
              <div className="d-flex justify-content-between align-items-center" style={{ marginBottom: "var(--space-md)" }}>
                <span style={{ fontWeight: 600, fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                  <i 
                    className={`fas ${test.passed ? "fa-check-circle" : "fa-times-circle"}`}
                    style={{ 
                      fontSize: "1.4rem", 
                      color: test.passed ? "var(--success)" : "var(--error)",
                      animation: test.passed ? "bounce 1s ease" : "shake 0.5s ease"
                    }}
                  ></i> 
                  <span>Test Case #{index + 1}</span>
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
                  <span className={`badge ${test.passed ? "badge-success" : "badge-danger"}`}
                    style={{ 
                      padding: "var(--space-sm) var(--space-md)", 
                      fontSize: "0.9rem",
                      fontWeight: "600",
                      boxShadow: "var(--shadow-sm)"
                    }}>
                    {test.passed ? "PASSED" : "FAILED"}
                  </span>
                  <i 
                    className={`fas ${expandedTests[index] ? "fa-chevron-up" : "fa-chevron-down"}`}
                    style={{ fontSize: "1.1rem", color: "var(--text-tertiary)" }}
                  ></i>
                </div>
              </div>
              
              {expandedTests[index] && (
                <div className="test-details" style={{ 
                  marginTop: "var(--space-md)",
                  animation: "fadeIn 0.3s ease"
                }}>
                  <div className="d-grid" style={{ 
                    display: "grid", 
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
                    gap: "var(--space-lg)" 
                  }}>
                    <div>
                      <div style={{ 
                        fontWeight: 600, 
                        marginBottom: "var(--space-sm)",
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-xs)"
                      }}>
                        <i className="fas fa-arrow-right" style={{ color: "var(--primary)" }}></i>
                        <span>Input:</span>
                      </div>
                      <pre className="code-block" style={{ 
                        backgroundColor: "var(--surface-dark)", 
                        padding: "var(--space-md)", 
                        borderRadius: "var(--radius-md)", 
                        margin: 0,
                        overflowX: "auto",
                        fontSize: "0.9rem",
                        maxHeight: "150px",
                        boxShadow: "var(--shadow-sm) inset",
                        border: "1px solid var(--border)"
                      }}>{test.input}</pre>
                    </div>
                    
                    <div>
                      <div style={{ 
                        fontWeight: 600, 
                        marginBottom: "var(--space-sm)",
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-xs)"
                      }}>
                        <i className="fas fa-check" style={{ color: "var(--success)" }}></i>
                        <span>Expected Output:</span>
                      </div>
                      <pre className="code-block" style={{ 
                        backgroundColor: "var(--surface-dark)", 
                        padding: "var(--space-md)", 
                        borderRadius: "var(--radius-md)", 
                        margin: 0,
                        overflowX: "auto",
                        fontSize: "0.9rem",
                        maxHeight: "150px",
                        boxShadow: "var(--shadow-sm) inset",
                        border: "1px solid var(--border)"
                      }}>{test.expected}</pre>
                    </div>
                    
                    <div>
                      <div style={{ 
                        fontWeight: 600, 
                        marginBottom: "var(--space-sm)",
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-xs)"
                      }}>
                        <i className="fas fa-code" style={{ color: test.passed ? "var(--success)" : "var(--error)" }}></i>
                        <span>Your Output:</span>
                      </div>
                      <pre className="code-block" style={{ 
                        backgroundColor: "var(--surface-dark)", 
                        padding: "var(--space-md)", 
                        borderRadius: "var(--radius-md)", 
                        margin: 0,
                        overflowX: "auto",
                        fontSize: "0.9rem",
                        maxHeight: "150px",
                        boxShadow: "var(--shadow-sm) inset",
                        border: `1px solid ${test.passed ? "var(--success)" : "var(--error)"}`
                      }}>{test.actual}</pre>
                    </div>
                  </div>
              
                  {test.error && (
                    <div style={{ marginTop: "var(--space-md)" }}>
                      <div style={{ fontWeight: 600, color: "var(--danger)" }}>
                        <i className="fas fa-exclamation-triangle"></i> Error:
                      </div>
                      <pre style={{ 
                        backgroundColor: "var(--danger-light)", 
                        color: "var(--danger-dark)",
                        padding: "var(--space-sm)", 
                        borderRadius: "var(--radius-sm)", 
                        margin: 0,
                        overflowX: "auto",
                        fontSize: "0.9rem",
                        maxHeight: "150px"
                      }}>{test.error}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {isSubmission && (
        <div style={{ 
          marginTop: 16, 
          padding: 12, 
          backgroundColor: "#e9ecef", 
          borderRadius: 4, 
          fontStyle: "italic" 
        }}>
          <strong>Note:</strong> Points are awarded only for hidden test cases when submitting.
        </div>
      )}
    </div>
  );
}

export default TestResultsPanel;