import React, { useState } from 'react';
import './App.css';

function App() {
  const [input1, setInput1] = useState('');
  const [input2, setInput2] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [copiedLink, setCopiedLink] = useState(null);
  const [highlightedLink, setHighlightedLink] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/intersect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input1, input2 }),
      });

      if (!response.ok) {
        throw new Error('Failed to process inputs');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setInput1('');
    setInput2('');
    setResults(null);
    setError(null);
    setCopiedIndex(null);
  };

  const handleCopyBatch = async (batchText, index) => {
    try {
      await navigator.clipboard.writeText(batchText);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard');
    }
  };

  const handleCopyLink = async (text, linkId, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(`${linkId}-${type}`);
      setHighlightedLink(linkId);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard');
    }
  };

  return (
    <div className="App">
      <div className="container">
        <h1>Scout Link Intersection Tool</h1>
        <p className="subtitle">Find common links between two inputs</p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="input1">Input 1</label>
            <textarea
              id="input1"
              value={input1}
              onChange={(e) => setInput1(e.target.value)}
              placeholder="Paste your first text containing links here..."
              rows="8"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="input2">Input 2</label>
            <textarea
              id="input2"
              value={input2}
              onChange={(e) => setInput2(e.target.value)}
              placeholder="Paste your second text containing links here..."
              rows="8"
              required
            />
          </div>

          <div className="button-group">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Processing...' : 'Find Common Links'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleClear}>
              Clear
            </button>
          </div>
        </form>

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        {results && (
          <div className="results">
            <div className="stats">
              <div className="stat-card">
                <div className="stat-number">{results.count.input1}</div>
                <div className="stat-label">Links in Input 1</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{results.count.input2}</div>
                <div className="stat-label">Links in Input 2</div>
              </div>
              <div className="stat-card highlight">
                <div className="stat-number">{results.count.common}</div>
                <div className="stat-label">Common Links</div>
              </div>
            </div>

            {results.intersection.length > 0 ? (
              <>
                <div className="links-section">
                  <h2>Common Links Found</h2>
                  <ul className="links-list">
                    {results.intersection.map((link, index) => (
                      <li key={index} className={highlightedLink === link.id ? 'highlighted' : ''}>
                        <div className="link-item">
                          <span className="link-name">
                            {link.name || link.display}
                            {link.isHot && <span className="hot-indicator" title="Hot system - potentially dangerous">*</span>}
                          </span>
                          <div className="link-actions">
                            <button
                              className={`btn-copy ${copiedLink === `${link.id}-name` ? 'copied' : ''}`}
                              onClick={() => handleCopyLink(link.name, link.id, 'name')}
                              title="Copy system name"
                            >
                              {copiedLink === `${link.id}-name` ? '✓' : 'Name'}
                            </button>
                            <button
                              className={`btn-copy ${copiedLink === `${link.id}-full` ? 'copied' : ''}`}
                              onClick={() => handleCopyLink(`<a href="showinfo:5//${link.id}">${link.name}</a>`, link.id, 'full')}
                              title="Copy full link"
                            >
                              {copiedLink === `${link.id}-full` ? '✓' : 'Link'}
                            </button>
                            <span className="link-id">ID: {link.id}</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {results.formattedBatches && results.formattedBatches.length > 0 && (
                  <div className="export-section">
                    <h2>Export Formatted Links</h2>
                    <p className="export-description">
                      Click to copy batches (max 3900 in-game characters each). {results.count.batches} batch{results.count.batches !== 1 ? 'es' : ''} available.
                    </p>
                    <div className="batch-buttons">
                      {results.formattedBatches.map((batch, index) => {
                        const metadata = results.batchMetadata?.[index];
                        return (
                          <div key={index} className="batch-item">
                            <button
                              className={`btn btn-export ${copiedIndex === index ? 'copied' : ''}`}
                              onClick={() => handleCopyBatch(batch, index)}
                            >
                              {copiedIndex === index ? '✓ Copied!' : `Copy Batch ${index + 1}`}
                            </button>
                            {metadata && (
                              <div className="batch-info">
                                <div>{metadata.linkCount} link{metadata.linkCount !== 1 ? 's' : ''}</div>
                                <div>{metadata.rawChars} chars → {metadata.inGameChars} in-game</div>
                              </div>
                            )}
                            {!metadata && (
                              <span className="batch-info">{batch.length} chars</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="no-results">
                <p>No common links found between the two inputs.</p>
              </div>
            )}

            <details className="all-links">
              <summary>Show All Extracted Links</summary>
              <div className="links-columns">
                <div className="links-column">
                  <h3>Input 1 Links ({results.links1.length})</h3>
                  <ul>
                    {results.links1.map((link, index) => (
                      <li key={index}>
                        <div className="link-item">
                          <span className="link-name">
                            {link.name || link.display}
                            {link.isHot && <span className="hot-indicator" title="Hot system - potentially dangerous">*</span>}
                          </span>
                          <span className="link-id">ID: {link.id}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="links-column">
                  <h3>Input 2 Links ({results.links2.length})</h3>
                  <ul>
                    {results.links2.map((link, index) => (
                      <li key={index}>
                        <div className="link-item">
                          <span className="link-name">
                            {link.name || link.display}
                            {link.isHot && <span className="hot-indicator" title="Hot system - potentially dangerous">*</span>}
                          </span>
                          <span className="link-id">ID: {link.id}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
