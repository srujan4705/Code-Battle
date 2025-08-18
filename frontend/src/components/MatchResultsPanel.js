import React from 'react';

function MatchResultsPanel({ matchResults }) {
  if (!matchResults || !matchResults.winners || matchResults.winners.length === 0) {
    return null;
  }

  const { winners, challenge, scores } = matchResults;
  const isTie = winners.length > 1;

  return (
    <div className="match-results-panel" style={{
      padding: '15px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      marginBottom: '20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      border: '1px solid #ddd'
    }}>
      <h3 style={{ marginTop: 0, color: '#2c3e50' }}>
        Match Results
      </h3>
      
      {challenge && (
        <div style={{ marginBottom: '10px' }}>
          <p><strong>Challenge:</strong> {challenge.title}</p>
          <p>
            <strong>Test Cases:</strong> {challenge.visibleTestCount} visible, {challenge.hiddenTestCount} hidden
          </p>
        </div>
      )}

      <div style={{ marginBottom: '15px' }}>
        <h4 style={{ color: '#2c3e50' }}>
          {isTie ? 'Winners (Tie)' : 'Winner'}
        </h4>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '10px' 
        }}>
          {winners.map((winner) => (
            <div key={winner.socketId} style={{
              padding: '10px',
              backgroundColor: '#e3f2fd',
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: '1px solid #bbdefb'
            }}>
              <div>
                <span style={{ fontWeight: 'bold' }}>{winner.username}</span>
              </div>
              <div>
                <span style={{ 
                  backgroundColor: '#4caf50', 
                  color: 'white',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  fontSize: '14px'
                }}>
                  {winner.score} points
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 style={{ color: '#2c3e50' }}>All Scores</h4>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '5px' 
        }}>
          {Object.entries(scores)
            .sort((a, b) => b[1] - a[1]) // Sort by score (highest first)
            .map(([socketId, score]) => {
              // Find player name from winners array
              const player = winners.find(w => w.socketId === socketId);
              const playerName = player ? player.username : 'Unknown Player';
              
              return (
                <div key={socketId} style={{
                  padding: '8px',
                  backgroundColor: winners.some(w => w.socketId === socketId) ? '#e8f5e9' : '#f5f5f5',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span>{playerName}</span>
                  </div>
                  <div>
                    <span>{score} points</span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
      
      <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
        <p><strong>Scoring:</strong> 10 points per hidden test case passed, 1 point per visible test case during development.</p>
      </div>
    </div>
  );
}

export default MatchResultsPanel;