import { useState } from 'react';
import './SearchBar.css';

export default function SearchBar({
  placeholder = 'Search...',
  onSearch,
  results = [],
  isLoading = false,
  noResultsMessage = 'No data found',
  onResultClick,
  highlightKeyword = true,
  searchType = 'default'
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (value.trim().length > 0) {
      onSearch(value);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleResultClick = (result) => {
    if (onResultClick) {
      onResultClick(result);
    }
    setQuery('');
    setIsOpen(false);
  };

  const highlightMatch = (text, query) => {
    if (!highlightKeyword || !query.trim()) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.split(regex).map((part, i) =>
      regex.test(part) ? `<mark key=${i}>${part}</mark>` : part
    );
  };

  return (
    <div className="search-bar-container">
      <div className="search-input-wrapper">
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder={placeholder}
          className="search-input"
          aria-label="Search"
          autoComplete="off"
        />
        {query && (
          <button
            className="search-clear-btn"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && (
        <div className="search-dropdown">
          {isLoading && (
            <div className="search-loading">Loading...</div>
          )}

          {!isLoading && results.length === 0 && query.trim() && (
            <div className="search-no-results">{noResultsMessage}</div>
          )}

          {!isLoading && results.length > 0 && (
            <ul className="search-results-list">
              {results.map((result, idx) => (
                <li
                  key={result._id || idx}
                  className="search-result-item"
                  onClick={() => handleResultClick(result)}
                >
                  <SearchResultCard result={result} query={query} searchType={searchType} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function SearchResultCard({ result, query, searchType }) {
  const highlightText = (text) => {
    if (!text || !query.trim()) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? <mark key={i}>{part}</mark> : part
    );
  };

  if (searchType === 'child') {
    return (
      <div className="result-card">
        <div className="result-header">
          <span className="result-id">{highlightText(result.childId)}</span>
          <span className="result-name">{highlightText(result.name)}</span>
        </div>
        <div className="result-meta">
          <span className="status-badge">{result.nutritionStatus || 'Healthy'}</span>
          {result.dob && <span className="result-date">{new Date(result.dob).toLocaleDateString('en-IN')}</span>}
        </div>
      </div>
    );
  }

  if (searchType === 'asha') {
    return (
      <div className="result-card">
        <div className="result-header">
          <span className="result-id">{highlightText(result.ashaId)}</span>
          <span className="result-name">{highlightText(result.name)}</span>
        </div>
        <div className="result-meta">
          <span className="result-region">{highlightText(result.region)}</span>
          <span className="result-stat">👶 {result.totalChildren} children</span>
        </div>
      </div>
    );
  }

  return (
    <div className="result-card">
      <div className="result-header">
        <span className="result-text">{highlightText(JSON.stringify(result))}</span>
      </div>
    </div>
  );
}
