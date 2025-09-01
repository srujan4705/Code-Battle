import React, { useState } from 'react';

function MatchResultsPanel({ matchResults }) {
  if (!matchResults || !matchResults.winners || matchResults.winners.length === 0) {
    return null;
  }
  const [showAllScores, setShowAllScores] = useState(false);

  const { winners, challenge, scores } = matchResults;
  const isTie = winners.length > 1;

  return (
    <div className="card fade-in" style={{ 
      marginBottom: "var(--space-xl)",
      animation: "slideInUp 0.5s ease-out"
    }}>
      <div className="card-header">
        <h3 style={{ 
          margin: 0, 
          fontSize: "1.25rem", 
          display: "flex", 
          alignItems: "center", 
          gap: "var(--space-sm)" 
        }}>
          <i className="fas fa-trophy" style={{ 
            fontSize: "1.4rem", 
            color: "var(--warning)", 
            animation: "pulse 2s infinite"
          }}></i> 
          <span>Match Results</span>
        </h3>
      </div>
      
      <div className="card-body" style={{ padding: "var(--space-xl)" }}>
        {challenge && (
          <div className="alert alert-info" style={{ 
            marginBottom: "var(--space-lg)",
            padding: "var(--space-lg)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--primary-light)",
            backgroundColor: "rgba(67, 97, 238, 0.1)",
            boxShadow: "var(--shadow-md)"
          }}>
            <div className="d-flex justify-content-between align-items-center">
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                <i className="fas fa-code-branch" style={{ 
                  fontSize: "1.4rem", 
                  color: "var(--primary)" 
                }}></i>
                <div>
                  <strong style={{ fontSize: "1.1rem" }}>Challenge:</strong> 
                  <span style={{ marginLeft: "var(--space-sm)", fontSize: "1.1rem" }}>{challenge.title}</span>
                </div>
              </div>
              <div>
                <span className="badge badge-primary" style={{ 
                  padding: "var(--space-sm) var(--space-md)", 
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  boxShadow: "var(--shadow-sm)",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-xs)"
                }}>
                  <i className="fas fa-vial"></i> 
                  <span>{challenge.visibleTestCount} visible, {challenge.hiddenTestCount} hidden tests</span>
                </span>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginBottom: "var(--space-xl)" }}>
          <h4 style={{ 
            fontSize: "1.2rem", 
            marginBottom: "var(--space-lg)",
            color: "var(--warning)",
            borderBottom: "2px solid var(--warning)",
            paddingBottom: "var(--space-sm)",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-sm)"
          }}>
            <i className={`fas ${isTie ? "fa-users" : "fa-crown"}`} style={{ 
              fontSize: "1.4rem",
              color: "var(--warning)"
            }}></i> 
            <span>{isTie ? 'Winners (Tie)' : 'Winner'}</span>
          </h4>
          <div className="winners-list" style={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: "var(--space-md)" 
          }}>
            {winners.map((winner) => (
              <div key={winner.socketId} className="winner-item" style={{
                padding: "var(--space-lg)",
                backgroundColor: "rgba(245, 158, 11, 0.1)",
                borderRadius: "var(--radius-lg)",
                border: "2px solid var(--warning)",
                boxShadow: "var(--shadow-lg)",
                transform: "translateY(-4px)",
                transition: "all var(--transition-normal)"
              }}>
                <div className="d-flex justify-content-between align-items-center">
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
                    <i className="fas fa-medal" style={{ 
                      fontSize: "2rem", 
                      color: "var(--warning)",
                      animation: "bounce 2s infinite"
                    }}></i>
                    <span style={{ fontWeight: 700, fontSize: "1.3rem" }}>
                      {winner.username}
                    </span>
                  </div>
                  <div>
                    <span className="badge badge-success" style={{ 
                      padding: "var(--space-sm) var(--space-md)", 
                      fontSize: "1rem",
                      fontWeight: "700",
                      boxShadow: "var(--shadow-md)"
                    }}>
                      {winner.score} points
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            marginBottom: "var(--space-md)" 
          }}>
            <h4 style={{ 
              fontSize: "1.2rem", 
              margin: 0,
              color: "var(--text-primary)",
              display: "flex",
              alignItems: "center",
              gap: "var(--space-sm)"
            }}>
              <i className="fas fa-list-ol" style={{ fontSize: "1.3rem" }}></i> 
              <span>All Scores</span>
            </h4>
            <button 
              onClick={() => setShowAllScores(!showAllScores)}
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "var(--space-xs)",
                padding: "var(--space-xs) var(--space-sm)",
                fontSize: "0.9rem"
              }}
            >
              <i className={`fas fa-chevron-${showAllScores ? 'up' : 'down'}`}></i>
              <span>{showAllScores ? 'Hide Details' : 'Show All'}</span>
            </button>
          </div>
          
          <div className="scores-list" style={{ 
            borderTop: "1px solid var(--border)",
            paddingTop: "var(--space-md)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-sm)"
          }}>
            {Object.entries(scores)
              .sort((a, b) => b[1] - a[1]) // Sort by score (highest first)
              .slice(0, showAllScores ? undefined : 3) // Show only top 3 if not expanded
              .map(([socketId, score], index) => {
                // Find player name from winners array
                const player = winners.find(w => w.socketId === socketId);
                const playerName = player ? player.username : 'Unknown Player';
                const isWinner = winners.some(w => w.socketId === socketId);
                
                return (
                  <div key={socketId} className="score-item" style={{
                    padding: "var(--space-md) var(--space-lg)",
                    backgroundColor: isWinner ? "rgba(16, 185, 129, 0.1)" : "var(--surface)",
                    borderRadius: "var(--radius-md)",
                    border: isWinner ? "1px solid var(--success)" : "1px solid var(--border)",
                    boxShadow: "var(--shadow-sm)",
                    transition: "all var(--transition-normal)"
                  }}>
                    <div className="d-flex justify-content-between align-items-center">
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                        <span style={{ 
                          fontWeight: 600, 
                          fontSize: "1.1rem", 
                          backgroundColor: isWinner ? "var(--success)" : "var(--surface-light)",
                          color: isWinner ? "white" : "var(--text-secondary)",
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}>
                          {index + 1}
                        </span>
                        <span style={{ fontWeight: isWinner ? 600 : 400, fontSize: "1rem" }}>
                          {playerName} 
                        </span>
                        {isWinner && (
                          <i className="fas fa-crown" style={{ 
                            color: "var(--warning)",
                            fontSize: "1.1rem",
                            animation: "pulse 2s infinite"
                          }}></i>
                        )}
                      </div>
                      <div>
                        <span className={`badge ${isWinner ? "badge-success" : "badge-secondary"}`} style={{
                          padding: "var(--space-xs) var(--space-md)",
                          fontSize: "0.9rem",
                          fontWeight: "600",
                          boxShadow: "var(--shadow-sm)"
                        }}>
                          {score} points
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              
            {!showAllScores && Object.keys(scores).length > 3 && (
              <button 
                onClick={() => setShowAllScores(true)}
                style={{ 
                  alignSelf: "center", 
                  marginTop: "var(--space-sm)",
                  backgroundColor: "var(--surface-light)",
                  color: "var(--text-secondary)"
                }}
              >
                Show {Object.keys(scores).length - 3} more players
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div style={{ marginTop: '15px', fontSize: '14px', color: '#666', padding: '0 15px 15px' }}>
        <p><strong>Scoring:</strong> 10 points per hidden test case passed, 1 point per visible test case during development.</p>
      </div>
    </div>
  );
}

export default MatchResultsPanel;