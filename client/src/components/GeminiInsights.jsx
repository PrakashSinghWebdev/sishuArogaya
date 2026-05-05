import React from 'react';

/**
 * Gemini AI Insights Component
 * Displays AI-powered health insights from Gemini API
 */
export default function GeminiInsights({ insights, loading, error }) {
  if (loading) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #f3e8ff 0%, #ede9fe 100%)',
        border: '1.5px solid #e9d5ff',
        borderRadius: 14,
        padding: 20,
        marginBottom: 24,
      }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: 600,
          marginBottom: 16,
          color: '#6b21a8'
        }}>
          ✨ AI Health Insights (Gemini)
        </h3>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          minHeight: 100
        }}>
          <div style={{
            width: 20,
            height: 20,
            border: '3px solid #e9d5ff',
            borderTopColor: '#a78bfa',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          <span style={{ color: '#6b21a8', fontWeight: 500 }}>
            Generating insights...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: '#fef2f2',
        border: '1.5px solid #fecaca',
        borderRadius: 14,
        padding: 20,
        marginBottom: 24,
      }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: 600,
          marginBottom: 8,
          color: '#dc2626'
        }}>
          ⚠️ AI Insights Unavailable
        </h3>
        <p style={{
          fontSize: '0.85rem',
          color: '#b91c1c',
          margin: 0
        }}>
          {error}
        </p>
      </div>
    );
  }

  if (!insights) {
    return null;
  }

  // Parse the insights text into sections
  const sections = insights.split(/\n+/).filter(line => line.trim());

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f3e8ff 0%, #ede9fe 100%)',
      border: '1.5px solid #e9d5ff',
      borderRadius: 14,
      padding: 20,
      marginBottom: 24,
    }}>
      <h3 style={{
        fontSize: '1rem',
        fontWeight: 600,
        marginBottom: 16,
        color: '#6b21a8'
      }}>
        ✨ AI Health Insights (Gemini)
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: 12
      }}>
        {sections.map((section, idx) => {
          const isHeader = section.match(/^[\d]+\.|^[A-Z]/);

          return (
            <div key={idx} style={{
              background: '#fff',
              border: '1px solid #e9d5ff',
              borderRadius: 10,
              padding: 12,
              fontSize: '0.9rem',
              lineHeight: '1.5',
              color: isHeader ? '#6b21a8' : '#4a7a8a'
            }}>
              {isHeader ? (
                <strong>{section}</strong>
              ) : (
                section
              )}
            </div>
          );
        })}
      </div>

      <div style={{
        marginTop: 16,
        padding: 12,
        background: '#faf5ff',
        borderRadius: 10,
        fontSize: '0.75rem',
        color: '#6b21a8',
        textAlign: 'center'
      }}>
        💡 Powered by Google Gemini AI
      </div>
    </div>
  );
}
