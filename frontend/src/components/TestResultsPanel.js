import React from "react";

function TestResultsPanel({ testResults, isSubmission }) {
  if (!testResults || testResults.length === 0) {
    return null;
  }

  const passedCount = testResults.filter(test => test.passed).length;
  const totalCount = testResults.length;
  
  return (
    <div style={{ 
      marginTop: 16, 
      padding: 16, 
      backgroundColor: "#f8f9fa", 
      borderRadius: 8, 
      border: "1px solid #dee2e6" 
    }}>
      <h3 style={{ marginTop: 0 }}>
        {isSubmission ? "Submission Results " : "Test Results"}
        <span style={{ 
          float: "right", 
          fontSize: "0.9em", 
          color: passedCount === totalCount ? "#28a745" : passedCount === 0 ? "#dc3545" : "#fd7e14" 
        }}>
          {passedCount}/{totalCount} passed
        </span>
      </h3>
      
      <div style={{ marginTop: 12 }}>
        {testResults.map((test, index) => (
          <div 
            key={index} 
            style={{ 
              marginBottom: 12, 
              padding: 12, 
              borderRadius: 4, 
              border: `1px solid ${test.passed ? "#28a745" : "#dc3545"}`,
              backgroundColor: test.passed ? "rgba(40, 167, 69, 0.1)" : "rgba(220, 53, 69, 0.1)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontWeight: "bold" }}>
                Test Case #{index + 1}
              </span>
              <span style={{ 
                fontWeight: "bold", 
                color: test.passed ? "#28a745" : "#dc3545" 
              }}>
                {test.passed ? "PASSED" : "FAILED"}
              </span>
            </div>
            
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "bold", marginBottom: 4 }}>Input:</div>
                <pre style={{ 
                  backgroundColor: "#e9ecef", 
                  padding: 8, 
                  borderRadius: 4, 
                  margin: 0,
                  overflowX: "auto" 
                }}>{test.input}</pre>
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "bold", marginBottom: 4 }}>Expected Output:</div>
                <pre style={{ 
                  backgroundColor: "#e9ecef", 
                  padding: 8, 
                  borderRadius: 4, 
                  margin: 0,
                  overflowX: "auto" 
                }}>{test.expected}</pre>
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "bold", marginBottom: 4 }}>Your Output:</div>
                <pre style={{ 
                  backgroundColor: "#e9ecef", 
                  padding: 8, 
                  borderRadius: 4, 
                  margin: 0,
                  overflowX: "auto" 
                }}>{test.actual}</pre>
              </div>
            </div>
            
            {test.error && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontWeight: "bold", color: "#dc3545" }}>Error:</div>
                <pre style={{ 
                  backgroundColor: "#f8d7da", 
                  color: "#721c24",
                  padding: 8, 
                  borderRadius: 4, 
                  margin: 0,
                  overflowX: "auto" 
                }}>{test.error}</pre>
              </div>
            )}
          </div>
        ))}
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