import React, { useState, useEffect } from 'react';
import { Icons } from '../../components/shared/Icons';

interface Framework {
  id: string;
  code: string;
  name: string;
  color: string;
}

interface FrameworkPickerProps {
  selectedCodes: string[];
  onChange: (codes: string[]) => void;
  disabled?: boolean;
}

/**
 * FrameworkPicker
 * 
 * Multi-select framework picker with checkboxes.
 * Shows all available frameworks with colors.
 */
export function FrameworkPicker({ selectedCodes, onChange, disabled }: FrameworkPickerProps) {
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  // Load frameworks from API
  useEffect(() => {
    async function loadFrameworks() {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch('http://localhost:8080/api/v1/frameworks', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        setFrameworks(data);
      } catch (error) {
        console.error('Failed to load frameworks:', error);
      } finally {
        setLoading(false);
      }
    }
    loadFrameworks();
  }, []);

  function toggleFramework(code: string) {
    if (disabled) return;
    
    if (selectedCodes.includes(code)) {
      onChange(selectedCodes.filter(c => c !== code));
    } else {
      onChange([...selectedCodes, code]);
    }
  }

  function clearAll() {
    if (disabled) return;
    onChange([]);
  }

  const selectedCount = selectedCodes.length;

  return (
    <div style={{ position: 'relative' }}>
      
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: 8,
          border: '1px solid #d1d5db',
          background: disabled ? '#f3f4f6' : 'white',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 14,
          color: '#374151',
          transition: 'all 0.2s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          {selectedCount === 0 ? (
            <span style={{ color: '#9ca3af' }}>Select frameworks...</span>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {selectedCodes.map(code => {
                const fw = frameworks.find(f => f.code === code);
                return (
                  <span
                    key={code}
                    style={{
                      padding: '2px 8px',
                      borderRadius: 99,
                      fontSize: 11,
                      fontWeight: 600,
                      background: fw?.color ? `${fw.color}20` : '#dbeafe',
                      color: fw?.color || '#1e40af',
                      border: `1px solid ${fw?.color || '#2563eb'}`,
                    }}
                  >
                    {code}
                  </span>
                );
              })}
            </div>
          )}
        </div>
        <Icons.ChevronDown style={{
          width: 16,
          height: 16,
          transition: 'transform 0.2s',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
        }} />
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10,
            }}
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              zIndex: 20,
              maxHeight: 300,
              overflow: 'auto',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '12px 14px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f9fafb',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                Select Frameworks
              </span>
              {selectedCount > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  style={{
                    fontSize: 12,
                    color: '#2563eb',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Framework list */}
            {loading ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>
                Loading frameworks...
              </div>
            ) : frameworks.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>
                No frameworks available
              </div>
            ) : (
              <div>
                {frameworks.map(fw => {
                  const isSelected = selectedCodes.includes(fw.code);
                  return (
                    <label
                      key={fw.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 14px',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        background: isSelected ? '#f0f9ff' : 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = '#f9fafb';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleFramework(fw.code)}
                        style={{
                          width: 18,
                          height: 18,
                          cursor: 'pointer',
                          accentColor: fw.color || '#2563eb',
                        }}
                      />

                      {/* Color indicator */}
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: fw.color || '#2563eb',
                        }}
                      />

                      {/* Framework info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: '#111827',
                          }}
                        >
                          {fw.code}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: '#6b7280',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {fw.name}
                        </div>
                      </div>

                      {/* Selected indicator */}
                      {isSelected && (
                        <div style={{ color: fw.color || '#2563eb' }}>
                          <Icons.Check style={{ width: 18, height: 18 }} />
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
